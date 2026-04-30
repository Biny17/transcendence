package user

import (
	"strings"

	"github.com/danielgtaylor/huma/v2"
)

type Color string

func (col Color) Resolve(ctx huma.Context, prefix *huma.PathBuffer) []error {
	const alphabet string = "0123456789abcdef"
	lower := Color(strings.ToLower(string(col)))
	good := true
	if len(lower) != 7 {
		good = false
	}
	if lower[0] != '#' {
		good = false
	}
	for i := 1; i < len(lower); i++ {
		if strings.IndexByte(alphabet, lower[i]) == -1 {
			good = false
			break
		}
	}
	if good == false {
		return []error{&huma.ErrorDetail{
			Location: prefix.String(),
			Message:  "Value must be a color in hexadecimal notation #RRGGBB",
			Value:    col,
		}}
	}
	return nil
}
