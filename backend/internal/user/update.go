package user

import (
	"backend/ent"
	"backend/internal/pkg"
	"context"
	"fmt"
	"time"

	"github.com/danielgtaylor/huma/v2"
)

type PatchUser struct {
	User_id   int        `path:"id"`
	Body struct {
		Email     *string    `json:"email,omitempty"`
		Username  *string    `json:"username,omitempty"`
		Password  *string    `json:"password,omitempty"`
		Verified  *bool      `json:"verified,omitempty"`
		Age       *int       `json:"age,omitempty"`
		CreatedAt *time.Time `json:"created_at,omitempty"`
	}
}

type PutUser struct {
	User_id   int       `path:"id"`
	Body struct {
		Email     string    `json:"email"`
		Username  string    `json:"username"`
		Password  string    `json:"password"`
		Verified  bool      `json:"verified"`
		Age       int       `json:"age"`
		CreatedAt time.Time `json:"created_at"`
	}
}

func (us *UserService) PutUser(ctx context.Context, input *PutUser) (*InfoOut, error) {
	user, err := us.Client.User.Get(ctx, input.User_id)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, huma.Error404NotFound("user not found", err)
		}
		return nil, huma.Error500InternalServerError("Internal Error", err)
	}
	salt := pkg.NewSalt()
	hash := pkg.HashPwd(salt, input.Body.Password)
	user, err = user.Update().
		SetEmail(input.Body.Email).
		SetUsername(input.Body.Username).
		SetSalt(salt).
		SetHash(hash).
		SetVerifiedEmail(input.Body.Verified).
		SetAge(input.Body.Age).
		SetCreatedAt(input.Body.CreatedAt).
		Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			return nil, huma.Error409Conflict("username or email already exists", err)
		}
		return nil, huma.Error500InternalServerError("Internal Error", err)
	}
	out := &InfoOut{}
	out.Body = append(out.Body, UserInfo{
		Id:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Verified: user.VerifiedEmail,
		Age:      user.Age,
		Created:  user.CreatedAt,
	})
	return out, nil
}

func (pi PatchUser) String() string {
	return fmt.Sprintf(`id: %d\nemail: %v\nusername: %v\npassword: %v
		\nverified: %v\nage: %v\ncreated_at: %v\n`,
		pi.User_id, pi.Body.Email, pi.Body.Username,
		pi.Body.Password, pi.Body.Verified, pi.Body.Age,
		pi.Body.CreatedAt)
}

func (us *UserService) PatchUser(ctx context.Context, input *PatchUser) (*InfoOut, error) {
	fmt.Println(*input)
	user, err := us.Client.User.Get(ctx, input.User_id)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, huma.Error404NotFound("user not found", err)
		}
		return nil, huma.Error500InternalServerError("Internal Error", err)
	}
	up := user.Update()
	if input.Body.Email != nil {
		up.SetEmail(*input.Body.Email)
	}
	if input.Body.Username != nil {
		up.SetUsername(*input.Body.Username)
	}
	if input.Body.Password != nil {
		salt := pkg.NewSalt()
		hash := pkg.HashPwd(salt, *input.Body.Password)
		up.SetSalt(salt)
		up.SetHash(hash)
	}
	if input.Body.Verified != nil {
		up.SetVerifiedEmail(*input.Body.Verified)
	}
	if input.Body.Age != nil {
		up.SetAge(*input.Body.Age)
	}
	if input.Body.CreatedAt != nil && input.Body.CreatedAt.Before(time.Now()) {
		up.SetCreatedAt(*input.Body.CreatedAt)
	}
	user, err = up.Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			return nil, huma.Error409Conflict("username or email already exists", err)
		}
		return nil, huma.Error500InternalServerError("Internal Error", err)
	}
	out := &InfoOut{}
	out.Body = append(out.Body, UserInfo{
		Id:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Verified: user.VerifiedEmail,
		Age:      user.Age,
		Created:  user.CreatedAt,
	})
	return out, nil
}
