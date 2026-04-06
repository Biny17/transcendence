package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Friendship holds the schema definition for the Friendship entity.
type Friendship struct {
	ent.Schema
}

// Fields of the Friendship.
func (Friendship) Fields() []ent.Field {
	return []ent.Field{
		field.Time("created_at").
			Default(time.Now),
		field.String("status").Default("pending"), // pending, accepted, blocked
	}
}

// Edges of the Friendship.
func (Friendship) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).
			Ref("friendships").
			Unique().
			Required(),
		edge.From("friend", User.Type).
			Ref("friend_of").
			Unique().
			Required(),
	}
}

func (Friendship) Indexes() []ent.Index {
	return []ent.Index{
		index.Edges("user", "friend").Unique(),
	}
}
