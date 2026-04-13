package friend

import (
	"backend/ent"
	"backend/ent/friendship"
	"backend/ent/user"
	"backend/internal/mid"
	"context"
	"errors"

	"github.com/danielgtaylor/huma/v2"
)

type FriendService struct {
	client *ent.Client
}

func NewService(client *ent.Client) *FriendService {
	return &FriendService{client: client}
}

func (s *FriendService) SendFriendRequest(ctx context.Context, userID, friendID int) error {
	if userID == friendID {
		return errors.New("cannot add yourself")
	}
	exists, err := s.client.Friendship.
		Query().
		Where(
			friendship.Or(
				friendship.And(
					friendship.HasUserWith(user.ID(userID)),
					friendship.HasFriendWith(user.ID(friendID)),
				),
				friendship.And(
					friendship.HasUserWith(user.ID(friendID)),
					friendship.HasFriendWith(user.ID(userID)),
				),
			),
		).
		Exist(ctx)

	if err != nil {
		return err
	}
	if exists {
		return errors.New("friendship already exists")
	}

	_, err = s.client.Friendship.
		Create().
		SetUserID(userID).
		SetFriendID(friendID).
		SetStatus("pending").
		Save(ctx)

	return err
}

func (s *FriendService) AcceptFriendRequest(ctx context.Context, userID, friendID int) error {
	f, err := s.client.Friendship.
		Query().
		Where(
			friendship.And(
				friendship.HasUserWith(user.ID(friendID)), // sender
				friendship.HasFriendWith(user.ID(userID)), // receiver
				friendship.StatusEQ("pending"),
			),
		).
		First(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return errors.New("friend request not found")
		}
		return err
	}

	_, err = f.
		Update().
		SetStatus("accepted").
		Save(ctx)

	return err
}

func (s *FriendService) GetFriendsList(ctx context.Context, userID int) ([]*ent.User, error) {
	friendships, err := s.client.Friendship.
		Query().
		Where(
			friendship.And(
				friendship.StatusEQ("accepted"),
				friendship.Or(
					friendship.HasUserWith(user.ID(userID)),
					friendship.HasFriendWith(user.ID(userID)),
				),
			),
		).
		All(ctx)

	if err != nil {
		return nil, err
	}

	var friends []*ent.User

	for _, f := range friendships {
		u, err := f.QueryUser().Only(ctx)
		if err != nil {
			return nil, err
		}

		v, err := f.QueryFriend().Only(ctx)
		if err != nil {
			return nil, err
		}

		if u.ID == userID {
			friends = append(friends, v)
		} else {
			friends = append(friends, u)
		}
	}

	return friends, nil
}

func (s *FriendService) GetPendingRequests(ctx context.Context, userID int) ([]*ent.User, error) {
	friendships, err := s.client.Friendship.Query().
		Where(friendship.HasFriendWith(user.ID(userID)), friendship.Status("pending")).
		WithUser().
		All(ctx)
	if err != nil {
		return nil, err
	}

	users := make([]*ent.User, len(friendships))
	for i, f := range friendships {
		users[i] = f.Edges.User
	}
	return users, nil
}

func (s *FriendService) Register(api huma.API, m *mid.Middleware) {
	handler := NewHandler(s, m)
	handler.Register(api, m)
}
