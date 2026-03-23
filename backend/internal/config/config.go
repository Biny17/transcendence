package config

import (
	"fmt"
	"log"
	"reflect"

	"github.com/go-playground/validator/v10"
	"github.com/spf13/viper"
)

type Config struct {
	DBHost  string `mapstructure:"DB_HOST" validate:"required"`
	DBUser  string `mapstructure:"DB_USER" validate:"required"`
	DBPwd   string `mapstructure:"DB_PWD" validate:"required"`
	DBName  string `mapstructure:"DB_NAME" validate:"required"`
	DBPort  string `mapstructure:"DB_PORT" validate:"required"`
	ApiPort string `mapstructure:"API_PORT" validate:"required"`
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

func GetConfig() Config {
	automaticBindEnv()
	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		panic(fmt.Errorf("unable to decode into struct: %w", err))
	}
	if err := validator.New().Struct(cfg); err != nil {
		panic(fmt.Errorf("config validation failed: %w", err))
	}
	return cfg
}

func printAllowedOrigins(origins []string) {
	fmt.Printf("Allowed Origins: %d\n", len(origins))
	for _, origin := range origins {
		fmt.Printf("- %s\n", origin)
	}
}

func GetAllowedOrigins() []string {
	var origins []string
	var missing bool

	missing = false
	viper.SetConfigName("config")
	viper.AddConfigPath(".")
	if err := viper.ReadInConfig(); err != nil {
		log.Printf("MISSING config.yaml: %s\n", err)
		missing = true
	}
	if err := viper.UnmarshalKey("allowed_origins", &origins); err != nil {
		log.Printf("MISSING config.yamal allowed_origins: %s\n", err)
		missing = true
	}
	if missing {
		//"https://*", "http://*"
		origins = append(origins, "http://*")
		origins = append(origins, "https://*")
	}
	printAllowedOrigins(origins)
	return origins
}

func DebugConfig(cfg *Config) {
	fmt.Printf("db_host: %s\n db_user: %s\n db_pwd: %s\n db_name: %s\n db_port: %s\n api_port: %s\n",
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBPwd,
		cfg.DBName,
		cfg.DBPort,
		cfg.ApiPort,
	)
}
