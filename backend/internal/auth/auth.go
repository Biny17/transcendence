package auth

import (
	"backend/ent"
	"backend/internal/config"
	"log"
	"os"
	"time"

	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
	"github.com/samber/do/v2"
)

type AuthService struct {
	Client  *ent.Client
	PrivKey jwk.Key
	PubKey  jwk.Key
}

func ProvideAndRegister(i do.Injector) (*AuthService) {
	auth, err := ProvideAuthService(i)

	if err != nil {
		log.Panic(err)
	}
	auth.Register(i)
	return auth
}

func ProvideAuthService(i do.Injector) (*AuthService, error) {
	var auth AuthService

	keypath := do.MustInvoke[config.Config](i).KeyPath
	err := auth.parseKey(keypath)
	if err != nil {
		return nil, err
	}
	auth.Client = do.MustInvoke[*ent.Client](i)
	return &auth, err
}

func (auth *AuthService) Register(i do.Injector) {
	// api := do.MustInvoke[huma.API](i)
}

func (auth *AuthService) parseKey(keyPath string) error {
	keyData, err := os.ReadFile(keyPath)
	if err != nil {
		return err
	}
	priv_key, err := jwk.ParseKey(keyData, jwk.WithPEM(true))
	if err != nil {
		log.Printf("Failed with key path: %s", keyPath)
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
	auth.PrivKey = priv_key
	auth.PubKey = pubkey
	return nil
}

