package user

import (
	"testing"
)

type test_input struct {
	to       string
	link     string
	from     string
	password string
}

type test struct {
	input test_input
	want  error
}

var tests = []test{
	{
		input: test_input{
			to:       "tristangallet17@gmail.com",
			link:     "urlr.me/EJxQNp",
			from:     "tristanbiny.lod@gmail.com",
			password: "fsyxvrqgbyeqckei",
		},
		want: nil,
	},
}

func TestSendMail(t *testing.T) {
	for _, tc := range tests {
		err := sendVerificationEmail(tc.input.to, tc.input.link, tc.input.from, tc.input.password)
		if err != tc.want {
			t.Logf("\nto: %s\nlink: %s\nfrom: %s\npassword: %s\n",
				tc.input.to, tc.input.link, tc.input.from, tc.input.password)
			t.Errorf("%v", err)
		}
	}
}
