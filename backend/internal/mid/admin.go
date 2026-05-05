package mid

import (
	"encoding/base64"
	"strings"

	"github.com/danielgtaylor/huma/v2"
)

func (mid *Middleware) Admin(ctx huma.Context, next func(huma.Context)) {
	const prefix string = "Basic "
	auth_h := ctx.Header("Authorization")

	if !strings.HasPrefix(auth_h, prefix) {
		huma.WriteErr(mid.Api, ctx, 403, `Missing "Authorization: Basic <key>" header`)
	}
	secret, err := base64.StdEncoding.DecodeString(auth_h[len(prefix):])
	if err != nil || string(secret) != mid.Conf.Credentials {
		huma.WriteErr(mid.Api, ctx, 403, `Invalid Secret`)
	}
	next(ctx)
}
