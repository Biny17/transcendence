package main

import (
	"backend/internal/auth"
	"backend/internal/config"
	"backend/internal/idk"
	"backend/internal/user_service"
	"fmt"
	"log"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

func main() {
	log.Printf("-------------------\n")
	log.Printf("\tSTARTING\n")
	log.Printf("-------------------\n")

	router := chi.NewMux()
	conf := config.GetConfig()
	conf.Debug()

	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   conf.Origins,
		AllowedMethods:   []string{"*"},
		AllowedHeaders:   []string{"*"},
		ExposedHeaders:   []string{},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	api := humachi.New(router, huma.DefaultConfig("transcendence", "1.0.0"))

	huma.AutoRegister(api, idk.NewIdk())
	us := user_service.NewUserService()
	us.Register(api)

	_, err := auth.NewAuthService(conf.KeyPath)
	if err != nil {
		log.Panic(err)
	}

	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", conf.ApiPort), router))
}

