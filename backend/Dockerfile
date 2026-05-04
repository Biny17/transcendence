FROM golang:1.26-alpine

WORKDIR /app

# Install gow
RUN go install github.com/mitranim/gow@latest

# Copy go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

EXPOSE 8080

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gow", "run", "./cmd/api"]