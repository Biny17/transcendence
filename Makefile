all: up

up: 
	docker compose up

start:
	docker compose start

down:
	docker compose down

stop:
	docker compose stop

logs:
	docker compose logs -f

ps:
	docker compose ps

build:
	docker compose build

nginx/certs/cert.key: secrets
	openssl genrsa -out $@ 4096

nginx/certs/cert.pem: secrets secrets/cert.key
	openssl req -x509 -key secrets/cert.key -out $@ \
		-sha256 -days 365 -nodes \
		-subj "/CN=localhost"

re: fclean up

fclean: down clean
	docker compose down --volumes --rmi all --remove-orphans

clean:
	rm -rf secrets

.PHONY: all up start down stop logs ps build re clean fclean

