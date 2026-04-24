package chat

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait = 10 * time.Second

	pongWait = 60 * time.Second

	pingPeriod = (pongWait * 9) / 10

	maxMessageSize = 512
)

type Client struct {
	Hub *Hub

	UserID int

	Conn *websocket.Conn

	Send chan []byte
}

type MessagePayload struct {
	ConversationID int    `json:"conversation_id"`
	Content        string `json:"content"`
}

// ReadPump pumps messages from the websocket connection to the hub.
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error { c.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, content, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		var payload MessagePayload
		if err := json.Unmarshal(content, &payload); err != nil {
			log.Printf("invalid json payload: %v", err)
			continue
		}

		ctx := context.Background()

		// Ensure user is participant
		isPart, err := IsParticipant(ctx, c.Hub.DB, payload.ConversationID, c.UserID)
		if err != nil || !isPart {
			log.Printf("user %d not participant of conversation %d", c.UserID, payload.ConversationID)
			continue
		}

		// Ensure they are still friends
		areFriends, err := AreParticipantsFriends(ctx, c.Hub.DB, payload.ConversationID, c.UserID)
		if err != nil || !areFriends {
			log.Printf("user %d and the other participant are not friends in conversation %d", c.UserID, payload.ConversationID)
			errMsg, _ := json.Marshal(map[string]interface{}{
				"type":    "error",
				"code":    "not_friends",
				"message": "You must be friends to send messages",
			})
			c.Send <- errMsg
			continue
		}

		// Save the message to the database
		msg, err := SaveMessage(ctx, c.Hub.DB, payload.ConversationID, c.UserID, payload.Content)
		if err != nil {
			log.Printf("failed to save message: %v", err)
			continue
		}
		broadcastMsg, _ := json.Marshal(map[string]interface{}{
			"id":              msg.ID,
			"conversation_id": payload.ConversationID,
			"sender_id":       c.UserID,
			"content":         msg.Content,
			"created_at":      msg.CreatedAt,
		})
		c.Hub.Broadcast <- broadcastMsg
	}
}

// WritePump pumps messages from the hub to the websocket connection.
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request, userID int) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{Hub: hub, UserID: userID, Conn: conn, Send: make(chan []byte, 256)}
	client.Hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}
