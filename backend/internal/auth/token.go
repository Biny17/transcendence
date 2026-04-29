package auth

import (
	"backend/ent"
	"backend/internal/pkg"
	"strconv"
	"time"

	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

func (auth *AuthService) NewToken(u *ent.User) (string, error) {
	var tk_str string

	tok, err := jwt.NewBuilder().
		Subject(strconv.Itoa(u.ID)).
		Issuer("transcendence").
		IssuedAt(time.Now()).
		Expiration(time.Now().Add(pkg.TokenLifetime)).
		Build()
		// Claim("email", u.Email).
	if err != nil {
		return tk_str, err
	}
	signed, err := jwt.Sign(tok, jwt.WithKey(jwa.RS256(), auth.PrivKey))
	if err != nil {
		return tk_str, err
	}
	tk_str = string(signed)
	return tk_str, nil
}
