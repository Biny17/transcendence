package chat

import (
	"backend/ent"
	"backend/internal/auth"
	"backend/internal/mid"
	"backend/internal/pkg/routes"

	"github.com/danielgtaylor/huma/v2"
	"github.com/go-chi/chi/v5"
	"github.com/samber/do/v2"
)

type Handler struct {
	Client *ent.Client
	Hub    *Hub
	Auth   *auth.AuthService
	M      *mid.Middleware
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

type CreateGroupConversationInput struct {
	Body struct {
		Title          string `json:"title,omitempty"`
		ParticipantIDs []int  `json:"participant_ids"`
	}
}

type CreateGroupConversationOutput struct {
	Body struct {
		ConversationID int    `json:"conversation_id"`
		Title          string `json:"title,omitempty"`
		IsGroup        bool   `json:"is_group"`
		Participants   []int  `json:"participants"`
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

type AddParticipantsInput struct {
	ID   int `path:"id"`
	Body struct {
		ParticipantIDs []int `json:"participant_ids"`
	}
}

type AddParticipantsOutput struct {
	Body struct {
		ConversationID int   `json:"conversation_id"`
		Participants   []int `json:"participants"`
	}
}

type LeaveGroupInput struct {
	ID int `path:"id"`
}

type LeaveGroupOutput struct {
	Body struct {
		Success bool `json:"success"`
	}
}

func ProvideAndRegister(i do.Injector) *Handler {
	client := do.MustInvoke[*ent.Client](i)
	mux := do.MustInvoke[*chi.Mux](i)
	authSvc := do.MustInvoke[*auth.AuthService](i)
	api := do.MustInvoke[huma.API](i)
	m := do.MustInvoke[*mid.Middleware](i)

	hub := NewHub(client)
	go hub.Run()

	h := &Handler{
		Client: client,
		Hub:    hub,
		Auth:   authSvc,
		M:      m,
	}
	h.Register(api, mux)
	return h
}

func (h *Handler) Register(api huma.API, mux *chi.Mux) {
	mux.Get(routes.Chat, h.handleWebSocket)
	huma.Register(api, huma.Operation{
		OperationID: "create-conversation",
		Method:      "POST",
		Path:        routes.CreateConversation,
		Middlewares: huma.Middlewares{h.M.Auth},
		Summary:     "Create or get a 1-on-1 conversation",
	}, h.CreateConversation)
	huma.Register(api, huma.Operation{
		OperationID: "create-group-conversation",
		Method:      "POST",
		Path:        routes.CreateGroupConversation,
		Middlewares: huma.Middlewares{h.M.Auth},
		Summary:     "Create a new group conversation",
	}, h.CreateGroupConversation)
	huma.Register(api, huma.Operation{
		OperationID: "get-conversation-history",
		Method:      "GET",
		Path:        routes.ConversationHistory,
		Middlewares: huma.Middlewares{h.M.Auth},
		Summary:     "Get conversation history",
	}, h.GetConversationHistory)
	huma.Register(api, huma.Operation{
		OperationID: "get-conversations",
		Method:      "GET",
		Path:        routes.GetConversations,
		Middlewares: huma.Middlewares{h.M.Auth},
		Summary:     "Get all conversations for the current user",
	}, h.GetConversations)
	huma.Register(api, huma.Operation{
		OperationID: "join-group-conversation",
		Method:      "POST",
		Path:        routes.JoinGroupConversation,
		Middlewares: huma.Middlewares{h.M.Auth},
		Summary:     "Join a group conversation",
	}, h.JoinGroupConversation)
	huma.Register(api, huma.Operation{
		OperationID: "add-group-participants",
		Method:      "POST",
		Path:        routes.AddGroupParticipants,
		Middlewares: huma.Middlewares{h.M.Auth},
		Summary:     "Add participants to a group conversation",
	}, h.AddGroupParticipants)
	huma.Register(api, huma.Operation{
		OperationID: "leave-group-conversation",
		Method:      "DELETE",
		Path:        routes.LeaveGroupConversation,
		Middlewares: huma.Middlewares{h.M.Auth},
		Summary:     "Leave a group conversation",
	}, h.LeaveGroupConversation)
}
