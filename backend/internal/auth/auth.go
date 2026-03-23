package auth

import (
	"log"
	"os"
	"time"

	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
	"github.com/lestrrat-go/jwx/v3/jwa"
)

type Auth struct {
	Key jwk.Key
}

func (auth *Auth) Init() (error) {
	keyData, err := os.ReadFile("/path/to/id_rsa")
	if err != nil {
		return err
	}
	key, err := jwk.ParseKey(keyData, jwk.WithPEM(true))
	if err != nil {
		return err
	}
	auth.Key = key

	tok, err := jwt.NewBuilder().
		Issuer("tgallet").
		IssuedAt(time.Now()).
		Build()
	signed, err := jwt.Sign(tok, jwt.WithKey(jwa.RS256(), auth.Key))
	if err != nil {
		return err
	}
	_ = signed

	pubkey, err := jwk.PublicKeyOf(auth.Key)
  	if err != nil {
		return err
	}
	verifiedToken, err := jwt.Parse(signed, jwt.WithKey(jwa.RS256(), pubkey))
	if err != nil {
		return err
	}
	issuer, exist := verifiedToken.Issuer()
	if (exist) {
		log.Printf("Token issuer is: %s\n", issuer)
	}
	return nil
}
