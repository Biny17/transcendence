package pkg

import (
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"time"
)

const (
	TokenLifetime = time.Hour
)

func NewSalt() string {
	salt := rand.Text()
	// fmt.Println(salt)
	return salt
}

func HashPwd(salt string, password string) string {
	hash := sha256.New()
	hash.Write([]byte(salt + password))
	return fmt.Sprintf("%X", hash.Sum(nil))
}
