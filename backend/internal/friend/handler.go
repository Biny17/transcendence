package friend

import (
	"context"

	"backend/internal/mid"
	"backend/internal/pkg"

	"github.com/danielgtaylor/huma/v2"
)

type Handler struct {
	service *FriendService
	mid     *mid.Middleware
}

func NewHandler(s *FriendService, m *mid.Middleware) *Handler {
	return &Handler{service: s, mid: m}
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
		return nil, huma.Error401Unauthorized("Unauthorized", err)
	}
	err = h.service.SendFriendRequest(ctx, userId, input.Body.FriendID)
	if err != nil {
		return nil, huma.Error400BadRequest("Failed to send friend request", err)
	}
	return nil, nil
}

func (h *Handler) AcceptFriendRequest(ctx context.Context, input *FriendRequestInput) (*struct{}, error) {
	userId, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized("Unauthorized", err)
	}
	err = h.service.AcceptFriendRequest(ctx, userId, input.Body.FriendID)
	if err != nil {
		return nil, huma.Error400BadRequest("Failed to accept friend request", err)
	}
	return nil, nil
}

func (h *Handler) RejectFriendRequest(ctx context.Context, input *struct {
	Body struct {
		FriendID int `json:"friend_id"`
	}
}) (*struct{}, error) {
	userId, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized("Unauthorized", err)
	}
	err = h.service.RejectFriendRequest(ctx, userId, input.Body.FriendID)
	if err != nil {
		return nil, huma.Error400BadRequest("Failed to reject friend request", err)
	}
	return nil, nil
}

func (h *Handler) DeleteFriend(ctx context.Context, input *struct {
	Body struct {
		FriendID int `json:"friend_id"`
	}
}) (*struct{}, error) {
	userId, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized("Unauthorized", err)
	}
	err = h.service.DeleteFriend(ctx, userId, input.Body.FriendID)
	if err != nil {
		return nil, huma.Error400BadRequest("Failed to delete friend", err)
	}
	return nil, nil
}	

func (h *Handler) GetPendingRequests(ctx context.Context, input *struct{}) (*FriendListOutput, error) {
	userId, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized("Unauthorized", err)
	}
	pending, err := h.service.GetPendingRequests(ctx, userId)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to get pending requests", err)
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
		return nil, huma.Error401Unauthorized("Unauthorized", err)
	}
	friends, err := h.service.GetFriendsList(ctx, userId)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to get friends list", err)
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
