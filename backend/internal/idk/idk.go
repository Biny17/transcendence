package idk

import (
	"context"
	"fmt"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
)

type Idk struct {
	Msg string
}

type GreetInput struct {
	Name string `path:"name" example:"edouard" doc:"come from path"`
}

type GreetOutput struct {
	Body struct {
		Message string `json:"message" example:"Hello, world!" doc:"Greeting message"`
	}
}

func NewIdk() (idk *Idk) {
	fmt.Printf("NewIdk\n")
	ret := &Idk{Msg: "Il fait beau aujourd'hui !"}
	return ret
}

func (idk *Idk) Greet(ctx context.Context, input *GreetInput) (*GreetOutput, error) {
	out := &GreetOutput{}
	fmt.Printf("Greet\n")
	out.Body.Message = "Hello, " + input.Name + "! " + idk.Msg
	return out, nil
}

func (idk *Idk) RegisterGreet(api huma.API) {
	fmt.Printf("register greet\n")
	huma.Register(api,
		huma.Operation{
			OperationID: "greet_test",
			Method:      http.MethodGet,
			Path:        "/greet/{name}",
			Summary:     "dumb test to learn how to use Huma",
		},
		idk.Greet,
	)
}
