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
	Origins []string
	KeyPath string
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
	viper.SetConfigName("config")
	viper.AddConfigPath(".")

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		log.Panicf("unable to decode into struct: %s", err)
	}
	if err := validator.New().Struct(cfg); err != nil {
		log.Panicf("config validation failed: %s", err)
	}
	viper.SetConfigName("config")
	viper.AddConfigPath(".")
	viper.SetDefault("allowed_origins", []string{"https://*", "http://"})
	if err := viper.ReadInConfig(); err != nil {
		log.Panicf("%s\n", err)
	}
	if err := viper.UnmarshalKey("allowed_origins", &cfg.Origins); err != nil {
		log.Panicf("%s\n", err)
	}
	if err := viper.UnmarshalKey("rsa_key", &cfg.KeyPath); err != nil {
		log.Panicf("%s\n", err)
	}
	return cfg
}

func printAllowedOrigins(origins []string) {
	fmt.Printf("Allowed Origins: %d\n", len(origins))
	for _, origin := range origins {
		fmt.Printf("- %s\n", origin)
	}
}

func (cfg *Config) Debug() {
	fmt.Printf("db_host: %s\ndb_user: %s\ndb_pwd: %s\ndb_name: %s\ndb_port: %s\napi_port: %s\n",
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBPwd,
		cfg.DBName,
		cfg.DBPort,
		cfg.ApiPort,
	)
	fmt.Printf("rsa key path: %s\n", cfg.KeyPath)
	fmt.Printf("Allowed Origins: %d\n", len(cfg.Origins))
	for _, origin := range cfg.Origins {
		fmt.Printf("- %s\n", origin)
	}
}
