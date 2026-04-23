package chat

import (
	"backend/ent"
	"backend/internal/auth"
	"backend/internal/pkg/routes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwt"
	"github.com/samber/do/v2"
)

type ChatService struct {
	Hub *Hub
}

func ProvideAndRegister(i do.Injector) *ChatService {
	client := do.MustInvoke[*ent.Client](i)
	mux := do.MustInvoke[*chi.Mux](i)
	authSvc := do.MustInvoke[*auth.AuthService](i)

	hub := NewHub(client)
	go hub.Run()

	service := &ChatService{
		Hub: hub,
	}

	mux.Get(routes.Chat, func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("auth_token")
		if err != nil {
			log.Printf("WS auth missing cookie: %v", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse([]byte(cookie.Value), jwt.WithKey(jwa.RS256(), authSvc.PubKey))
		if err != nil {
			log.Printf("WS auth invalid token: %v", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		sub, exists := token.Subject()
		if !exists {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		userID, err := strconv.Atoi(sub)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		ServeWs(hub, w, r, userID)
	})

	mux.Post(routes.CreateConversation, func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("auth_token")
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		token, err := jwt.Parse([]byte(cookie.Value), jwt.WithKey(jwa.RS256(), authSvc.PubKey))
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		sub, exists := token.Subject()
		if !exists {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		userID, err := strconv.Atoi(sub)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		var req struct {
			TargetUserID int `json:"target_user_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Bad Request", http.StatusBadRequest)
			return
		}
		conv, err := GetOrCreate1on1Conversation(context.Background(), client, userID, req.TargetUserID)
		if err != nil {
			log.Printf("failed to get/create conv: %v", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"conversation_id": conv.ID,
			"participants":    []int{userID, req.TargetUserID},
		})
	})

	mux.Get(routes.ConversationHistory, func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("auth_token")
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		token, err := jwt.Parse([]byte(cookie.Value), jwt.WithKey(jwa.RS256(), authSvc.PubKey))
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		_, exists := token.Subject()
		if !exists {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		convIDStr := chi.URLParam(r, "id")
		convID, err := strconv.Atoi(convIDStr)
		if err != nil {
			http.Error(w, "Invalid conversation ID", http.StatusBadRequest)
			return
		}
		limit := 50
		if limitParam := r.URL.Query().Get("limit"); limitParam != "" {
			if l, err := strconv.Atoi(limitParam); err == nil {
				limit = l
			}
		}

		offset := 0
		if offsetParam := r.URL.Query().Get("offset"); offsetParam != "" {
			if o, err := strconv.Atoi(offsetParam); err == nil {
				offset = o
			}
		}
		messages, err := GetConversationHistory(r.Context(), client, convID, limit, offset)
		if err != nil {
			log.Printf("failed to fetch history: %v", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(messages)
	})

	return service
}
