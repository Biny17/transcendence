package chat

import (
	"context"

	"backend/ent"
	"backend/ent/conversation"
	"backend/ent/message"
	"backend/ent/user"
)

func GetOrCreate1on1Conversation(ctx context.Context, db *ent.Client, userID1, userID2 int) (*ent.Conversation, error) {
	// Try to find an existing conversation between these two exact users
	conv, err := db.Conversation.Query().
		Where(
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

func GetConversationHistory(ctx context.Context, db *ent.Client, conversationID, limit, offset int) ([]*ent.Message, error) {
	return db.Message.Query().
		Where(message.HasConversationWith(conversation.IDEQ(conversationID))).
		WithSender().
		Order(ent.Desc(message.FieldCreatedAt)).
		Limit(limit).
		Offset(offset).
		All(ctx)
}
