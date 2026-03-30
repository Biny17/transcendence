package user

import (
	"backend/ent"
	"backend/internal/pkg"
	"backend/internal/pkg/routes"
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
)

func (us *UserService) verifEmail(
	ctx context.Context,
	user *ent.User,
) error {
	if user.VerifiedEmail == true {
		return nil
	}
	token := pkg.NewSalt()
	link := fmt.Sprintf("http://%s:%s%s?token=%s&user_id=%s",
		us.Conf.Net.Host,
		us.Conf.Net.Port,
		routes.VerifyEmail,
		token,
		fmt.Sprintf("%d", user.ID),
	)
	err := sendVerificationEmail(user.Email, link, us.Conf.Gmail.Address, us.Conf.Gmail.Password)
	if err != nil {
		return err
	}
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
