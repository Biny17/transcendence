package pkg

import (
	"backend/internal/config"
	"os"

	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/samber/do/v2"
)

const (
	DoPublicKey = "PublicKey"
	DoPrivateKey = "PrivateKey"
)

func PrivateKeyFromFile(i do.Injector) (jwk.Key, error) {
	keyBytes, err := os.ReadFile(do.MustInvoke[config.Config](i).KeyPath)
	if err != nil {
		return nil, err
	}
	key, err := jwk.ParseKey(keyBytes, jwk.WithPEM(true))
	return key, err
}

func ProvidePublicKey(i do.Injector) (jwk.Key, error) {
	return jwk.PublicKeyOf(do.MustInvokeNamed[jwk.Key](i, DoPrivateKey))
}

// func (auth *AuthService) parseKey(keyPath string) error {
// 	keyData, err := os.ReadFile(keyPath)
// 	if err != nil {
// 		return err
// 	}
// 	priv_key, err := jwk.ParseKey(keyData, jwk.WithPEM(true))
// 	if err != nil {
// 		log.Printf("Failed with key path: %s", keyPath)
// 		return err
// 	}
// 	tok, err := jwt.NewBuilder().
// 		Issuer("tgallet").
// 		IssuedAt(time.Now()).
// 		Build()
// 	signed, err := jwt.Sign(tok, jwt.WithKey(jwa.RS256(), priv_key))
// 	if err != nil {
// 		return err
// 	}
// 	pubkey, err := jwk.PublicKeyOf(priv_key)
// 	if err != nil {
// 		return err
// 	}
// 	_, err = jwt.Parse(signed, jwt.WithKey(jwa.RS256(), pubkey))
// 	if err != nil {
// 		return err
// 	}
// 	auth.PrivKey = priv_key
// 	auth.PubKey = pubkey
// 	return nil
// }
