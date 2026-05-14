#!/bin/sh
set -e

echo "=== EntryPoint Starting ==="
echo "Working directory: $(pwd)"

if [ ! -f /run/secret/private.pem ]; then
    echo "Generating RSA private key..."
    mkdir -p /run/secret
    openssl genrsa -out /run/secret/private.pem 2048
    chmod 600 /run/secret/private.pem
    echo "Private key generated at /run/secret/private.pem"
else
    echo "Private key already exists"
fi

exec "$@"
