package main

import (
    "context"
    "net/http"

    "github.com/danielgtaylor/huma/v2"
    "github.com/danielgtaylor/huma/v2/adapters/humachi"
    "github.com/go-chi/chi/v5"
	"fmt"
)

type Output struct {
    Body struct {
        Message string `json:"message"`
    }
}

func main() {
    router := chi.NewMux()
    api := humachi.New(router, huma.DefaultConfig("API", "1.0.0"))

    huma.Register(api, huma.Operation{
        OperationID: "get-hello",
        Method:      http.MethodGet,
        Path:        "/hello",
    }, func(ctx context.Context, input *struct{}) (*Output, error) {
        resp := &Output{}
        resp.Body.Message = "Hello, world!"
        return resp, nil
    })
	fmt.Println("hello world !");
    http.ListenAndServe(":8080", router)
}