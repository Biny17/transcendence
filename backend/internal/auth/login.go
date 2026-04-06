package auth

import (
	"backend/ent"
	"backend/ent/user"
	"backend/internal/pkg"
	"context"
	"net/http"
	"time"

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
	SetCookie http.Cookie `header:"Set-Cookie"`
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
		out VerifyPwdOut
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
		return nil, huma.Error500InternalServerError("internal error")
	}

	if pkg.HashPwd(u.Salt, input.Body.Password) != u.Hash {
		return nil, huma.Error401Unauthorized("invalid credentials")
	}
	jwt, err := auth.NewToken(u)
	if err != nil {
		return nil, huma.Error500InternalServerError("internal error")
	}
	out.SetCookie = http.Cookie{
		Name:   	"auth_token",
		Value:  	jwt,
		Expires:	time.Now().Add(pkg.TokenLifetime),
		Path: 		"/",	
	}
	return &out, nil
}
