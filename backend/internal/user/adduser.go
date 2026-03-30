package user

import (
	"backend/ent"
	"backend/internal/pkg"
	"context"
	"log"

	"github.com/danielgtaylor/huma/v2"
)

type AddUserIn struct {
	Body struct {
		Username string `json:"username"`
		Age      int    `json:"age" minimum:"1" maximum:"99"`
		Email    string `json:"email" format:"email"`
		Password string `json:"password"`
		Verified *bool  `json:"verified,omitempty" default:"true"`
	}
}

type AddUserOut struct {
	Message string `json:"message"`
}

func logAddUserInput(input *AddUserIn) {
	log.Printf("username: %s | age: %d | email: %s | password: %s\n",
		input.Body.Username,
		input.Body.Age,
		input.Body.Email,
		input.Body.Password,
	)
}

func (us *UserService) AddUser(ctx context.Context, input *AddUserIn) (*AddUserOut, error) {
	salt := pkg.NewSalt()
	hash := pkg.HashPwd(salt, input.Body.Password)
	verified := true
	if input.Body.Verified != nil {
		verified = *input.Body.Verified
	}

	new_user, err := us.Client.User.
		Create().
		SetUsername(input.Body.Username).
		SetAge(input.Body.Age).
		SetEmail(input.Body.Email).
		SetHash(hash).
		SetSalt(salt).
		SetVerifiedEmail(verified).
		Save(ctx)

	if err != nil {
		log.Print(err)
		if ent.IsConstraintError(err) {
			return nil, huma.Error400BadRequest("username or email already exists")
		}
		return nil, huma.Error500InternalServerError("Internal Error")
	}
	err = us.verifEmail(ctx, new_user)
	if err != nil {
		log.Print(err)
		return nil, huma.Error500InternalServerError("Internal Error")
	}
	return &AddUserOut{Message: "user created successfully"}, nil
}
