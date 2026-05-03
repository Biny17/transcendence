package chat

import (
	"backend/ent"
	"backend/internal/auth"
	"backend/internal/mid"
	"context"
	"log"
	"github.com/danielgtaylor/huma/v2"
	"github.com/go-chi/chi/v5"
	"github.com/samber/do/v2"
)

type Handler struct {
	Client *ent.Client
	Hub    *Hub
	Auth   *auth.AuthService
	M      *mid.Middleware
}

type CreateConversationInput struct {
	Body struct {
		TargetUserID int `json:"target_user_id"`
	}
}

type CreateConversationOutput struct {
	Body struct {
		ConversationID int   `json:"conversation_id"`
		Participants   []int `json:"participants"`
	}
}

type CreateGroupConversationInput struct {
	Body struct {
		Title          string `json:"title,omitempty"`
		ParticipantIDs []int  `json:"participant_ids"`
	}
}

type CreateGroupConversationOutput struct {
	Body struct {
		ConversationID int    `json:"conversation_id"`
		Title          string `json:"title,omitempty"`
		IsGroup        bool   `json:"is_group"`
		Participants   []int  `json:"participants"`
	}
}

type ConversationHistoryInput struct {
	ID     int `path:"id"`
	Limit  int `query:"limit" default:"50"`
	Offset int `query:"offset" default:"0"`
}

type ConversationHistoryOutput struct {
	Body []*MessageResponse
}

type GetConversationsInput struct {
}

type GetConversationsOutput struct {
	Body []*ConversationResponse
}

type AddParticipantsInput struct {
	ID   int `path:"id"`
	Body struct {
		ParticipantIDs []int `json:"participant_ids"`
	}
}

type AddParticipantsOutput struct {
	Body struct {
		ConversationID int   `json:"conversation_id"`
		Participants   []int `json:"participants"`
	}
}

type LeaveGroupInput struct {
	ID int `path:"id"`
}

type LeaveGroupOutput struct {
	Body struct {
		Success bool `json:"success"`
	}
}

func ProvideAndRegister(i do.Injector) *Handler {
	client := do.MustInvoke[*ent.Client](i)
	mux := do.MustInvoke[*chi.Mux](i)
	authSvc := do.MustInvoke[*auth.AuthService](i)
	api := do.MustInvoke[huma.API](i)
	m := do.MustInvoke[*mid.Middleware](i)

	hub := NewHub(client)
	
	globalGroupID, err := EnsureGlobalGroup(context.Background(), client)
    if err != nil {
        log.Fatalf("failed to ensure global group: %v", err)
    }
	log.Printf("global group ID: %d", globalGroupID)

	go hub.Run()

	h := &Handler{
		Client: client,
		Hub:    hub,
		Auth:   authSvc,
		M:      m,
	}
	h.Register(api, mux)
	return h
}

