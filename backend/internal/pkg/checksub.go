package pkg

import (
	"context"
	"errors"

)

func ContextUserId(ctx context.Context) (int, error) {
	id, ok := ctx.Value("sub").(int)
	if ok == false {
		return 0, errors.New("sub not found in context")
	}
	return id, nil
}

func CheckIdMatchContextSub(ctx context.Context, id int) (error) {
	sub, err := ContextUserId(ctx)
	if err != nil {
		return err
	}
	if sub != id {
		return errors.New("id different from from sub in context")
	}
	return nil
}