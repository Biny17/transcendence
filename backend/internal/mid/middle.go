package mid

import (
	"log"

	"github.com/danielgtaylor/huma/v2"
	"github.com/lestrrat-go/jwx/v3/jwk"
)

type Middlewares struct {
	Api    huma.API
	PubKey jwk.Key
}

func (mid *Middlewares) TokenMid(ctx huma.Context, next func(huma.Context)) {
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
