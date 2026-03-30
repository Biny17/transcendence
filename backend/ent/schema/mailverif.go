package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// MailVerif holds the schema definition for the MailVerif entity.
type MailVerif struct {
	ent.Schema
}

// Fields of the MailVerif.
func (MailVerif) Fields() []ent.Field {
	return []ent.Field{
		field.Int("user_id").Positive(),
		field.String("token").NotEmpty(),
		field.Time("expiring_at").Default(
			func() time.Time { return time.Now().Add(time.Hour * 24) },
		),
	}
}

// Edges of the MailVerif.
func (MailVerif) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).
			Ref("mail_verif").
			Field("user_id").
			Unique().
			Required(),
	}
}
