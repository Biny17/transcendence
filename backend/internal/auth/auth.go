package auth

import (
	"log"
	"os"
	"time"

	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

type Auth struct {
	Key jwk.Key
}

func parseAndTestKey(keyPath string) (jwk.Key, error) {
	keyData, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, err
	}
	jwk_key, err := jwk.ParseKey(keyData, jwk.WithPEM(true))
	if err != nil {
		log.Print("ici")
		return nil, err
	}
	tok, err := jwt.NewBuilder().
		Issuer("tgallet").
		IssuedAt(time.Now()).
		Build()
	signed, err := jwt.Sign(tok, jwt.WithKey(jwa.RS256(), jwk_key))
	if err != nil {
		return nil, err
	}
	pubkey, err := jwk.PublicKeyOf(jwk_key)
	if err != nil {
		return nil, err
	}
	_, err = jwt.Parse(signed, jwt.WithKey(jwa.RS256(), pubkey))
	if err != nil {
		return nil, err
	}
	// issuer, exist := verifiedToken.Issuer()
	// if exist {
	// 	log.Printf("Token issuer is: %s\n", issuer)
	// }
	return jwk_key, nil
}

func NewAuthService(keyPath string) (*Auth, error) {
	var auth Auth

	key, err := parseAndTestKey(keyPath)
	if err != nil {
		return nil, err
	}
	auth.Key = key
	return &auth, nil
}
