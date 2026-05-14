#!/bin/bash

USERS=("Lio" "Tommy" "Ella")

for USER in "${USERS[@]}"; do
  curl -k --request POST \
    --url https://localhost:4443/api/users/add \
    --header 'Accept: application/problem+json' \
    --header 'Content-Type: application/json' \
    --data "{
      \"age\": 18,
      \"email\": \"${USER}@example.com\",
      \"password\": \"${USER}\",
      \"username\": \"${USER}\",
      \"verified\": true
    }"
  echo ""
done
