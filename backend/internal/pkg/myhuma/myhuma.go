package myhuma

import (
	"backend/ent"
	"reflect"

	"github.com/danielgtaylor/huma/v2"
)

type OptionalParam[T any] struct {
	Value T
	IsSet bool
}

// Define schema to use wrapped type
func (o OptionalParam[T]) Schema(r huma.Registry) *huma.Schema {
	return huma.SchemaFromType(r, reflect.TypeOf(o.Value))
}

// Expose wrapped value to receive parsed value from Huma
// MUST have pointer receiver
func (o *OptionalParam[T]) Receiver() reflect.Value {
	return reflect.ValueOf(o).Elem().Field(0)
}

// React to request param being parsed to update internal state
// MUST have pointer receiver
func (o *OptionalParam[T]) OnParamSet(isSet bool, parsed any) {
	o.IsSet = isSet
}

// Define request input with the wrapper type
type MyRequestInput struct {
	MaybeText OptionalParam[string] `query:"text"`
}

func EntErrToHumaErr(err error) error {
	if ent.IsNotFound(err) {
		return huma.Error404NotFound("Not Found")
	} else if ent.IsConstraintError(err) {
		return huma.Error400BadRequest("Already exists or constraint error")
	} else if ent.IsValidationError(err) {
		return huma.Error400BadRequest("Bad value")
	} else {
		return huma.Error500InternalServerError("Try Again Later !")
	}
}
