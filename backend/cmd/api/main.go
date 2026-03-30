package main

import (
	"backend/internal/auth"
	"backend/internal/config"
	"backend/internal/server"
	"backend/internal/user"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/samber/do/v2"
)

func addServices(i do.Injector) {
	do.ProvideValue(i, user.ProvideAndRegister(i))
	do.ProvideValue(i, auth.ProvideAndRegister(i))
}

func main() {
	log.Printf("-------------------\n")
	log.Printf("\tSTARTINGG\n")
	log.Printf("-------------------\n")

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
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   strings.Split(cfg.Origins, ","),
		AllowedMethods:   []string{"POST", "OPTIONS", "GET", "DELETE", "PUT"},
		AllowedHeaders:   []string{"*"},
		ExposedHeaders:   []string{},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	return router, nil
}

func ProvideApi(i do.Injector) (huma.API, error) {
	return humachi.New(
		do.MustInvoke[*chi.Mux](i),
		huma.DefaultConfig("transcendence", "1.0.0"),
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
}
