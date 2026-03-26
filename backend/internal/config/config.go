package config

import (
	"fmt"
	"log"
	"os"
	"reflect"

	"github.com/go-playground/validator/v10"
	"github.com/samber/do/v2"
	"github.com/spf13/viper"
)

type Config struct {
	JwtSecret string `mapstructure:"JWT_SECRET" validate:"required"`
	DBHost    string `mapstructure:"DB_HOST" validate:"required"`
	DBUser    string `mapstructure:"DB_USER" validate:"required"`
	DBPwd     string `mapstructure:"DB_PWD" validate:"required"`
	DBName    string `mapstructure:"DB_NAME" validate:"required"`
	DBPort    string `mapstructure:"DB_PORT" validate:"required"`
	ApiPort   string `mapstructure:"API_PORT" validate:"required"`
	Gmail     string `mapstructure:"GMAIL"`
	GmailPwd  string `mapstructure:"GMAIL_PASSWORD"`
	Origins   []string
	KeyPath   string `filepath:"true"`
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

func automaticFileCheck(cfg *Config) {
	v := reflect.ValueOf(cfg)
	t := v.Elem().Type()
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		if _, exists := field.Tag.Lookup("filepath"); exists == true {
			value := v.Elem().Field(i).String()
			_, err := os.Stat(value)
			if err != nil {
				log.Printf("file not found: %s\n", value)
			}
		}
	}

}

func ProvideConfig(i do.Injector) (Config, error) {
	var cfg Config
	viper.SetDefault("allowed_origins", []string{"https://*", "http://"})
	viper.SetConfigName("config")
	viper.AddConfigPath(".")
	automaticBindEnv()

	if err := viper.Unmarshal(&cfg); err != nil {
		return cfg, err
	}
	if err := validator.New().Struct(cfg); err != nil {
		return cfg, err
	}

	if err := viper.ReadInConfig(); err != nil {
		return cfg, err
	}
	if err := viper.UnmarshalKey("allowed_origins", &cfg.Origins); err != nil {
		return cfg, err
	}
	if err := viper.UnmarshalKey("rsa_key", &cfg.KeyPath); err != nil {
		return cfg, err
	}
	automaticFileCheck(&cfg)
	return cfg, nil
}

func printAllowedOrigins(origins []string) {
	fmt.Printf("Allowed Origins: %d\n", len(origins))
	for _, origin := range origins {
		fmt.Printf("- %s\n", origin)
	}
}

func (cfg *Config) Debug() {
	v := reflect.ValueOf(cfg).Elem()
	t := v.Type()
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		value := v.Field(i)
		if value.Kind() == reflect.Slice {
			fmt.Printf("%s:\n", field.Name)
			for j := 0; j < value.Len(); j++ {
				fmt.Printf("  - %v\n", value.Index(j).Interface())
			}
		} else {
			fmt.Printf("%s: %v\n", field.Name, value.Interface())
		}
	}
}
