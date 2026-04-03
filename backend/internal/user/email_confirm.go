package user

import (
	"backend/ent"
	"backend/ent/mailverif"
	"log"

	// "backend/ent/user"
	"context"
	"time"

	"github.com/danielgtaylor/huma/v2"
)

type CallbackIn struct {
	Token  string `query:"token"`
	UserID int    `query:"user_id"`
}

type CallBackOut struct {
	Message string `json:"message"`
}

func (us *UserService) ConfirmEmail(
	ctx context.Context,
	input *CallbackIn,
) (*CallBackOut, error) {
	if input.Token == "" || input.UserID <= 0 {
		return nil, huma.Error400BadRequest("invalid verification query")
	}
	mv, err := us.Client.MailVerif.Query().
		Where(mailverif.TokenEQ(input.Token)).
		Where(mailverif.UserIDEQ(input.UserID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, huma.Error400BadRequest("invalid verification query")
		}
		return nil, huma.Error500InternalServerError("Server Error")
	}
	if mv.ExpiringAt.Before(time.Now()) {
		return nil, huma.Error400BadRequest("verification token expired")
	}
	_, err = us.Client.User.
		UpdateOneID(input.UserID).
		SetVerifiedEmail(true).
		Save(ctx)
	if err != nil {
		log.Print(err)
		return nil, huma.Error500InternalServerError("Server Error")
	}
	err = us.Client.MailVerif.DeleteOneID(mv.ID).Exec(ctx)
	if err != nil {
		log.Print(err)
	}
	return &CallBackOut{Message: "email confirmed !"}, nil
}
