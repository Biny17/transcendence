package config

import (
	"fmt"
	"os"
	"reflect"
	"strings"

	"github.com/samber/do/v2"
)

type ConfigDB struct {
	Host string `mapstructure:"DB_HOST"`
	User string `mapstructure:"DB_USER"`
	Pwd  string `mapstructure:"DB_PWD"`
	Name string `mapstructure:"DB_NAME"`
	Port string `mapstructure:"DB_PORT"`
}

type ConfigNet struct {
	Host string `mapstructure:"API_HOST"`
	Port string `mapstructure:"API_PORT"`
}

type ConfigMail struct {
	Address  string `mapstructure:"GMAIL_ADDRESS"`
	Password string `mapstructure:"GMAIL_PASSWORD"`
}

type Config struct {
	DB        ConfigDB
	Gmail     ConfigMail
	Net       ConfigNet
	JwtSecret string `mapstructure:"JWT_SECRET"`
	Origins   string `mapstructure:"ORIGINS"`
	KeyPath   string `mapstructure:"KEYPATH"`
}

func ProvideConfig(i do.Injector) (Config, error) {
	var cfg Config
	v := reflect.ValueOf(&cfg).Elem()
	if err := getEnvMapstructure(v); err != nil {
		return Config{}, err
	}
	debug(v, 0)
	return cfg, nil
}

func getEnvMapstructure(v reflect.Value) error {
	t := v.Type()

	for i := 0; i < t.NumField(); i++ {
		field := v.Field(i)
		fieldType := t.Field(i)

		if field.Kind() == reflect.Struct {
			if err := getEnvMapstructure(field); err != nil {
				return err
			}
			continue
		}
		envKey, ok := fieldType.Tag.Lookup("mapstructure")
		if !ok || envKey == "" {
			continue
		}
		value := os.Getenv(envKey)
		if value == "" {
			return fmt.Errorf("missing required env variable: %s", envKey)
		}
		field.SetString(value)
	}
	return nil
}

func debug(v reflect.Value, depth int) {
	t := v.Type()
	for i := 0; i < t.NumField(); i++ {
		field := v.Field(i)
		if field.Kind() == reflect.Struct {
			fmt.Printf("%s:\n", t.Field(i).Type)
			debug(field, depth+1)
			continue
		}
		fmt.Printf("%s %s\n", strings.Repeat("-", depth*2), field.String())
	}
}
