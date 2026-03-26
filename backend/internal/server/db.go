package server

import (
	"backend/ent"
	"backend/internal/config"
	"fmt"
	"context"
	"github.com/samber/do/v2"
)

// "backend/internal/config"

func ProvideDB(i do.Injector) (*ent.Client, error) {
	cfg := do.MustInvoke[config.Config](i)
	connect_string := fmt.Sprintf(
		"host=%s port=%s user=%s dbname=%s password=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBName, cfg.DBPwd,
	)
	client, err := ent.Open("postgres", connect_string)
	if err != nil {
		return nil, err
	}
	if err := client.Schema.Create(context.Background()); err != nil {
		return nil, err
	}
	return client, nil
}
