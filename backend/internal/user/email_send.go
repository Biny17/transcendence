package user

import (
	"backend/ent"
	"backend/ent/mailverif"
	"backend/internal/pkg"
	"backend/internal/pkg/routes"
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"net/smtp"

	"github.com/danielgtaylor/huma/v2"
)

type ResendEmailIn struct {
	User_id int `path:"id"`
}

func (us *UserService) verifEmail(
	ctx context.Context,
	user *ent.User,
) error {
	if user.VerifiedEmail == true {
		log.Printf("email already verified\n")
		return nil
	}
	token := pkg.NewSalt()
	link := fmt.Sprintf("http://%s:%s%s?token=%s&user_id=%s",
		us.Conf.Net.Host,
		us.Conf.Net.Port,
		routes.ConfirmEmail,
		token,
		fmt.Sprintf("%d", user.ID),
	)
	err := sendVerificationEmail(user.Email, link, us.Conf.Gmail.Address, us.Conf.Gmail.Password)
	if err != nil {
		return err
	}
	log.Printf("email sent to %s\n", user.Email)
	_, err = us.Client.MailVerif.
		Create().
		SetToken(token).
		SetUser(user).
		Save(ctx)
	return err
}

func sendVerificationEmail(to string, link string, from string, password string) error {
	host := "smtp.gmail.com"
	port := "587"

	conn, err := net.Dial("tcp", host+":"+port)
	if err != nil {
		return err
	}
	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}
	defer client.Quit()

	tlsConfig := &tls.Config{ServerName: host}
	if err = client.StartTLS(tlsConfig); err != nil {
		return err
	}

	auth := smtp.PlainAuth("", from, password, host)
	if err = client.Auth(auth); err != nil {
		return err
	}
	if err = client.Mail(from); err != nil {
		return err
	}
	if err = client.Rcpt(to); err != nil {
		return err
	}

	w, err := client.Data()
	if err != nil {
		return err
	}

	subject := "CONFIRM YOUR NEW ACCOUNT !"
	body := fmt.Sprintf(
		`<html><body><a href="%s">%s</a></body></html>`,
		link,
		"Click this link to verify your email",
	)
	msg := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
		from, to, subject, body,
	)
	w.Write([]byte(msg))
	w.Close()
	return nil
}

func (us *UserService) ResendEmail(ctx context.Context, input *ResendEmailIn) (*struct{}, error) {
	// log.Printf("resend\n")
	user, err := us.Client.User.Get(ctx, input.User_id)
	if err != nil {
		str := fmt.Sprintf("user_id: %d not found\n", input.User_id)
		if ent.IsNotFound(err) {
			return nil, huma.Error400BadRequest(str)
		}
		return nil, huma.Error500InternalServerError("operation failed")
	}
	_, err = us.Client.MailVerif.Delete().Where(mailverif.UserID(user.ID)).Exec(ctx)
	if err != nil {
		log.Print(err)
		return nil, huma.Error500InternalServerError("operation failed")
	}
	if err := us.verifEmail(ctx, user); err != nil {
		log.Print(err)
		return nil, huma.Error500InternalServerError("operation failed")
	}
	return &struct{}{}, nil
}
