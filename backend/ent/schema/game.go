package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Game holds the schema definition for the Game entity.
type Game struct {
	ent.Schema
}

// Fields of the Game.
func (Game) Fields() []ent.Field {
	return []ent.Field{
		field.Time("time_stamp").Default(
			func() time.Time { return time.Now() },
		),
		field.String("type"),
		field.Int("nb_player"),
	}
}

// Edges of the Game.
func (Game) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("results", Result.Type),
	}
}
