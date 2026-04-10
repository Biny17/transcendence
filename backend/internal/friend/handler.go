package friend

import (
	"backend/internal/pkg/routes"
	"context"

	"github.com/danielgtaylor/huma/v2"
)

type Handler struct {
	service *FriendService
}

func NewHandler(s *FriendService) *Handler {
	return &Handler{service: s}
}

func (h *Handler) Register(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "friend-request",
		Method:      "POST",
		Path:        routes.FriendRequest,
		Summary:     "Send a friend request",
	}, h.SendFriendRequest)
}

type FriendRequestInput struct {
	Body struct {
		UserID int `json:"user_id"`
		FriendID int `json:"friend_id"`
	}
}


func (h *Handler) SendFriendRequest(ctx context.Context, input *FriendRequestInput) (*struct{}, error) {
	// TODO: get user from request
	userId := input.Body.UserID //hardcoded to be replced
	err := h.service.SendFriendRequest(ctx, userId, input.Body.FriendID)
	return nil, err
}
