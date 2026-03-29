package user

import (
	"backend/internal/config"
	"backend/internal/pkg/routes"

	"backend/ent"

	"net/http"

	"github.com/danielgtaylor/huma/v2"
	_ "github.com/lib/pq"
	"github.com/samber/do/v2"
)

type UserService struct {
	Conf   config.Config
	Client *ent.Client
}

func ProvideAndRegister(i do.Injector) (*UserService) {
	us, _ := ProvideUserService(i)
	us.Register(do.MustInvoke[huma.API](i))
	return us
}

func ProvideUserService(i do.Injector) (*UserService, error) {
	us := &UserService{}
	us.Conf = do.MustInvoke[config.Config](i)
	us.Client = do.MustInvoke[*ent.Client](i)
	return us, nil
}

func (us *UserService) Register(api huma.API) {
	huma.Register(api, huma.Operation{
		Method:        	http.MethodPost,
		Path:          	routes.AddUser,
		Summary:		"Add new user to the database",
		DefaultStatus:	201,
	}, us.AddUser)
	huma.Register(api, huma.Operation{
		Method:			http.MethodDelete,
		Path:			routes.DeleteUser,
		Summary: 		"Delete user from the database",
		DefaultStatus: 	200,
	}, us.DelUser)
}
