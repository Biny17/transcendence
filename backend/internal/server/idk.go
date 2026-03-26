package server

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
)

type Idk struct {
	LaTeam string
}

type GreetInput struct {
}

type GreetOutput struct {
	Body struct {
		Membres string `json:"membres" example:"Hello, world!"`
		Goat    string `json:"greatest dev of all time" example:"Tristan"`
	}
}

func NewIdk() (idk *Idk) {
	ret := &Idk{LaTeam: "Edouard Shiyan Alix Julien"}
	return ret
}

func (idk *Idk) Greet(ctx context.Context, input *GreetInput) (*GreetOutput, error) {
	out := &GreetOutput{}
	out.Body.Membres = idk.LaTeam
	out.Body.Goat = "Tristan"
	return out, nil
}

func (idk *Idk) RegisterGreet(api huma.API) {
	huma.Register(api,
		huma.Operation{
			OperationID: "members",
			Method:      http.MethodGet,
			Path:        "/team",
			Summary:     "membres du groupe",
		},
		idk.Greet,
	)
}
