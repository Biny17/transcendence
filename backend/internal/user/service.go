package user

import (
	"backend/internal/config"
	"backend/internal/mid"
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

func ProvideAndRegister(i do.Injector) *UserService {
	us, _ := ProvideUserService(i)
	us.Register(do.MustInvoke[huma.API](i), do.MustInvoke[*mid.Middleware](i))
	return us
}

func ProvideUserService(i do.Injector) (*UserService, error) {
	us := &UserService{}
	us.Conf = do.MustInvoke[config.Config](i)
	us.Client = do.MustInvoke[*ent.Client](i)
	return us, nil
}

func (us *UserService) Register(api huma.API, m *mid.Middleware) {
	huma.Register(api, huma.Operation{
		Method:        http.MethodPost,
		Path:          routes.AddUser,
		Summary:       "USER ADD",
		DefaultStatus: 201,
	}, us.AddUser)
	huma.Register(api, huma.Operation{
		Method:        http.MethodDelete,
		Path:          routes.DeleteUser,
		Summary:       "USER DELETE",
		DefaultStatus: 200,
	}, us.DelUser)
	huma.Register(api, huma.Operation{
		Method:  http.MethodGet,
		Path:    routes.FindUser,
		Summary: "USER QUERY",
		Description: `Provide either user_id, email or username as query
			to get specific user information. If no query is given, it will return all users`,
	}, us.QueryUser)
	huma.Register(api, huma.Operation{
		Method:  http.MethodGet,
		Path:    routes.UserById,
		Summary: "USER BY ID",
	}, us.GetUserById)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPut,
		Path:        routes.UserById,
		Summary:     "USER REPLACE",
		Middlewares: huma.Middlewares{m.Auth},
		Security: []map[string][]string{
			{"cookieAuth": {}},
		},
	}, us.PutUser)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPatch,
		Path:        routes.UserById,
		Summary:     "USER UPDATE",
		Middlewares: huma.Middlewares{m.Auth},
		Security: []map[string][]string{
			{"cookieAuth": {}},
		},
	}, us.PatchUser)
	huma.Register(api, huma.Operation{
		Method:  http.MethodGet,
		Path:    routes.GetUsers,
		Summary: "USER ALL",
	}, us.AllUsers)
	huma.Register(api, huma.Operation{
		Method:  http.MethodGet,
		Path:    "/api/users/resend-email/{id}",
		Summary: "MAIL NEW LINK",
	}, us.ResendEmail)
	huma.Register(api, huma.Operation{
		Method:  http.MethodGet,
		Path:    routes.ConfirmEmail,
		Summary: "MAIL CONFIRM",
	}, us.ConfirmEmail)
	huma.Register(api, huma.Operation{
		Method:      http.MethodGet,
		Path:        routes.Me,
		Summary:     "ME",
		Middlewares: huma.Middlewares{m.Auth},
		Security: []map[string][]string{
			{"cookieAuth": {}},
		},
	}, us.Me)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPut,
		Path:        routes.UpdateProfilePic,
		Summary:     "PICTURE UPLOAD",
		Middlewares: huma.Middlewares{m.Auth},
		Security: []map[string][]string{
			{"cookieAuth": {}},
		},
	}, us.UploadPP)
	huma.Register(api, huma.Operation{
		Method:			http.MethodGet,
		Path:				routes.GetMyPicture,
		Summary: 		"PICTURE MINE",
		Middlewares: huma.Middlewares{m.Auth},
		Security: []map[string][]string{
			{"cookieAuth": {}},
		},
	}, us.GetMyPicture)
}
