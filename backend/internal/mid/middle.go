package mid

import (
	"log"
	"backend/internal/auth"

	"github.com/danielgtaylor/huma/v2"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/samber/do/v2"
)

type Middleware struct {
	Api    huma.API
	PubKey jwk.Key
}

func ProvideMiddleware(i do.Injector) (*Middleware, error) {
	var mid Middleware
	mid.Api = do.MustInvoke[huma.API](i)
	key, err := do.MustInvoke[*auth.AuthService](i).PubKey.Clone()
	if err != nil {
		return nil, err
	}
	mid.PubKey = key
	return &mid, nil
}

func (mid *Middleware) TokenMid(ctx huma.Context, next func(huma.Context)) {
	cooken, err := huma.ReadCookie(ctx, "auth_token")
	if err != nil {
		huma.WriteErr(mid.Api, ctx, 401, "Missing authentification token")
		return
	}
	log.Printf("cooken.Value: %s\n", cooken.Value)
	// if mid.VerifyToken(cooken.Value) == false {
	// 	huma.WriteErr(mid.Api, ctx, 401, "Invalid authentification token")
	// 	return
	// }
	next(ctx)
}
