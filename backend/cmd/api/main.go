package main

import (
	"backend/internal/config"
	"backend/internal/idk"
	"log"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"
)

func main() {
	router := chi.NewMux()
	log.Printf("-------------------\n")
	log.Printf("\tSTART\n")
	log.Printf("-------------------\n")
	api := humachi.New(router, huma.DefaultConfig("transcendence", "1.0.0"))
	conf := config.GetConfig()
	config.DebugConfig(conf)
	idk := idk.NewIdk()
	huma.AutoRegister(api, idk)
	log.Fatal(http.ListenAndServe(":8080", router))
}
