package user

import (
	"backend/ent"
	"backend/internal/pkg"
	"backend/internal/pkg/routes"
	"context"
	"crypto/tls"
	"fmt"
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
	_, err := us.Client.MailVerif.
		Create().
		SetToken(token).
		SetUser(user).
		Save(ctx)
	if err != nil {
		return err
	}
	link := fmt.Sprintf("http://%s:%s%s?token=%s&user_id=%s",
		us.Conf.Net.Host,
		us.Conf.Net.Port,
		routes.VerifyEmail,
		token,
        fmt.Sprintf("%s", user.ID),
	)
	err = us.sendVerificationEmail(user.Email, link)
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

func (us *UserService) sendVerificationEmail(add_mail string, link string) error {
	from := us.Conf.Gmail.Address
	password := us.Conf.Gmail.Password
	to := add_mail
	host := "smtp.gmail.com"
	port := "587"

	auth := smtp.PlainAuth("", from, password, host)
	tlsConfig := &tls.Config{
		ServerName: host,
	}
	conn, err := tls.Dial("tcp", host+":"+port, tlsConfig)
	if err != nil {
		return err
	}
	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}
	defer client.Quit()
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
		"Click this link to verify your email",
		link,
	)
	msg := fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=UTF-8\r\n"+
			"\r\n"+
			"%s",
		from, to, subject, body,
	)
	w.Write([]byte(msg))
	w.Close()
	fmt.Println("Email sent successfully")
	return nil
}
