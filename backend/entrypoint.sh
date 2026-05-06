#!/bin/sh
set -e

echo "=== EntryPoint Starting ==="
echo "Working directory: $(pwd)"

if [ ! -f /app/secret/private.pem ]; then
    echo "Generating RSA private key..."
    mkdir -p /app/secret
    openssl genrsa -out /app/secret/private.pem 2048
    chmod 600 /app/secret/private.pem
    echo "Private key generated at /app/secret/private.pem"
else
    echo "Private key already exists"
fi

exec "$@"
