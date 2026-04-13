package routes

const (
	ConfirmEmail   = "/api/auth/verify-email"
	AddUser        = "/api/user/add"
	DeleteUser     = "/api/user/delete"
	Login          = "/api/login"
	User           = "/api/user"
	UpdatePwd      = "/api/update/password"
	UpdateEmail    = "/api/update/email"
	UpdateUsername = "/api/update/username"
	UserById       = "/api/users/{id}"
	GetUsers       = "/api/users"
	ResendEmail    = "/api/users/resend-email/{id}"
	FriendRequest  = "/friends/request"
	SenderId       = "/friends/request/{senderid}"
)
