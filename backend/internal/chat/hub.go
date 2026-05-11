package chat

import (
	"context"
	"encoding/json"
	"log"

	"backend/ent"
	"backend/ent/conversation"
)

type Hub struct {
	Clients map[int]map[*Client]bool

	// Inbound messages from the clients.
	Broadcast chan []byte

	Register chan *Client

	Unregister chan *Client

	OnlineUsersReq chan chan []int

	DB *ent.Client
}

func NewHub(db *ent.Client) *Hub {
	return &Hub{
		Broadcast:      make(chan []byte),
		Register:       make(chan *Client),
		Unregister:     make(chan *Client),
		OnlineUsersReq: make(chan chan []int),
		Clients:        make(map[int]map[*Client]bool),
		DB:             db,
	}
}

func (h *Hub) GetOnlineUsers() []int {
	req := make(chan []int)
	h.OnlineUsersReq <- req
	return <-req
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			if h.Clients[client.UserID] == nil {
				h.Clients[client.UserID] = make(map[*Client]bool)
			}
			h.Clients[client.UserID][client] = true

		case client := <-h.Unregister:
			if clients, ok := h.Clients[client.UserID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.Send)
					if len(clients) == 0 {
						delete(h.Clients, client.UserID)
					}
				}
			}

		case req := <-h.OnlineUsersReq:
			users := make([]int, 0, len(h.Clients))
			for userID := range h.Clients {
				users = append(users, userID)
			}
			req <- users

		case message := <-h.Broadcast:
			var msg struct {
				ConversationID int `json:"conversation_id"`
			}
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("invalid broadcast message: %v", err)
				continue
			}

			participantIDs, err := h.DB.Conversation.Query().
				Where(conversation.IDEQ(msg.ConversationID)).
				QueryParticipants().
				IDs(context.Background())

			if err != nil {
				log.Printf("failed to get participants: %v", err)
				continue
			}

			for _, userID := range participantIDs {
				if clients, isOnline := h.Clients[userID]; isOnline {
					for client := range clients {
						select {
						case client.Send <- message:
						default:
							close(client.Send)
							delete(clients, client)
							if len(clients) == 0 {
								delete(h.Clients, userID)
							}
						}
					}
				}
			}
		}
	}
}
