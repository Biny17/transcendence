package friend

import (
	"backend/internal/mid"
	"backend/internal/pkg/routes"

	"github.com/danielgtaylor/huma/v2"
)

func (h *Handler) Register(api huma.API, m *mid.Middleware) {
	huma.Register(api, huma.Operation{
		OperationID: "friend-request",
		Method:      "POST",
		Path:        routes.FriendRequest,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Send a friend request",
	}, h.SendFriendRequest)
	huma.Register(api, huma.Operation{
		OperationID: "accept-request",
		Method:      "PATCH",
		Path:        routes.AcceptFriend,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Accept a friend request",
	}, h.AcceptFriendRequest)
	huma.Register(api, huma.Operation{
		OperationID: "get-friend-list",
		Method:      "GET",
		Path:        routes.GetFriendList,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Get friend list",
	}, h.GetFriendsList)
	huma.Register(api, huma.Operation{
		OperationID: "get-pending-requests",
		Method:      "GET",
		Path:        routes.GetPendingList,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Get pending friend requests",
	}, h.GetPendingRequests)
	huma.Register(api, huma.Operation{
		OperationID: "get-sent-requests",
		Method:      "GET",
		Path:        routes.GetSentList,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Get sent friend requests",
	}, h.GetSentRequests)
	huma.Register(api, huma.Operation{
		OperationID: "reject-request",
		Method:      "DELETE",
		Path:        routes.RejectFriend,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Reject a friend request",
	}, h.RejectFriendRequest)
	huma.Register(api, huma.Operation{
		OperationID: "delete-friend",
		Method:      "DELETE",
		Path:        routes.DeleteFriend,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Delete a friend",
	}, h.DeleteFriend)
}

func (s *FriendService) Register(api huma.API, m *mid.Middleware) {
	handler := NewHandler(s, m)
	handler.Register(api, m)
}
