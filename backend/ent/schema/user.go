package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// User holds the schema definition for the User entity.
type User struct {
	ent.Schema
}

// Fields of the User.
func (User) Fields() []ent.Field {
	return []ent.Field{
		field.String("username").Unique().NotEmpty(),
		field.Int("age").Positive().NonNegative(),
		field.String("email").Unique().MaxLen(320),
		field.Time("created_at").Default(
			func() time.Time { return time.Now() }),
		field.String("salt"),
		field.String("hash"),
		field.Bool("verified_email").Default(false),
	}
}

// Edges of the User.
func (User) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("mail_verif", MailVerif.Type).
			Unique(),
	}
}
