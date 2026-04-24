package friend

import (
	"backend/ent"
	"backend/internal/mid"

	"github.com/danielgtaylor/huma/v2"
	"github.com/samber/do/v2"
)

func ProvideAndRegister(i do.Injector) *FriendService {
	friendservice := ProvideFriendService(i)
	api := do.MustInvoke[huma.API](i)
	mid := do.MustInvoke[*mid.Middleware](i)
	friendservice.Register(api, mid)
	return friendservice
}

func ProvideFriendService(i do.Injector) (*FriendService) {
	client := do.MustInvoke[*ent.Client](i)
	return NewService(client)
}
