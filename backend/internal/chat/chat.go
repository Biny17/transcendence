package chat

import (
	"backend/ent"
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

type ChatService struct {
	Hub *Hub
}

type CreateConversationInput struct {
	Body struct {
		TargetUserID int `json:"target_user_id"`
	}
}

type CreateConversationOutput struct {
	Body struct {
		ConversationID int   `json:"conversation_id"`
		Participants   []int `json:"participants"`
	}
}

type ConversationHistoryInput struct {
	ID     int `path:"id"`
	Limit  int `query:"limit" default:"50"`
	Offset int `query:"offset" default:"0"`
}

type ConversationHistoryOutput struct {
	Body []*MessageResponse
}

type GetConversationsInput struct {
}

type GetConversationsOutput struct {
	Body []*ConversationResponse
}

func ProvideAndRegister(i do.Injector) *ChatService {
	client := do.MustInvoke[*ent.Client](i)
	mux := do.MustInvoke[*chi.Mux](i)
	authSvc := do.MustInvoke[*auth.AuthService](i)
	api := do.MustInvoke[huma.API](i)
	m := do.MustInvoke[*mid.Middleware](i)

	hub := NewHub(client)
	go hub.Run()

	service := &ChatService{
		Hub: hub,
	}

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

	return service
}
