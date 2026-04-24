package user

import (
	"backend/ent"
	"backend/ent/predicate"
	"backend/ent/user"
	"backend/internal/pkg"
	"context"
	"log"
	"time"

	"github.com/danielgtaylor/huma/v2"
)

type UserByIdIn struct {
	UserId int `path:"id"`
}

type InfoIn struct {
	UserId   int    `query:"id"`
	Email    string `query:"email"`
	Username string `query:"username"`
}

type UserInfo struct {
	Id       int       `json:"id"`
	Username string    `json:"username"`
	Email    string    `json:"email"`
	Verified bool      `json:"verified"`
	Age      int       `json:"age"`
	Created  time.Time `json:"created_at"`
	Edges    ent.UserEdges `json:"edges"`
}

type InfoOut struct {
	Body []UserInfo
}

func (us *UserService) AllUsers(ctx context.Context, input *struct{}) (*InfoOut, error) {
	users, err := us.Client.User.
		Query().
		All(ctx)
	if err != nil {
		log.Print(err)
		return nil, err
	}
	user_infos := make([]UserInfo, 0, len(users))
	for _, user := range users {
		user_infos = append(user_infos, UserInfo{
			Id:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Verified: user.VerifiedEmail,
			Age:      user.Age,
			Created:  user.CreatedAt,
			Edges: 	  user.Edges,	
		})
	}
	return &InfoOut{Body: user_infos}, nil
}

func (us *UserService) QueryUser(ctx context.Context, input *InfoIn) (*InfoOut, error) {
	var (
		err   error
		res   *ent.User
		query predicate.User
	)
	out := &InfoOut{}
	log.Printf("id: %d | email: %s | username: %s\n", input.UserId, input.Email, input.Username)
	if input.UserId != 0 {
		query = user.IDEQ(input.UserId)
	} else if input.Email != "" {
		query = user.EmailEQ(input.Email)
	} else if input.Username != "" {
		query = user.UsernameEQ(input.Username)
	} else {
		return us.AllUsers(ctx, nil)
	}
	res, err = us.Client.User.
		Query().
		Where(query).
		Only(ctx)
	if err != nil {
		log.Print(err)
		if ent.IsNotFound(err) {
			return nil, huma.Error400BadRequest("user not found")
		}
		return nil, huma.Error500InternalServerError("Server Error")
	}
	out.Body = append(out.Body, UserInfo{
		Id:       res.ID,
		Username: res.Username,
		Email:    res.Email,
		Verified: res.VerifiedEmail,
		Age:      res.Age,
		Created:  res.CreatedAt,
	})
	return out, nil
}

func (us *UserService) GetUserById(ctx context.Context, input *UserByIdIn) (*InfoOut, error) {
	info_in := &InfoIn{
		UserId: input.UserId,
	}
	info_out, err := us.QueryUser(ctx, info_in)
	if err != nil {
		return nil, err
	}
	return info_out, nil
}

func (us *UserService) Me(ctx context.Context, input *struct{}) (*InfoOut, error) {
	id, err := pkg.ContextUserId(ctx)
	if err != nil {
		log.Print(err)
		return nil, huma.Error401Unauthorized("Error, try logging in again")
	}
	return us.GetUserById(ctx, &UserByIdIn{UserId: id})
}
