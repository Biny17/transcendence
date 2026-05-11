package gameserv

import (
	"backend/ent"
	"backend/internal/pkg/myhuma"
	"context"
	"log"

	"backend/ent/user"

	"github.com/danielgtaylor/huma/v2"
)

type Player struct {
	Username string `json:"username"`
	Kill     int    `json:"kill"`
	Death    int    `json:"death"`
	Rank     int    `json:"rank"`
}

type GameIn struct {
	Body struct {
		LobbyType   string   `json:"lobbyType"`
		TotalPlayer int      `json:"totalPlayer"`
		Players     []Player `json:"players"`
	}
}

type UserResult struct {
	UserName string `json:"username"`
	UserId   int    `json:"user_id,omitempty"`
	Found    bool   `json:"found"`
}

type GameOut struct {
	Body struct {
		GameId  int          `json:"game_id"`
		Results []UserResult `json:"players"`
	}
}

func (gs *GameService) GameResult(
	ctx context.Context,
	input *GameIn,
) (
	*GameOut,
	error,
) {
	tx, err := gs.Client.Tx(ctx)
	if err != nil {
		return nil, huma.Error500InternalServerError("Try again later")
	}
	out := &GameOut{}
	new_game, err := tx.Game.
		Create().
		SetType(input.Body.LobbyType).
		SetNbPlayer(input.Body.TotalPlayer).
		Save(ctx)
	if err != nil {
		log.Println(err)
		log.Println(tx.Rollback())
		return nil, huma.Error500InternalServerError("Try again later")
	}
	out.Body.GameId = new_game.ID
	for _, player := range input.Body.Players {
		res, err := gs.makeResult(ctx, &player, new_game.ID, tx)
		if err != nil {
			if ent.IsNotFound(err) {
				out.Body.Results = append(out.Body.Results, UserResult{
					UserName: player.Username,
					UserId:   -1,
					Found:    false,
				})
			} else {
				log.Println(tx.Rollback())
				return nil, huma.Error500InternalServerError("Try again later")
			}
		} else {
			out.Body.Results = append(out.Body.Results, UserResult{
				UserName: player.Username,
				UserId:   res.UserID,
				Found:    true,
			})
		}
	}
	err = tx.Commit()
	if err != nil {
		log.Println(err)
		return nil, myhuma.EntErrToHumaErr(err)
	}
	return out, nil
}

func (gs *GameService) makeResult(ctx context.Context, pl *Player, gameId int, tx *ent.Tx) (*ent.Result, error) {
	user_id, err := tx.User.Query().Where(user.UsernameEQ(pl.Username)).OnlyID(ctx)
	if err != nil {
		return nil, err
	}
	res, err := tx.Result.Create().
		SetKills(pl.Kill).
		SetRank(pl.Rank).
		SetDeath(pl.Death).
		SetGameID(gameId).
		SetUserID(user_id).
		SetUsername(pl.Username).
		Save(ctx)
	if err != nil {
		return nil, err
	}
	return res, nil
}
