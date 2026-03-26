package user

import (
	"backend/ent"
	"backend/ent/user"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"fmt"

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
}

func (m *VerifyPwdIn) Resolve(ctx huma.Context) []error {
	if m.Body.Email == "" && m.Body.Username == "" {
		return []error{&huma.ErrorDetail{
			Message: "Either email or username must be provided",
		}}
	}
	return nil
}

func NewSalt() string {
	salt := rand.Text()
	fmt.Println(salt)
	return salt
}

func HashPwd(salt string, password string) string {
	hash := sha256.New()
	hash.Write([]byte(salt + password))
	return fmt.Sprintf("%X", hash.Sum(nil))
}

func (us *UserService) VerifyPwd(
	ctx context.Context,
	input *VerifyPwdIn,
) (
	*VerifyPwdOut,
	error,
) {
	var (
		u   *ent.User
		err error
	)

	if input.Body.Email != "" {
		u, err = us.Client.User.Query().Where(user.EmailEQ(input.Body.Email)).Only(ctx)
	} else {
		u, err = us.Client.User.Query().Where(user.UsernameEQ(input.Body.Username)).Only(ctx)
	}

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, huma.Error401Unauthorized("invalid credentials")
		}
		return nil, huma.Error500InternalServerError("oopsie")
	}

	if HashPwd(u.Salt, input.Body.Password) != u.Hash {
		return nil, huma.Error401Unauthorized("invalid credentials")
	}

	return &VerifyPwdOut{}, nil
}
