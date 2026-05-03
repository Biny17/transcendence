package auth

import (
	"backend/ent"
	"backend/internal/pkg/routes"
	"backend/internal/pkg"
	"log"
	"net/http"
	"github.com/danielgtaylor/huma/v2"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/samber/do/v2"
)

type AuthService struct {
	Client  *ent.Client
	PrivKey jwk.Key
	PubKey  jwk.Key
}

func ProvideAndRegister(i do.Injector) *AuthService {
	auth, err := ProvideAuthService(i)

	if err != nil {
		log.Panic(err)
	}
	auth.Register(i)
	return auth
}

func ProvideAuthService(i do.Injector) (*AuthService, error) {
	var auth AuthService

	auth.PubKey = do.MustInvokeNamed[jwk.Key](i, pkg.DoPublicKey)
	auth.PrivKey = do.MustInvokeNamed[jwk.Key](i, pkg.DoPrivateKey)
	auth.Client = do.MustInvoke[*ent.Client](i)
	return &auth, nil
}

func (auth *AuthService) Register(i do.Injector) {
	api := do.MustInvoke[huma.API](i)
	huma.Register(api, huma.Operation{
		Method:        http.MethodPost,
		Path:          routes.Login,
		Summary:       "LOGIN",
		DefaultStatus: 200,
	}, auth.VerifyPwd)
}


