package chat

import (
	"context"
	"backend/ent/conversation"
	"backend/internal/pkg"
	"log"
	"net/http"
	"strconv"

	"github.com/danielgtaylor/huma/v2"
	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

func (h *Handler) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		log.Printf("WS auth missing cookie: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	token, err := jwt.Parse([]byte(cookie.Value), jwt.WithKey(jwa.RS256(), h.Auth.PubKey))
	if err != nil {
		log.Printf("WS auth invalid token: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	sub, exists := token.Subject()
	if !exists {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID, err := strconv.Atoi(sub)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	ServeWs(h.Hub, w, r, userID)
}

func (h *Handler) CreateConversation(ctx context.Context, input *CreateConversationInput) (*CreateConversationOutput, error) {
	userID, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized(err.Error())
	}
	if userID == input.Body.TargetUserID {
		return nil, huma.Error400BadRequest("cannot create a conversation with yourself")
	}
	isFriend, err := AreFriends(ctx, h.Client, userID, input.Body.TargetUserID)
	if err != nil {
		log.Printf("failed to check friendship: %v", err)
		return nil, huma.Error500InternalServerError("failed to check friendship")
	}
	if !isFriend {
		return nil, huma.Error403Forbidden("must be friends to create a conversation")
	}
	conv, err := GetOrCreate1on1Conversation(ctx, h.Client, userID, input.Body.TargetUserID)
	if err != nil {
		log.Printf("failed to get/create conv: %v", err)
		return nil, huma.Error500InternalServerError("failed to get/create conversation")
	}
	return &CreateConversationOutput{
		Body: struct {
			ConversationID int   `json:"conversation_id"`
			Participants   []int `json:"participants"`
		}{
			ConversationID: conv.ID,
			Participants:   []int{userID, input.Body.TargetUserID},
		},
	}, nil
}

func (h *Handler) CreateGroupConversation(ctx context.Context, input *CreateGroupConversationInput) (*CreateGroupConversationOutput, error) {
	userID, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized(err.Error())
	}
	if len(input.Body.ParticipantIDs) < 2 {
		return nil, huma.Error400BadRequest("a group must have at least 2 other participants")
	}
	idSet := make(map[int]struct{})
	idSet[userID] = struct{}{}
	for _, id := range input.Body.ParticipantIDs {
		idSet[id] = struct{}{}
	}
	allParticipants := make([]int, 0, len(idSet))
	for id := range idSet {
		allParticipants = append(allParticipants, id)
	}
	conv, err := CreateGroupConversation(ctx, h.Client, input.Body.Title, allParticipants)
	if err != nil {
		log.Printf("failed to create group conv: %v", err)
		return nil, huma.Error500InternalServerError("failed to create group conversation")
	}
	return &CreateGroupConversationOutput{
		Body: struct {
			ConversationID int    `json:"conversation_id"`
			Title          string `json:"title,omitempty"`
			IsGroup        bool   `json:"is_group"`
			Participants   []int  `json:"participants"`
		}{
			ConversationID: conv.ID,
			Title:          conv.Title,
			IsGroup:        conv.IsGroup,
			Participants:   allParticipants,
		},
	}, nil
}

func (h *Handler) GetConversationHistory(ctx context.Context, input *ConversationHistoryInput) (*ConversationHistoryOutput, error) {
	userID, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized(err.Error())
	}
	isPart, err := IsParticipant(ctx, h.Client, input.ID, userID)
	if err != nil {
		log.Printf("failed to check participation: %v", err)
		return nil, huma.Error500InternalServerError("failed to verify access")
	}
	if !isPart {
		return nil, huma.Error403Forbidden("not a participant in this conversation")
	}
	messages, err := GetConversationHistory(ctx, h.Client, input.ID, input.Limit, input.Offset)
	if err != nil {
		log.Printf("failed to fetch history: %v", err)
		return nil, huma.Error500InternalServerError("failed to fetch history")
	}
	return &ConversationHistoryOutput{
		Body: messages,
	}, nil
}

func (h *Handler) GetConversations(ctx context.Context, input *GetConversationsInput) (*GetConversationsOutput, error) {
	userID, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized(err.Error())
	}
	convs, err := GetUserConversations(ctx, h.Client, userID)
	if err != nil {
		log.Printf("failed to fetch user conversations: %v", err)
		return nil, huma.Error500InternalServerError("failed to fetch conversations")
	}
	return &GetConversationsOutput{
		Body: convs,
	}, nil
}

func (h *Handler) JoinGroupConversation(ctx context.Context, input *AddParticipantsInput) (*AddParticipantsOutput, error) {
	userID, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized(err.Error())
	}
	conv, err := h.Client.Conversation.Query().Where(conversation.IDEQ(input.ID)).WithParticipants().Only(ctx)
	if err != nil {
		log.Printf("failed to get conversation: %v", err)
		return nil, huma.Error500InternalServerError("failed to get conversation")
	}
	if !conv.IsGroup {
		return nil, huma.Error403Forbidden("conversation is not a group")
	}
	_, err = AddParticipantsToGroup(ctx, h.Client, input.ID, []int{userID})
	if err != nil {
		log.Printf("failed to add participant: %v", err)
		return nil, huma.Error500InternalServerError("failed to add participant")
	}
	updatedConv, err := h.Client.Conversation.Query().Where(conversation.IDEQ(input.ID)).WithParticipants().Only(ctx)
	if err != nil {
		return nil, huma.Error500InternalServerError("failed to fetch updated participants")
	}
	ids := make([]int, 0, len(updatedConv.Edges.Participants))
	for _, p := range updatedConv.Edges.Participants {
		ids = append(ids, p.ID)
	}
	return &AddParticipantsOutput{
		Body: struct {
			ConversationID int   `json:"conversation_id"`
			Participants   []int `json:"participants"`
		}{
			ConversationID: updatedConv.ID,
			Participants:   ids,
		},
	}, nil
}

func (h *Handler) AddGroupParticipants(ctx context.Context, input *AddParticipantsInput) (*AddParticipantsOutput, error) {
	userID, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized(err.Error())
	}
	isPart, err := IsParticipant(ctx, h.Client, input.ID, userID)
	if err != nil {
		return nil, huma.Error500InternalServerError("failed to verify access")
	}
	if !isPart {
		return nil, huma.Error403Forbidden("not a participant in this group")
	}
	_, err = AddParticipantsToGroup(ctx, h.Client, input.ID, input.Body.ParticipantIDs)
	if err != nil {
		return nil, huma.Error500InternalServerError("failed to add participants")
	}
	conv, err := h.Client.Conversation.Query().Where(conversation.IDEQ(input.ID)).WithParticipants().Only(ctx)
	if err != nil {
		return nil, huma.Error500InternalServerError("failed to fetch updated participants")
	}
	ids := make([]int, 0, len(conv.Edges.Participants))
	for _, p := range conv.Edges.Participants {
		ids = append(ids, p.ID)
	}
	return &AddParticipantsOutput{
		Body: struct {
			ConversationID int   `json:"conversation_id"`
			Participants   []int `json:"participants"`
		}{
			ConversationID: conv.ID,
			Participants:   ids,
		},
	}, nil
}

func (h *Handler) LeaveGroupConversation(ctx context.Context, input *LeaveGroupInput) (*LeaveGroupOutput, error) {
	userID, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized(err.Error())
	}
	err = RemoveParticipantFromGroup(ctx, h.Client, input.ID, userID)
	if err != nil {
		return nil, huma.Error500InternalServerError("failed to leave group")
	}
	return &LeaveGroupOutput{
		Body: struct {
			Success bool `json:"success"`
		}{
			Success: true,
		},
	}, nil
}
