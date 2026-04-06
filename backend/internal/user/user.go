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

func ProvideAndRegister(i do.Injector) *UserService {
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
		Method:        http.MethodPost,
		Path:          routes.AddUser,
		Summary:       "Add new user to the database",
		DefaultStatus: 201,
	}, us.AddUser)
	huma.Register(api, huma.Operation{
		Method:        http.MethodDelete,
		Path:          routes.DeleteUser,
		Summary:       "Delete user from the database",
		DefaultStatus: 200,
	}, us.DelUser)
	huma.Register(api, huma.Operation{
		Method:  http.MethodGet,
		Path:    routes.FindUser,
		Summary: "Query information from email, username, id",
		Description: `Provide either user_id, email or username as query
			to get specific user information. If no query is given, it will return all users`,
	}, us.QueryUser)
	huma.Register(api, huma.Operation{
		Method:  http.MethodGet,
		Path:    routes.UserById,
		Summary: "Get user by ID in path",
	}, us.GetUserById)
	huma.Register(api, huma.Operation{
		Method:  http.MethodPut,
		Path:    routes.UserById,
		Summary: "Replace user by ID",
	}, us.PutUser)
	huma.Register(api, huma.Operation{
		Method:  http.MethodPatch,
		Path:    routes.UserById,
		Summary: "Update user by ID",
	}, us.PatchUser)
	huma.Register(api, huma.Operation{
		Method:  http.MethodGet,
		Path:    routes.GetUsers,
		Summary: "Get all users",
	}, us.AllUsers)
	huma.Register(api, huma.Operation{
		Method:  http.MethodGet,
		Path:    "/api/users/resend-email/{id}",
		Summary: "Send a new link to verify the email",
	}, us.ResendEmail)
	huma.Register(api, huma.Operation{
		Method:  http.MethodGet,
		Path:    routes.ConfirmEmail,
		Summary: "Confirm the email with the token and user_id in query",
	}, us.ConfirmEmail)
	huma.Register(api, huma.Operation{
		Method:	http.MethodGet,
		Path:	routes.Me,
		Summary: "Use Token in cookie to return information about the user",
	}, us.Me)
}
