package gameserv

import (
	"backend/ent/result"
	"backend/ent/user"
	"backend/internal/pkg/myhuma"
	"context"
	"time"

	"entgo.io/ent/dialect/sql"
)

type Games struct {
	Body struct {
		Game []GameInfo `json:"games"`
	}
}

type PlayerResult struct {
	UserId   int    `json:"user_id"`
	Username string `json:"username"`
	Kill     int    `json:"kill"`
	Death    int    `json:"death"`
	Rank     int    `json:"rank"`
}

type GameInfo struct {
	GameId      int            `json:"gameID"`
	LobbyType   string         `json:"lobbyType"`
	TimeStamp   time.Time      `json:"timestamp"`
	TotalPlayer int            `json:"totalPlayer"`
	Players     []PlayerResult `json:"players"`
}

type UserIdPath struct {
	UserId int `path:"id"`
}

func (gs *GameService) GetUserGames(
	ctx context.Context,
	input *UserIdPath,
) (
	*Games,
	error,
) {
	games := &Games{}
	u, err := gs.Client.User.Query().Where(user.IDEQ(input.UserId)).Only(ctx)
	if err != nil {
		return nil, myhuma.EntErrToHumaErr(err)
	}
	results, err := u.QueryResults().All(ctx)
	if err != nil {
		return nil, myhuma.EntErrToHumaErr(err)
	}
	for _, r := range results {
		gr, err := r.QueryGame().Only(ctx)
		if err != nil {
			return nil, myhuma.EntErrToHumaErr(err)
		}
		players, err := gs.GetPlayersFromGameId(ctx, gr.ID)
		if err != nil {
			return nil, myhuma.EntErrToHumaErr(err)
		}
		games.Body.Game = append(games.Body.Game, GameInfo{
			GameId:      gr.ID,
			LobbyType:   gr.Type,
			TimeStamp:   gr.TimeStamp,
			TotalPlayer: len(players),
			Players:     players,
		})
	}
	return games, nil
}

func (gs *GameService) GetPlayersFromGameId(ctx context.Context, gameid int) ([]PlayerResult, error) {
	ret := []PlayerResult{}
	idk, err := gs.Client.Result.Query().Where(result.GameIDEQ(gameid)).Order(result.ByID(sql.OrderAsc())).All(ctx)
	if err != nil {
		return ret, myhuma.EntErrToHumaErr(err)
	}
	for _, v := range idk {
		ret = append(ret, PlayerResult{
			UserId:   v.UserID,
			Username: v.Username,
			Kill:     v.Kills,
			Death:    v.Death,
			Rank:     v.Rank,
		})
	}
	return ret, nil
}
