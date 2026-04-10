package friend

import (
	"backend/ent"

	"github.com/danielgtaylor/huma/v2"
	"github.com/samber/do/v2"
)

func ProvideAndRegister(i do.Injector) *FriendService {
	friendservice := ProvideFriendService(i)
	api := do.MustInvoke[huma.API](i)
	friendservice.Register(api)
	return friendservice
}

func ProvideFriendService(i do.Injector) (*FriendService) {
	client := do.MustInvoke[*ent.Client](i)
	return NewService(client)
}
