package routes

const (
	ConfirmEmail        = "/api/auth/verify-email"
	AddUser             = "/api/users/add"
	DeleteUser          = "/api/users/delete"
	Login               = "/api/auth/login"
	FindUser            = "/api/users/find"
	UpdatePwd           = "/api/update/password"
	UpdateEmail         = "/api/update/email"
	UpdateUsername      = "/api/update/username"
	UserById            = "/api/users/{id}"
	GetUsers            = "/api/users"
	ResendEmail         = "/api/users/resend-email/{id}"
	FriendRequest       = "/api/friends/request"
	AcceptFriend        = "/api/friends/accept"
	GetFriendList       = "/api/friends/friendlist"
	GetPendingList      = "/api/friends/pending"
	GetSentList         = "/api/friends/sent"
	RejectFriend        = "/api/friends/reject"
	DeleteFriend        = "/api/friends/delete"
	Me                  = "/api/users/me"
	Chat                = "/api/chat/ws"
	CreateConversation  = "/api/chat/conversation"
	GetConversations    = "/api/chat/conversations"
	ConversationHistory = "/api/chat/conversation/{id}/messages"
)

