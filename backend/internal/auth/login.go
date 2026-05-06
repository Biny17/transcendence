package auth

import (
	"backend/ent"
	"backend/ent/user"
	"backend/internal/pkg"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"
)

type VerifyPwdIn struct {
	Body struct {
		Email    string `json:"email" required:"false" format:"email"`
		Username string `json:"username" required:"false"`
		Password string `json:"password" required:"true"`
	}
}

type VerifyPwdOut struct {
	SetCookie http.Cookie `header:"Set-Cookie"`
}

func (m *VerifyPwdIn) Resolve(ctx huma.Context) []error {
	if m.Body.Email == "" && m.Body.Username == "" {
		return []error{&huma.ErrorDetail{
			Message: "Either email or username must be provided",
		}}
	}
	return nil
}

func (auth *AuthService) VerifyPwd(
	ctx context.Context,
	input *VerifyPwdIn,
) (
	*VerifyPwdOut,
	error,
) {
	var (
		u   *ent.User
		err error
		out VerifyPwdOut
	)

	if input.Body.Email != "" {
		u, err = auth.Client.User.Query().Where(user.EmailEQ(input.Body.Email)).Only(ctx)
	} else {
		u, err = auth.Client.User.Query().Where(user.UsernameEQ(input.Body.Username)).Only(ctx)
	}

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, huma.Error401Unauthorized("invalid credentials")
		}
		return nil, huma.Error500InternalServerError("internal error")
	}

	if pkg.HashPwd(u.Salt, input.Body.Password) != u.Hash {
		return nil, huma.Error401Unauthorized("invalid credentials")
	}
	jwt, err := auth.NewToken(u)
	if err != nil {
		return nil, huma.Error500InternalServerError("internal error")
	}
	domain, secure := auth.getCookieSettings()
	out.SetCookie = http.Cookie{
		Name:     "auth_token",
		Value:    jwt,
		Expires:  time.Now().Add(pkg.TokenLifetime),
		Path:     "/",
		Domain:   domain,
		Secure:   secure,
		HttpOnly: false,
		SameSite: http.SameSiteLaxMode,
	}
	return &out, nil
}

type FortyTwoLoginIn struct{}

type FortyTwoLoginOut struct {
	Status   int    `header:"-"`
	Location string `header:"Location"`
}

func (auth *AuthService) FortyTwoLogin(ctx context.Context, input *FortyTwoLoginIn) (*FortyTwoLoginOut, error) {
	clientID := os.Getenv("FORTYTWO_CLIENT_ID")
	redirectURI := os.Getenv("FORTYTWO_REDIRECT_URI")

	redirectURL := "https://api.intra.42.fr/oauth/authorize" +
		"?client_id=" + clientID +
		"&redirect_uri=" + url.QueryEscape(redirectURI) +
		"&response_type=code"

	return &FortyTwoLoginOut{
		Status:   307,
		Location: redirectURL,
	}, nil
}

type FortyTwoCallbackIn struct {
	Code string `query:"code" required:"true" doc:"Authorization code returned by 42"`
}

type FortyTwoCallbackOut struct {
	SetCookie http.Cookie `header:"Set-Cookie"`
	Location  string      `header:"Location"`
	Status    int         `header:"-"`
}

type FortyTwoUserProfile struct {
	Id    int    `json:"id"`
	Login string `json:"login"`
	Email string `json:"email"`
}

func exchange42Token(code string) (string, error) {
	clientID := os.Getenv("FORTYTWO_CLIENT_ID")
	clientSecret := os.Getenv("FORTYTWO_CLIENT_SECRET")
	redirectURI := os.Getenv("FORTYTWO_REDIRECT_URI")

	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("code", code)
	data.Set("redirect_uri", redirectURI)

	req, _ := http.NewRequest("POST", "https://api.intra.42.fr/oauth/token", strings.NewReader(data.Encode()))
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", huma.Error401Unauthorized("Failed to exchange code with 42")
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", err
	}
	return tokenResp.AccessToken, nil
}

func fetch42UserProfile(accessToken string) (*FortyTwoUserProfile, error) {
	reqUser, _ := http.NewRequest("GET", "https://api.intra.42.fr/v2/me", nil)
	reqUser.Header.Add("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	respUser, err := client.Do(reqUser)
	if err != nil {
		return nil, err
	}
	defer respUser.Body.Close()

	if respUser.StatusCode != http.StatusOK {
		return nil, huma.Error500InternalServerError("Failed to fetch user data")
	}

	var profile FortyTwoUserProfile
	if err := json.NewDecoder(respUser.Body).Decode(&profile); err != nil {
		return nil, err
	}
	return &profile, nil
}

func (auth *AuthService) getOrCreate42User(ctx context.Context, profile *FortyTwoUserProfile) (*ent.User, error) {
	u, err := auth.Client.User.Query().Where(user.EmailEQ(profile.Email)).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			salt := pkg.NewSalt()
			hash := pkg.HashPwd(salt, pkg.NewSalt())

			u, err = auth.Client.User.
				Create().
				SetUsername(profile.Login).
				SetEmail(profile.Email).
				SetAge(18).
				SetHash(hash).
				SetSalt(salt).
				SetVerifiedEmail(true).
				Save(ctx)

			if err != nil {
				return nil, err
			}
			log.Printf("Created new database user for %s!\n", profile.Login)
		} else {
			return nil, err
		}
	}
	return u, nil
}

func (auth *AuthService) FortyTwoCallback(ctx context.Context, input *FortyTwoCallbackIn) (*FortyTwoCallbackOut, error) {
	token, err := exchange42Token(input.Code)
	if err != nil {
		log.Printf("Token exchange error: %v\n", err)
		return nil, huma.Error401Unauthorized("Failed to exchange code with 42")
	}
	log.Println("Successfully exchanged code for 42 Token!")

	profile, err := fetch42UserProfile(token)
	if err != nil {
		log.Printf("User profile fetch error: %v\n", err)
		return nil, huma.Error500InternalServerError("Failed to fetch 42 profile")
	}
	log.Printf("Fetched 42 User: ID=%d, Login=%s, Email=%s\n", profile.Id, profile.Login, profile.Email)

	u, err := auth.getOrCreate42User(ctx, profile)
	if err != nil {
		log.Printf("Database error checking/creating 42 user: %v\n", err)
		return nil, huma.Error500InternalServerError("Database operation failed")
	}

	jwt, err := auth.NewToken(u)
	if err != nil {
		log.Print("Failed to generate JWT:", err)
		return nil, huma.Error500InternalServerError("Failed to generate token")
	}

	return &FortyTwoCallbackOut{
		Status:   307,
		Location: "http://localhost:3000",
		SetCookie: http.Cookie{
			Name:    "auth_token",
			Value:   jwt,
			Expires: time.Now().Add(pkg.TokenLifetime),
			Path:    "/",
		},
	}, nil
}
