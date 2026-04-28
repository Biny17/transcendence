package user

import (
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
	data := input.RawBody.Data()
	content_type := data.File.ContentType
	raw, err := io.ReadAll(data.File)
	if err != nil {
		return nil, huma.Error400BadRequest("No file content")
	}
	file, err := picture.SaveImg(content_type, "test/", raw)
	if err != nil {
		return nil, err
	}
	log.Println("new file: ", file)
	return nil, nil
}
