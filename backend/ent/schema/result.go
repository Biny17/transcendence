package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Result holds the schema definition for the Result entity.
type Result struct {
	ent.Schema
}

// Fields of the Result.
func (Result) Fields() []ent.Field {
	return []ent.Field{
		field.Int("rank"),
		field.Int("kills"),
		field.Int("death"),
		field.Int("game_id"),
		field.Int("user_id"),
	}
}

// Edges of the Result.
func (Result) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("game", Game.Type).
			Ref("results").
			Unique().
			Required(),
		edge.From("user", User.Type).
			Ref("results").
			Unique().
			Required(),
	}
}
