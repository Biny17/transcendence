package gameserv

import (
	"backend/ent/game"
	"backend/ent/result"
	"backend/internal/pkg/myhuma"
	"context"
	"time"

	"entgo.io/ent/dialect/sql"
)

type GameEntry struct {
	ID        int       `json:"id"`
	TimeStamp time.Time `json:"time_stamp"`
	Type      string    `json:"type"`
	NbPlayer  int       `json:"nb_player"`
}

type GameListOut struct {
	Body []GameEntry `json:"games"`
}

func (gs *GameService) ListLastGames(ctx context.Context, input *struct{}) (*GameListOut, error) {
	out := &GameListOut{}
	game_q, err := gs.Client.Game.Query().Order(game.ByTimeStamp(sql.OrderDesc())).Limit(50).All(ctx)
	if err != nil {
		return nil, myhuma.EntErrToHumaErr(err)
	}
	for _, v := range game_q {
		out.Body = append(out.Body, GameEntry{
			ID:        v.ID,
			TimeStamp: v.TimeStamp,
			Type:      v.Type,
			NbPlayer:  v.NbPlayer,
		})
	}
	return out, nil
}

type ResultEntry struct {
	ID       int    `json:"id"`
	Rank     int    `json:"rank"`
	Kills    int    `json:"kills"`
	Death    int    `json:"death"`
	GameID   int    `json:"game_id"`
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
}

type ResultListOut struct {
	Body []ResultEntry `json:"results"`
}

func (gs *GameService) ListLastResults(ctx context.Context, input *struct{}) (*ResultListOut, error) {
	out := &ResultListOut{}
	results_q, err := gs.Client.Result.Query().Order(result.ByID(sql.OrderAsc())).Limit(50).All(ctx)
	if err != nil {
		return nil, myhuma.EntErrToHumaErr(err)
	}
	for _, v := range results_q {
		out.Body = append(out.Body, ResultEntry{
			ID:       v.ID,
			Rank:     v.Rank,
			Kills:    v.Kills,
			Death:    v.Death,
			GameID:   v.GameID,
			UserID:   v.UserID,
			Username: v.Username,
		})
	}
	return out, nil
}
