package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type Conversation struct {
	ent.Schema
}

func (Conversation) Fields() []ent.Field {
	return []ent.Field{
		field.Time("created_at").
		Default(time.Now).
		Immutable(),
	}
}

func (Conversation) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("messages", Message.Type),
		edge.From("participants", User.Type).
		Ref("conversations").
		Required(),
	}
}
