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
	huma.Register(api, huma.Operation{
		OperationID: "accept-request",
		Method:      "PATCH",
		Path:        routes.SenderId,
		Summary:     "Accept a friend request",
	}, h.AcceptFriendRequest)
}

type FriendRequestInput struct {
	Body struct {
		FriendID int `json:"friend_id"`
	}
}


func (h *Handler) SendFriendRequest(ctx context.Context, input *FriendRequestInput) (*struct{}, error) {
	// TODO: get user from request
	// userId, err := h.auth.GetUserIDFromContext(ctx)
	// err := h.service.SendFriendRequest(ctx, userId, input.Body.FriendID)
	//return nil, err
}

func (h *Handler) AcceptFriendRequest(ctx context.Context, input *FriendRequestInput) (*struct{}, error) {
	// TODO: get user from request
	// userId := input.Body.UserID //hardcoded to be replced
	// err := h.service.AcceptFriendRequest(ctx, userId, input.Body.FriendID)
	//return nil, err
}