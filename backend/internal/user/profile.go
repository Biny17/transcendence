package user

import (
	"backend/internal/pkg"
	"backend/internal/pkg/picture"
	"context"
	"io"
	"log"
	"path"

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
	file, err := picture.SaveImg(content_type, picture.Img_dir, raw)
	if err != nil {
		return nil, err
	}
	user, err := us.Client.User.Get(ctx, id)
	if err != nil {
		_ = picture.DeleteImg(file, picture.Img_dir)
		return nil, huma.Error500InternalServerError("Try again later")
	}
	oldfile := user.PpPath
	if us.Client.User.UpdateOneID(id).SetPpPath(file).Exec(ctx) != nil {
		_ = picture.DeleteImg(file, picture.Img_dir)
		return nil, huma.Error500InternalServerError("Try again later")
	}
	_ = picture.DeleteImg(oldfile, picture.Img_dir)
	return nil, nil
}

type GetPPOut struct {
	ContentType string `header:"Content-Type"`
	Body        []byte
}

func (us *UserService) GetMyPicture(
	ctx context.Context,
	input *struct{},
) (
	*GetPPOut,
	error,
) {
	out := &GetPPOut{}
	id, err := pkg.ContextUserId(ctx)
	if err != nil {
		return nil, huma.Error401Unauthorized("login")
	}
	user, err := us.Client.User.Get(ctx, id)
	if err != nil {
		return nil, huma.Error500InternalServerError("Try again later")
	}
	if user.PpPath == "" {
		return nil, huma.Error404NotFound("No profile picture") // TODO: Default profile picture
	}
	out.Body, err = picture.GetImg(user.PpPath, picture.Img_dir)
	cont_type, ok := picture.Mime[path.Ext(user.PpPath)]
	if ok == false {
		log.Println("How did we get there")
		return nil, huma.Error500InternalServerError("Very weird error happened")
	}
	out.ContentType = cont_type
	return out, nil
}
