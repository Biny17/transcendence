package main

// import (
// 	"backend/internal/config"
// 	"backend/internal/idk"
// 	"backend/internal/user_service"
// 	"log"
// 	"net/http"

// 	"github.com/danielgtaylor/huma/v2"
// 	"github.com/danielgtaylor/huma/v2/adapters/humachi"
// 	"github.com/go-chi/chi/v5"
// )

// func main() {
// 	router := chi.NewMux()
// 	log.Printf("-------------------\n")
// 	log.Printf("\tSTART\n")
// 	log.Printf("-------------------\n")
// 	conf := config.GetConfig()

// 	api := humachi.New(router, huma.DefaultConfig("transcendence", "1.0.0"))

// 	huma.AutoRegister(api, idk.NewIdk())

// 	us := user_service.NewUserService()
// 	us.Register(api)
// 	// huma.AutoRegister(api, us)

// 	log.Fatal(http.ListenAndServe(":"+conf.ApiPort, router))
// }

import (
	"context"
	"log"

	"backend/ent"

	_ "github.com/lib/pq"
)

func main() {
	client, err := ent.Open("postgres", "host=db port=5432 user=tgallet dbname=myappdb password=supermotdepasse sslmode=disable")
	if err != nil {
		log.Fatalf("failed opening connection to postgres: %v", err)
	}
	defer client.Close()
	// Run the auto migration tool.
	if err := client.Schema.Create(context.Background()); err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}
	// insert user
	u, err := client.User.
		Create().
		SetEmail("prouta@example.com").
		SetAge(25).
		SetUsername("prouta").
		Save(context.Background())
	if err != nil {
		log.Fatalf("failed creating user: %v", err)
	}
	log.Printf("user created: %v\n", u.ID)
	users, err := client.User.Query().All(context.Background())
	if err != nil {
		log.Fatalf("failed querying users: %v", err)
	}
	for _, user := range users {
		log.Printf("User: ID=%d, Email=%s, Username=%s, Age=%d\n", user.ID, user.Email, user.Username, user.Age)
	}
}
