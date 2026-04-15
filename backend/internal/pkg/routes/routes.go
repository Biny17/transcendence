package routes

const (
	ConfirmEmail   = "/api/auth/verify-email"
	AddUser        = "/api/users/add"
	DeleteUser     = "/api/users/delete"
	Login          = "/api/auth/login"
	FindUser       = "/api/users/find"
	UpdatePwd      = "/api/update/password"
	UpdateEmail    = "/api/update/email"
	UpdateUsername = "/api/update/username"
	UserById       = "/api/users/{id}"
	GetUsers       = "/api/users"
	ResendEmail    = "/api/users/resend-email/{id}"
	FriendRequest  = "/friends/request"
	AcceptFriend   = "/friends/accept"
	GetFriendList  = "/friends/friendlist"
	GetPendingList = "/friends/pending"
	RejectFriend   = "/friends/reject"
	DeleteFriend   = "/friends/delete"
	Me             = "/api/users/me"
)
