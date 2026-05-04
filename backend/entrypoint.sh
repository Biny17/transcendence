#!/bin/sh
if [ ! -f ./secret/private.pem ]; then
    echo "Generating RSA private key..."
    mkdir -p ./secret
    openssl genrsa -out ./secret/private.pem 2048
    chmod 600 ./secret/private.pem
fi
exec "$@"