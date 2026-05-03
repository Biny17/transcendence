package main

import (
	"backend/internal/auth"
	"backend/internal/chat"
	"backend/internal/config"
	"backend/internal/friend"
	"backend/internal/mid"
	"backend/internal/pkg"
	"backend/internal/server"
	"backend/internal/user"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/samber/do/v2"
)

func addServices(i do.Injector) {
	do.ProvideValue(i, auth.ProvideAndRegister(i))
	do.Provide(i, mid.ProvideMiddleware)
	do.ProvideValue(i, user.ProvideAndRegister(i))
	do.ProvideValue(i, friend.ProvideAndRegister(i))
	do.ProvideValue(i, chat.ProvideAndRegister(i))
}

func main() {
	log.Printf("-------------------\n")
	log.Printf("\tSTARTINGG\n")
	log.Printf("-------------------\n")

	err := os.MkdirAll("./img/", 0755)
	if err != nil {
		log.Fatal(err)
	}
	inj := do.New()
	addProviders(inj)
	addServices(inj)

	http.ListenAndServe(
		fmt.Sprintf(":%s", do.MustInvoke[config.Config](inj).Net.Port),
		do.MustInvoke[*chi.Mux](inj),
	)
}

func ProvideRouter(i do.Injector) (*chi.Mux, error) {
	cfg := do.MustInvoke[config.Config](i)
	router := chi.NewMux()
	fmt.Println("allowed origins:", strings.Split(cfg.Origins, ","))
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   strings.Split(cfg.Origins, ","),
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		ExposedHeaders:   []string{},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	return router, nil
}

func ProvideApi(i do.Injector) (huma.API, error) {
	config := huma.DefaultConfig("transcendence", "0.6.9")
	config.Components.SecuritySchemes = map[string]*huma.SecurityScheme{
		"cookieAuth": {
			Type: "apiKey",
			In:   "cookie",
			Name: "auth_token",
		},
	}

	return humachi.New(
		do.MustInvoke[*chi.Mux](i),
		config,
	), nil
}

func addProviders(i do.Injector) {
	cfg, err := config.ProvideConfig(i)
	if err != nil {
		log.Panic(err)
	}
	do.ProvideValue(i, cfg)
	do.Provide(i, server.ProvideDB)
	do.Provide(i, ProvideRouter)
	do.Provide(i, ProvideApi)
	do.ProvideNamed(i, pkg.DoPrivateKey, pkg.PrivateKeyFromFile)
	do.ProvideNamed(i, pkg.DoPublicKey, pkg.ProvidePublicKey)
}
