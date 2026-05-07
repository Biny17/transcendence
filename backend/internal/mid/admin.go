package mid

import (
	"fmt"
	"log"
	"strings"

	"github.com/danielgtaylor/huma/v2"
)

func extractKey(auth_h string, prefix string) (string, error) {
	if !strings.HasPrefix(auth_h, prefix) {
		return "", fmt.Errorf(`Missing "Authorization: Basic <key>" header`)
	}
	// fmt.Println(auth_h[len(prefix):])
	// secret, err := base64.StdEncoding.DecodeString(auth_h[len(prefix):])
	// if err == nil {
	// 	return string(secret), nil
	// }
	return auth_h[len(prefix):], nil
}

func (mid *Middleware) Admin(ctx huma.Context, next func(huma.Context)) {
	const prefix string = "Basic "
	auth_h := ctx.Header("Authorization")

	log.Println("Authorization: ", auth_h)
	secret_v, err := extractKey(auth_h, prefix)
	if err != nil {
		huma.WriteErr(mid.Api, ctx, 403, err.Error())
		return
	}
	if string(secret_v) != mid.Conf.Credentials {
		huma.WriteErr(mid.Api, ctx, 403, `Invalid Secret`)
		return
	}
	next(ctx)
}
