package picture

import (
	"crypto/rand"
	"io"
	"log"
	"os"
	"path"
	"strings"

	"github.com/danielgtaylor/huma/v2"
)

var Mime = map[string]string{
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

const Img_dir = "/app/img/"

var supported = []string{"jpg", "png", "gif", "webp", "ico", "bmp"}

func validContentType(content_type string) (string, bool) {
	ext, ok := Mime[content_type]
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
	filename := rand.Text() + ext
	_path := path.Join(dir, filename)
	log.Println(_path)
	file, err := os.OpenFile(_path, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0644)
	if err != nil {
		log.Println(err)
		log.Println("Failed to create the file on the disk")
		log.Println("path: ", _path)
		return "", huma.Error500InternalServerError("Try again later")
	}
	_, err = file.Write(b)
	if err != nil {
		log.Println(err)
		log.Println("Failed to write on a file:", _path)
		return "", huma.Error500InternalServerError("Try again later")
	}
	return filename, nil
}

func DeleteImg(filename string, dir string) error {
	if filename == "" {
		return nil
	}
	err := os.Remove(path.Join(dir, filename))
	return err
}

func GetImg(filename string, dir string) ([]byte, error) {
	file, err := os.Open(path.Join(dir, filename))
	if err != nil {
		return nil, err
	}
	return io.ReadAll(file)
}
