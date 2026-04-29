package picture

import (
	"crypto/rand"
	"os"
	"path"
	"strings"

	"github.com/danielgtaylor/huma/v2"
)

var mime = map[string]string{
	".jpg":         "image/jpeg",
	".png":         "image/png",
	".gif":         "image/gif",
	".webp":        "image/webp",
	".ico":         "image/x-icon",
	".bmp":         "image/bmp",
	"image/jpeg":   ".jpg",
	"image/jpg":    ".jpg",
	"image/png":    ".png",
	"image/gif":    ".gif",
	"image/webp":   ".webp",
	"image/x-icon": ".ico",
	"image/bmp":    ".bmp",
}

var supported = []string{"jpg", "png", "gif", "webp", "ico", "bmp"}

func validContentType(content_type string) (string, bool) {
	ext, ok := mime[content_type]
	if strings.Contains(content_type, "image/") && ok == true {
		return ext, true
	}
	return "", false
}

func SaveImg(content_type string, dir string, b []byte) (string, error) {
	ext, valid := validContentType(content_type)
	if valid == false {
		return "", huma.Error415UnsupportedMediaType("Supported: " + strings.Join(supported, " "))
	}
	_path := "./" + dir + rand.Text() + ext
	file, err := os.OpenFile(_path, os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return "", huma.Error500InternalServerError("Try again later")
	}
	_, err = file.Write(b)
	if err != nil {
		return "", huma.Error500InternalServerError("Try again later")
	}
	return path.Base(_path), nil
}
