package mid

import (
	"fmt"
	"testing"
)

type t_input struct {
	h_v    string
	prefix string
}

type t_output struct {
	key string
	err error
}

type unit struct {
	input t_input
	want  t_output
}

var tests = []unit{
	{
		input: t_input{
			h_v:    "Bearer SGkh",
			prefix: "Bearer ",
		},
		want: t_output{
			key: "Hi!",
			err: nil,
		},
	},
	{
		input: t_input{
			h_v:    "Bearer ",
			prefix: "Bearer ",
		},
		want: t_output{
			key: "",
			err: nil,
		},
	},
	{
		input: t_input{
			h_v:    "",
			prefix: "Bearer ",
		},
		want: t_output{
			key: "",
			err: fmt.Errorf("some error !\n"),
		},
	},
}

func TestExtractKey(t *testing.T) {
	for _, tc := range tests {
		key, err := extractKey(tc.input.h_v, tc.input.prefix)
		if tc.want.err == nil {
			if err != nil {
				t.Errorf("Unexpected error: %s\n", err.Error())
			} else if key != tc.want.key {
				t.Errorf("Got: %sWanted: %s", key, tc.want.key)
			}
		} else {
			if err == nil {
				t.Errorf("Got nil, wanted error: %s\n", tc.want.err)
			} else {
				t.Logf("Wanted: %sGot: %s", tc.want.err.Error(), err.Error())
			}
		}
	}
}
