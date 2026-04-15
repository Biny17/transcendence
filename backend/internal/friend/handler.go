package friend

import (
	"backend/internal/mid"
	"backend/internal/pkg"
	"context"
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

func (h *Handler) RejectFriendRequest(ctx context.Context, input *struct {
	Body struct {
		FriendID int `json:"friend_id"`
	}
}) (*struct{}, error) {
	userId, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, err
	}
	err = h.service.RejectFriendRequest(ctx, userId, input.Body.FriendID)
	return nil, err
}

func (h *Handler) DeleteFriend(ctx context.Context, input *struct {
	Body struct {
		FriendID int `json:"friend_id"`
	}
}) (*struct{}, error) {
	userId, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, err
	}
	err = h.service.DeleteFriend(ctx, userId, input.Body.FriendID)
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
