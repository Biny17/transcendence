package game

import (
	"backend/ent"
	"backend/internal/config"
	"backend/internal/mid"
	"backend/internal/pkg/routes"

	"github.com/danielgtaylor/huma/v2"
	"github.com/samber/do/v2"
)

type GameService struct {
	Conf   config.Config
	Client *ent.Client
}

func ProvideGameService(i do.Injector) (*GameService, error) {
	us := &GameService{}
	us.Conf = do.MustInvoke[config.Config](i)
	us.Client = do.MustInvoke[*ent.Client](i)
	return us, nil
}

func ProvideAndRegister(i do.Injector) *GameService {
	gs, _ := ProvideGameService(i)
	gs.Register(do.MustInvoke[huma.API](i), do.MustInvoke[*mid.Middleware](i))
	return gs
}

func (gs *GameService) Register(api huma.API, m *mid.Middleware) {
	huma.Register(api, huma.Operation{
		OperationID: "GAME ADD",
		Method:      "POST",
		Path:        routes.GameAdd,
		Summary:     "Add a game to the database",
		Middlewares: huma.Middlewares{m.Admin},
		Security: []map[string][]string{
			{"credentials": {}},
		},
	}, gs.GameResult)
}
