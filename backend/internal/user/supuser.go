package user

import (
	"backend/ent"
	"backend/ent/user"
	"context"

	"github.com/danielgtaylor/huma/v2"
)

type DelUserIn struct {
	UserID    	*int    `query:"user_id"`
	Email 		*string `query:"email"`
	Username  	*string `query:"username"`
}

type DelUserOut struct {
	Message string `json:"message"`
}

func (us *UserService) DelUser(ctx context.Context, input *DelUserIn) (*DelUserOut, error) {
	// err := us.Client.User.
	// 	Delete().
	// 	Wh
	var err error
	if input.UserID != nil {
		_, err = us.Client.User.
			Delete().Where(user.IDEQ(*input.UserID)).Exec(ctx)
	} else if input.Email != nil {
		_, err = us.Client.User.
			Delete().Where(user.EmailEQ(*input.Email)).Exec(ctx)
	} else if input.Username != nil {
		_, err = us.Client.User.
			Delete().Where(user.UsernameEQ(*input.Username)).Exec(ctx)
	} else {
		return nil, huma.Error400BadRequest("Must provide one of user_id, email or username")
	}
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, huma.Error400BadRequest("user not found")
		}
		return nil, huma.Error500InternalServerError("operation failed")
	}
	return &DelUserOut{Message: "user deleted successfully"}, nil
}
