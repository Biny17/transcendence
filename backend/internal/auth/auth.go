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
	PrivKey jwk.Key
	PubKey  jwk.Key
}

func (auth *Auth) parseKey(keyPath string) error {
	keyData, err := os.ReadFile(keyPath)
	if err != nil {
		return err
	}
	priv_key, err := jwk.ParseKey(keyData, jwk.WithPEM(true))
	if err != nil {
		log.Print("Failed with key path: %s", keyPath)
		return err
	}
	tok, err := jwt.NewBuilder().
		Issuer("tgallet").
		IssuedAt(time.Now()).
		Build()
	signed, err := jwt.Sign(tok, jwt.WithKey(jwa.RS256(), priv_key))
	if err != nil {
		return err
	}
	pubkey, err := jwk.PublicKeyOf(priv_key)
	if err != nil {
		return err
	}
	_, err = jwt.Parse(signed, jwt.WithKey(jwa.RS256(), pubkey))
	if err != nil {
		return err
	}
	// issuer, exist := verifiedToken.Issuer()
	// if exist {
	// 	log.Printf("Token issuer is: %s\n", issuer)
	// }
	auth.PrivKey = priv_key
	auth.PubKey = pubkey
	return nil
}

func NewAuthService(keyPath string) (*Auth, error) {
	var auth Auth

	err := auth.parseKey(keyPath)
	if err != nil {
		return nil, err
	}
	return &auth, nil
}
