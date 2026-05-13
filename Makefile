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

re: fclean up

fclean: down clean
	docker compose down --volumes --rmi all --remove-orphans

clean:
	rm -rf secrets

.PHONY: all up start down stop logs ps build re clean fclean

