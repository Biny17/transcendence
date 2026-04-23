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
	Body []*ent.Message
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
		_, err := pkg.ContextUserId(ctx)
		if err != nil {
			return nil, huma.Error401Unauthorized(err.Error())
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

	return service
}
