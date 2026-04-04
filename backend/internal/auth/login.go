package auth

import (
	"backend/internal/pkg"
	"backend/ent"
	"backend/ent/user"
	"context"
	"github.com/danielgtaylor/huma/v2"
)

type VerifyPwdIn struct {
	Body struct {
		Email    string `json:"email" required:"false" format:"email"`
		Username string `json:"username" required:"false"`
		Password string `json:"password" required:"true"`
	}
}

type VerifyPwdOut struct {
	Token string `header:"Authorization"`
}

func (m *VerifyPwdIn) Resolve(ctx huma.Context) []error {
	if m.Body.Email == "" && m.Body.Username == "" {
		return []error{&huma.ErrorDetail{
			Message: "Either email or username must be provided",
		}}
	}
	return nil
}

func (auth *AuthService) VerifyPwd(
	ctx context.Context,
	input *VerifyPwdIn,
) (
	*VerifyPwdOut,
	error,
) {
	var (
		u   *ent.User
		err error
		out	VerifyPwdOut
	)

	if input.Body.Email != "" {
		u, err = auth.Client.User.Query().Where(user.EmailEQ(input.Body.Email)).Only(ctx)
	} else {
		u, err = auth.Client.User.Query().Where(user.UsernameEQ(input.Body.Username)).Only(ctx)
	}

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, huma.Error401Unauthorized("invalid credentials")
		}
		return nil, huma.Error500InternalServerError("oopsie")
	}

	if pkg.HashPwd(u.Salt, input.Body.Password) != u.Hash {
		return nil, huma.Error401Unauthorized("invalid credentials")
	}
	out.Token, err = auth.NewToken(u)
	return &out, nil
}
