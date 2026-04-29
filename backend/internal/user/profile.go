package user

import (
	"backend/internal/pkg"
	"backend/internal/pkg/picture"
	"context"
	"io"
	"log"

	"github.com/danielgtaylor/huma/v2"
)

type UploadPPIn struct {
	RawBody huma.MultipartFormFiles[struct {
		File huma.FormFile `form:"file" required:"true"`
	}]
}

func (us *UserService) UploadPP(
	ctx context.Context,
	input *UploadPPIn,
) (
	*struct{},
	error,
) {
	id, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized("Please login again")
	}
	data := input.RawBody.Data()
	content_type := data.File.ContentType
	raw, err := io.ReadAll(data.File)
	if err != nil {
		return nil, huma.Error400BadRequest("No file content")
	}
	file, err := picture.SaveImg(content_type, "img/", raw)
	if err != nil {
		return nil, err
	}
	log.Println("New file: ", file)
	user, err := us.Client.User.UpdateOneID(id).Where()
	return nil, nil
}
