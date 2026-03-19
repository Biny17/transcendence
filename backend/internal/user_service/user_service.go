package user_service

import (
	"backend/internal/config"
	"context"
	"log"

	"backend/ent"
	"fmt"

	"net/http"

	"github.com/danielgtaylor/huma/v2"
	_ "github.com/lib/pq"
)

type UserService struct {
	Conf   config.Config
	Client *ent.Client
}

type AddUserI struct {
	Username string `query:"username"`
	Age      int    `query:"age"`
	Email    string `query:"email"`
}

type AddUserO struct {
}

func NewUserService() *UserService {
	var connect_db string
	us := &UserService{}
	us.Conf = config.GetConfig()
	// "host=<host> port=<port> user=<user> dbname=<database> password=<pass>"
	connect_db = fmt.Sprintf(
		"host=%s port=%s user=%s dbname=%s password=%s sslmode=disable",
		us.Conf.DBHost, us.Conf.DBPort, us.Conf.DBUser, us.Conf.DBName, us.Conf.DBPwd,
	)
	client, err := ent.Open("postgres", connect_db)
	if err != nil {
		log.Panic(err)
	}
	us.Client = client
	if err := client.Schema.Create(context.Background()); err != nil {
		log.Fatalf("failed creating schema resources: %v", err)
	}
	return us
}

func (us *UserService) AddUser(ctx context.Context, input *AddUserI) (*AddUserO, error) {
	log.Printf("username: %s | age: %d | email: %s\n", input.Username, input.Age, input.Email)
	_, err := us.Client.User.
		Create().
		SetUsername(input.Username).
		SetAge(input.Age).
		SetEmail(input.Email).
		Save(ctx)
	if err != nil {
		return nil, err
	}
	log.Printf("Test\n")
	output := &AddUserO{}
	return output, nil
}

func (us *UserService) Register(api huma.API) {
	log.Printf("Registering user service")
	huma.Register(api, huma.Operation{
		Method:  http.MethodGet,
		Path:    "/adduser",
		Summary: "Add a user to the database",
	}, us.AddUser,
	)
}
