package game

import (
	"backend/ent"
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
	LobbyType   string   `json:"lobbyType"`
	TotalPlayer int      `json:"totalPlayer"`
	Players     []Player `json:"players"`
}

type UserResult struct {
	UserName string `json:"username"`
	UserId   *int   `json:"user_id,omitempty"`
	Found    bool   `json:"found"`
}

type GameOut struct {
	GameId  int          `json:"game_id"`
	Results []UserResult `json:"players"`
}

func (gs *GameService) GameResult(
	ctx context.Context,
	input *GameIn,
) (
	*GameOut,
	error,
) {
	out := &GameOut{}
	new_game, err := gs.Client.Game.
		Create().
		SetType(input.LobbyType).
		SetNbPlayer(input.TotalPlayer).
		Save(ctx)
	if err != nil {
		log.Println(err)
		return nil, huma.Error500InternalServerError("Try again later")
	}
	out.GameId = new_game.ID
	for _, player := range input.Players {
		res, err := gs.makeResult(ctx, &player, new_game.ID)
		if err != nil {
			if ent.IsNotFound(err) {
				out.Results = append(out.Results, UserResult{
					UserName: player.Username,
					UserId:   nil,
					Found:    false,
				})
			} else {
				return nil, huma.Error500InternalServerError("Try again later")
			}
		}
		id := res.ID
		out.Results = append(out.Results, UserResult{
			UserName: player.Username,
			UserId:   &id,
			Found:    true,
		})
	}
	return out, nil
}

func (gs *GameService) makeResult(ctx context.Context, pl *Player, gameId int) (*ent.Result, error) {
	user_id, err := gs.Client.User.Query().Where(user.UsernameEQ(pl.Username)).OnlyID(ctx)
	if err != nil {
		return nil, err
	}
	res, err := gs.Client.Result.Create().
		SetKills(pl.Kill).
		SetRank(pl.Rank).
		SetDeath(pl.Death).
		SetGameID(gameId).
		SetUserID(user_id).
		Save(ctx)
	if err != nil {
		return nil, err
	}
	return res, nil
}
