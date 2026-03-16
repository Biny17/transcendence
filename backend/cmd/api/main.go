package main

import (
	"fmt"
	"github.com/spf13/viper"
)

type Config struct {
	Postgres PostgresConfig `mapstructure:"postgres"`
}

type PostgresConfig struct {
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	DB       string `mapstructure:"db"`
}

func LoadConfig() (*Config, error) {
	viper.SetConfigName("config")
	viper.AddConfigPath(".")

	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("fatal error config file: %w", err)
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unable to decode into struct: %w", err)
	}

	return &cfg, nil
}

func main() {
	cfg, err := LoadConfig()
	if err != nil {
		panic(err)
	}

	fmt.Printf(
		"db_user: %s, db_pwd: %s, db_name: %s\n",
		cfg.Postgres.User,
		cfg.Postgres.Password,
		cfg.Postgres.DB,
	)
}
