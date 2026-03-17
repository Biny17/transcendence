package config

import (
	"fmt"
	"reflect"

	"github.com/go-playground/validator/v10"
	"github.com/spf13/viper"
)

type Config struct {
	DBUser string `mapstructure:"DB_USER" validate:"required"`
	DBPwd  string `mapstructure:"DB_PWD" validate:"required"`
	DBName string `mapstructure:"DB_NAME" validate:"required"`
	DBPort int    `mapstructure:"DB_PORT" validate:"required"`
}

func automaticBindEnv() {
	v := reflect.ValueOf(&Config{})
	t := v.Elem().Type()
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		env := field.Tag.Get("mapstructure")
		if env == "" {
			continue
		}
		_ = viper.BindEnv(env)
	}
}

func GetConfig() *Config {
	fmt.Printf("Hello from GetConfig !\n")
	automaticBindEnv()
	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		panic(fmt.Errorf("unable to decode into struct: %w", err))
	}
	if err := validator.New().Struct(cfg); err != nil {
		panic(fmt.Errorf("config validation failed: %w", err))
	}
	return &cfg
}

func DebugConfig(cfg *Config) {
	fmt.Printf("db_user: %s, db_pwd: %s, db_name: %s, db_port: %d\n",
		cfg.DBUser,
		cfg.DBPwd,
		cfg.DBName,
		cfg.DBPort,
	)
}
