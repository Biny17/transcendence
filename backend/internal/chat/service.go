package chat

import (
	"context"
	"time"

	"backend/ent"
	"backend/ent/conversation"
	"backend/ent/friendship"
	"backend/ent/message"
	"backend/ent/user"
)

func AreFriends(ctx context.Context, db *ent.Client, userID1, userID2 int) (bool, error) {
	count, err := db.Friendship.Query().
		Where(
			friendship.StatusEQ("accepted"),
			friendship.Or(
				friendship.And(
					friendship.HasUserWith(user.ID(userID1)),
					friendship.HasFriendWith(user.ID(userID2)),
				),
				friendship.And(
					friendship.HasUserWith(user.ID(userID2)),
					friendship.HasFriendWith(user.ID(userID1)),
				),
			),
		).Count(ctx)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func IsParticipant(ctx context.Context, db *ent.Client, conversationID, userID int) (bool, error) {
	count, err := db.Conversation.Query().
		Where(
			conversation.IDEQ(conversationID),
			conversation.HasParticipantsWith(user.IDEQ(userID)),
		).Count(ctx)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func AreParticipantsFriends(ctx context.Context, db *ent.Client, conversationID, userID int) (bool, error) {
	conv, err := db.Conversation.Query().
		Where(conversation.IDEQ(conversationID)).
		WithParticipants().
		Only(ctx)
	if err != nil {
		return false, err
	}

	// Group chats do not require all participants to be friends
	if conv.IsGroup {
		return true, nil
	}

	var otherUserID int
	foundOther := false
	for _, p := range conv.Edges.Participants {
		if p.ID != userID {
			otherUserID = p.ID
			foundOther = true
			break
		}
	}

	if !foundOther {
		return false, nil
	}

	return AreFriends(ctx, db, userID, otherUserID)
}

func CreateGroupConversation(ctx context.Context, db *ent.Client, title string, participantIDs []int) (*ent.Conversation, error) {
	return db.Conversation.Create().
		SetIsGroup(true).
		SetTitle(title).
		AddParticipantIDs(participantIDs...).
		Save(ctx)
}

func AddParticipantsToGroup(ctx context.Context, db *ent.Client, conversationID int, participantIDs []int) (*ent.Conversation, error) {
	return db.Conversation.UpdateOneID(conversationID).
		AddParticipantIDs(participantIDs...).
		Save(ctx)
}

func RemoveParticipantFromGroup(ctx context.Context, db *ent.Client, conversationID, participantID int) error {
	return db.Conversation.UpdateOneID(conversationID).
		RemoveParticipantIDs(participantID).
		Exec(ctx)
}

func GetOrCreate1on1Conversation(ctx context.Context, db *ent.Client, userID1, userID2 int) (*ent.Conversation, error) {
	// Try to find an existing 1-on-1 conversation between these two exact users
	conv, err := db.Conversation.Query().
		Where(
			conversation.IsGroup(false),
			conversation.HasParticipantsWith(user.IDEQ(userID1)),
			conversation.HasParticipantsWith(user.IDEQ(userID2)),
		).First(ctx)

	if err == nil {
		return conv, nil
	}

	if !ent.IsNotFound(err) {
		return nil, err
	}

	// It wasn't found, so we create a new one
	return db.Conversation.Create().
		SetIsGroup(false).
		AddParticipantIDs(userID1, userID2).
		Save(ctx)
}

func SaveMessage(ctx context.Context, db *ent.Client, conversationID, senderID int, content string) (*ent.Message, error) {
	return db.Message.Create().
		SetContent(content).
		SetConversationID(conversationID).
		SetSenderID(senderID).
		Save(ctx)
}

type MessageSender struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
}

type MessageResponse struct {
	ID             int           `json:"id"`
	ConversationID int           `json:"conversation_id"`
	Content        string        `json:"content"`
	CreatedAt      time.Time     `json:"created_at"`
	Sender         MessageSender `json:"sender"`
}

func GetConversationHistory(ctx context.Context, db *ent.Client, conversationID, limit, offset int) ([]*MessageResponse, error) {
	messages, err := db.Message.Query().
		Where(message.HasConversationWith(conversation.IDEQ(conversationID))).
		WithSender().
		Order(ent.Desc(message.FieldCreatedAt)).
		Limit(limit).
		Offset(offset).
		All(ctx)

	if err != nil {
		return nil, err
	}

	result := make([]*MessageResponse, len(messages))
	for i, msg := range messages {
		result[i] = &MessageResponse{
			ID:             msg.ID,
			ConversationID: conversationID,
			Content:        msg.Content,
			CreatedAt:      msg.CreatedAt,
			Sender: MessageSender{
				ID:       msg.Edges.Sender.ID,
				Username: msg.Edges.Sender.Username,
			},
		}
	}
	return result, nil
}

type ConversationResponse struct {
	ID           int             `json:"id"`
	IsGroup      bool            `json:"is_group"`
	Title        string          `json:"title,omitempty"`
	Participants []MessageSender `json:"participants,omitempty"`
	OtherUser    *MessageSender  `json:"other_user,omitempty"`
}

func GetUserConversations(ctx context.Context, db *ent.Client, userID int) ([]*ConversationResponse, error) {
	convs, err := db.Conversation.Query().
		Where(conversation.HasParticipantsWith(user.IDEQ(userID))).
		WithParticipants().
		All(ctx)

	if err != nil {
		return nil, err
	}

	result := make([]*ConversationResponse, 0, len(convs))
	for _, conv := range convs {
		if conv.IsGroup {
			participants := make([]MessageSender, 0, len(conv.Edges.Participants))
			for _, p := range conv.Edges.Participants {
				participants = append(participants, MessageSender{
					ID:       p.ID,
					Username: p.Username,
				})
			}
			result = append(result, &ConversationResponse{
				ID:           conv.ID,
				IsGroup:      true,
				Title:        conv.Title,
				Participants: participants,
			})
		} else {
			var otherUser *ent.User
			for _, p := range conv.Edges.Participants {
				if p.ID != userID {
					otherUser = p
					break
				}
			}
			if otherUser != nil {
				result = append(result, &ConversationResponse{
					ID:      conv.ID,
					IsGroup: false,
					OtherUser: &MessageSender{
						ID:       otherUser.ID,
						Username: otherUser.Username,
					},
				})
			}
		}
	}
	return result, nil
}
