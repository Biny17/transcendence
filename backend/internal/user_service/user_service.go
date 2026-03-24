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

type AddUserIn struct {
	Body struct {
		Username string `json:"username" required:"true"`
		Age      int    `json:"age" minimum:"1" maximum:"99" required:"true"`
		Email    string `json:"email" required:"true"`
		Password string `json:"password" required:"true"`
	}
}

type AddUserOut struct {
	message string `json:"message"`
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

func logAddUserInput(input *AddUserIn) {
	log.Printf("username: %s | age: %d | email: %s | password: %s\n",
		input.Body.Username,
		input.Body.Age,
		input.Body.Email,
		input.Body.Password,
	)
}

func (us *UserService) AddUser(ctx context.Context, input *AddUserIn) (*AddUserOut, error) {
	salt := NewSalt()
	hash := HashPwd(salt, input.Body.Password)

	_, err := us.Client.User.
		Create().
		SetUsername(input.Body.Username).
		SetAge(input.Body.Age).
		SetEmail(input.Body.Email).
		SetHash(hash).
		SetSalt(salt).
		Save(ctx)

	if err != nil {
		log.Print(err)
		if ent.IsConstraintError(err) {
			return nil, huma.Error400BadRequest("username or email already exists")
		}
		return nil, huma.Error500InternalServerError("oopsie")
	}
	return &AddUserOut{message: "user created successfully"}, nil
}

func (us *UserService) Register(api huma.API) {
	huma.Register(api, huma.Operation{
		Method:        http.MethodPost,
		Path:          "/adduser",
		Summary:       "Add a user to the database",
		DefaultStatus: 201,
	}, us.AddUser)
}
