package chat

import (
	"backend/ent"
	"backend/ent/conversation"
	"backend/internal/auth"
	"backend/internal/mid"
	"backend/internal/pkg"
	"backend/internal/pkg/routes"
	"context"
	"log"
	"net/http"
	"strconv"

	"github.com/danielgtaylor/huma/v2"
	"github.com/go-chi/chi/v5"
	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwt"
	"github.com/samber/do/v2"
)

// RegisterChatEndpoints registers all chat-related API endpoints to the Huma API.
func RegisterChatEndpoints(
	di do.Injector,
	client *ent.Client,
	mux *chi.Mux,
	authSvc *auth.AuthService,
	api huma.API,
	m *mid.Middleware,
	hub *Hub,
) {
	registerWebSocket(mux, authSvc, hub)
	registerCreateConversation(api, m, client)
	registerCreateGroupConversation(api, m, client)
	registerGetConversationHistory(api, m, client)
	registerGetConversations(api, m, client)
	registerJoinGroupConversation(api, m, client)
	registerAddGroupParticipants(api, m, client)
	registerLeaveGroupConversation(api, m, client)
}

func registerWebSocket(mux *chi.Mux, authSvc *auth.AuthService, hub *Hub) {
	mux.Get(routes.Chat, func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("auth_token")
		if err != nil {
			log.Printf("WS auth missing cookie: %v", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse([]byte(cookie.Value), jwt.WithKey(jwa.RS256(), authSvc.PubKey))
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

		ServeWs(hub, w, r, userID)
	})
}

func registerCreateConversation(api huma.API, m *mid.Middleware, client *ent.Client) {
	huma.Register(api, huma.Operation{
		OperationID: "create-conversation",
		Method:      "POST",
		Path:        routes.CreateConversation,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Create or get a 1-on-1 conversation",
	}, func(ctx context.Context, input *CreateConversationInput) (*CreateConversationOutput, error) {
		userID, err := pkg.ContextUserId(ctx)
		if err != nil {
			return nil, huma.Error401Unauthorized(err.Error())
		}

		if userID == input.Body.TargetUserID {
			return nil, huma.Error400BadRequest("cannot create a conversation with yourself")
		}

		isFriend, err := AreFriends(ctx, client, userID, input.Body.TargetUserID)
		if err != nil {
			log.Printf("failed to check friendship: %v", err)
			return nil, huma.Error500InternalServerError("failed to check friendship")
		}
		if !isFriend {
			return nil, huma.Error403Forbidden("must be friends to create a conversation")
		}

		conv, err := GetOrCreate1on1Conversation(ctx, client, userID, input.Body.TargetUserID)
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
	})
}

func registerCreateGroupConversation(api huma.API, m *mid.Middleware, client *ent.Client) {
	huma.Register(api, huma.Operation{
		OperationID: "create-group-conversation",
		Method:      "POST",
		Path:        routes.CreateGroupConversation,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Create a new group conversation",
	}, func(ctx context.Context, input *CreateGroupConversationInput) (*CreateGroupConversationOutput, error) {
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

		conv, err := CreateGroupConversation(ctx, client, input.Body.Title, allParticipants)
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
	})
}

func registerGetConversationHistory(api huma.API, m *mid.Middleware, client *ent.Client) {
	huma.Register(api, huma.Operation{
		OperationID: "get-conversation-history",
		Method:      "GET",
		Path:        routes.ConversationHistory,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Get conversation history",
	}, func(ctx context.Context, input *ConversationHistoryInput) (*ConversationHistoryOutput, error) {
		userID, err := pkg.ContextUserId(ctx)
		if err != nil {
			return nil, huma.Error401Unauthorized(err.Error())
		}

		isPart, err := IsParticipant(ctx, client, input.ID, userID)
		if err != nil {
			log.Printf("failed to check participation: %v", err)
			return nil, huma.Error500InternalServerError("failed to verify access")
		}
		if !isPart {
			return nil, huma.Error403Forbidden("not a participant in this conversation")
		}

		messages, err := GetConversationHistory(ctx, client, input.ID, input.Limit, input.Offset)
		if err != nil {
			log.Printf("failed to fetch history: %v", err)
			return nil, huma.Error500InternalServerError("failed to fetch history")
		}

		return &ConversationHistoryOutput{
			Body: messages,
		}, nil
	})
}

func registerGetConversations(api huma.API, m *mid.Middleware, client *ent.Client) {
	huma.Register(api, huma.Operation{
		OperationID: "get-conversations",
		Method:      "GET",
		Path:        routes.GetConversations,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Get all conversations for the current user",
	}, func(ctx context.Context, input *GetConversationsInput) (*GetConversationsOutput, error) {
		userID, err := pkg.ContextUserId(ctx)
		if err != nil {
			return nil, huma.Error401Unauthorized(err.Error())
		}

		convs, err := GetUserConversations(ctx, client, userID)
		if err != nil {
			log.Printf("failed to fetch user conversations: %v", err)
			return nil, huma.Error500InternalServerError("failed to fetch conversations")
		}

		return &GetConversationsOutput{
			Body: convs,
		}, nil
	})
}

func registerJoinGroupConversation(api huma.API, m *mid.Middleware, client *ent.Client) {
	huma.Register(api, huma.Operation{
		OperationID: "join-group-conversation",
		Method:      "POST",
		Path:        routes.JoinGroupConversation,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Join a group conversation",
	}, func(ctx context.Context, input *AddParticipantsInput) (*AddParticipantsOutput, error) {
		userID, err := pkg.ContextUserId(ctx)
		if err != nil {
			return nil, huma.Error401Unauthorized(err.Error())
		}

		conv, err := client.Conversation.Query().Where(conversation.IDEQ(input.ID)).WithParticipants().Only(ctx)
		if err != nil {
			log.Printf("failed to get conversation: %v", err)
			return nil, huma.Error500InternalServerError("failed to get conversation")
		}

		if !conv.IsGroup {
			return nil, huma.Error403Forbidden("conversation is not a group")
		}

		_, err = AddParticipantsToGroup(ctx, client, input.ID, []int{userID})
		if err != nil {
			log.Printf("failed to add participant: %v", err)
			return nil, huma.Error500InternalServerError("failed to add participant")
		}

		updatedConv, err := client.Conversation.Query().Where(conversation.IDEQ(input.ID)).WithParticipants().Only(ctx)
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
	})
}

func registerAddGroupParticipants(api huma.API, m *mid.Middleware, client *ent.Client) {
	huma.Register(api, huma.Operation{
		OperationID: "add-group-participants",
		Method:      "POST",
		Path:        routes.AddGroupParticipants,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Add participants to a group conversation",
	}, func(ctx context.Context, input *AddParticipantsInput) (*AddParticipantsOutput, error) {
		userID, err := pkg.ContextUserId(ctx)
		if err != nil {
			return nil, huma.Error401Unauthorized(err.Error())
		}

		isPart, err := IsParticipant(ctx, client, input.ID, userID)
		if err != nil {
			return nil, huma.Error500InternalServerError("failed to verify access")
		}
		if !isPart {
			return nil, huma.Error403Forbidden("not a participant in this group")
		}

		_, err = AddParticipantsToGroup(ctx, client, input.ID, input.Body.ParticipantIDs)
		if err != nil {
			return nil, huma.Error500InternalServerError("failed to add participants")
		}

		conv, err := client.Conversation.Query().Where(conversation.IDEQ(input.ID)).WithParticipants().Only(ctx)
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
	})
}

func registerLeaveGroupConversation(api huma.API, m *mid.Middleware, client *ent.Client) {
	huma.Register(api, huma.Operation{
		OperationID: "leave-group-conversation",
		Method:      "DELETE",
		Path:        routes.LeaveGroupConversation,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Leave a group conversation",
	}, func(ctx context.Context, input *LeaveGroupInput) (*LeaveGroupOutput, error) {
		userID, err := pkg.ContextUserId(ctx)
		if err != nil {
			return nil, huma.Error401Unauthorized(err.Error())
		}

		err = RemoveParticipantFromGroup(ctx, client, input.ID, userID)
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
	})
}
