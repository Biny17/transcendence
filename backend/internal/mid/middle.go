package mid

import (
	"backend/internal/auth"
	"log"
	"strconv"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
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

func (mid *Middleware) Auth(ctx huma.Context, next func(huma.Context)) {
	cooken, err := huma.ReadCookie(ctx, "auth_token")
	if err != nil {
		huma.WriteErr(mid.Api, ctx, 401, "Missing authentification token")
		return
	}
	log.Printf("cooken.Value: %s\n", cooken.Value)
	token, err := jwt.Parse([]byte(cooken.Value), jwt.WithKey(jwa.RS256(), mid.PubKey))
	exp, exp_exist := token.Expiration()
	sub, sub_exist := token.Subject()
	if err != nil || !exp_exist || exp.Before(time.Now()) || !sub_exist {
		huma.WriteErr(mid.Api, ctx, 401, "Invalid Token")
		return
	}
	sub_int, err := strconv.Atoi(sub)
	if err != nil {
		huma.WriteErr(mid.Api, ctx, 401, "Invalid Token")
		return
	}
	ctx = huma.WithValue(ctx, "sub", sub_int)
	next(ctx)
}
