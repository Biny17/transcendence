package mid

import (
<<<<<<< HEAD
	"encoding/base64"
=======
	"fmt"
	"log"
>>>>>>> origin/backend
	"strings"

	"github.com/danielgtaylor/huma/v2"
)

<<<<<<< HEAD
=======
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

>>>>>>> origin/backend
func (mid *Middleware) Admin(ctx huma.Context, next func(huma.Context)) {
	const prefix string = "Basic "
	auth_h := ctx.Header("Authorization")

<<<<<<< HEAD
	if !strings.HasPrefix(auth_h, prefix) {
		huma.WriteErr(mid.Api, ctx, 403, `Missing "Authorization: Basic <key>" header`)
	}
	secret, err := base64.StdEncoding.DecodeString(auth_h[len(prefix):])
	if err != nil || string(secret) != mid.Conf.Credentials {
		huma.WriteErr(mid.Api, ctx, 403, `Invalid Secret`)
=======
	log.Println("Authorization: ", auth_h)
	secret_v, err := extractKey(auth_h, prefix)
	if err != nil {
		huma.WriteErr(mid.Api, ctx, 403, err.Error())
		return
	}
	if string(secret_v) != mid.Conf.Credentials {
		huma.WriteErr(mid.Api, ctx, 403, `Invalid Secret`)
		return
>>>>>>> origin/backend
	}
	next(ctx)
}
