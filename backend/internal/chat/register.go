package chat

import (
	"backend/internal/pkg/routes"

	"github.com/danielgtaylor/huma/v2"
	"github.com/go-chi/chi/v5"
)

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
