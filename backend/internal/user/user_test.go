package user

import (
	"testing"
)

type test_input struct {
	to 			string
	link		string
	from		string
	password	string
}

type test struct {
	input	test_input
	want	error
}

var tests = []test {
	{
		input: test_input{
			to: "tristangallet17@gmail.com",
			link: "youtube.com",
			from: "tristanbiny.log@gmail.com",
			password: "olydlosuugmayvujd",
		},
		want: nil,
	},
}

func TestSendMail(t *testing.T) {
	for _, tc := range tests {
		err := sendVerificationEmail(tc.input.to, tc.input.link, tc.input.from, tc.input.password)
		if err != tc.want {
			t.Errorf("sendVerificationEmail(%s, %s, %s, %s) = %v; want %v",
				tc.input.to, tc.input.link, tc.input.from, tc.input.password, err, tc.want)
		}
	}
}