package friend

import (
	"backend/internal/mid"
	"backend/internal/pkg"
	"backend/internal/pkg/routes"
	"context"

	"github.com/danielgtaylor/huma/v2"
)

type Handler struct {
	service *FriendService
	mid     *mid.Middleware
}

func NewHandler(s *FriendService, m *mid.Middleware) *Handler {
	return &Handler{service: s, mid: m}
}

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
		Path:        routes.SenderId,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Accept a friend request",
	}, h.AcceptFriendRequest)
	huma.Register(api, huma.Operation{
		OperationID: "get-friend-list",
		Method:      "GET",
		Path:        routes.FriendList,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Get friend list",
	}, h.GetFriendsList)
	huma.Register(api, huma.Operation{
		OperationID: "get-pending-requests",
		Method:      "GET",
		Path:        routes.PendingList,
		Middlewares: huma.Middlewares{m.Auth},
		Summary:     "Get pending friend requests",
	}, h.GetPendingRequests)
}

type FriendOutput struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

type FriendListOutput struct {
	Body []FriendOutput
}

type FriendRequestInput struct {
	Body struct {
		FriendID int `json:"friend_id"`
	}
}

func (h *Handler) SendFriendRequest(ctx context.Context, input *FriendRequestInput) (*struct{}, error) {
	userId, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, err
	}
	err = h.service.SendFriendRequest(ctx, userId, input.Body.FriendID)
	return nil, err
}

func (h *Handler) AcceptFriendRequest(ctx context.Context, input *FriendRequestInput) (*struct{}, error) {
	userId, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, err
	}
	err = h.service.AcceptFriendRequest(ctx, userId, input.Body.FriendID)
	return nil, err
}

func (h *Handler) GetPendingRequests(ctx context.Context, input *struct{}) (*FriendListOutput, error) {
	userId, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, err
	}
	pending, err := h.service.GetPendingRequests(ctx, userId)
	if err != nil {
		return nil, err
	}

	output := make([]FriendOutput, len(pending))
	for i, f := range pending {
		output[i] = FriendOutput{
			Username: f.Username,
			Email:    f.Email,
			ID:       f.ID,
		}
	}

	return &FriendListOutput{Body: output}, nil
}

func (h *Handler) GetFriendsList(ctx context.Context, input *struct{}) (*FriendListOutput, error) {
	userId, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, err
	}
	friends, err := h.service.GetFriendsList(ctx, userId)
	if err != nil {
		return nil, err
	}

	output := make([]FriendOutput, len(friends))
	for i, f := range friends {
		output[i] = FriendOutput{
			Username: f.Username,
			Email:    f.Email,
			ID:       f.ID,
		}
	}

	return &FriendListOutput{Body: output}, nil
}
