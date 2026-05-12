#!/bin/bash

USERS=("Lio" "Tommy" "Ella")

for USER in "${USERS[@]}"; do
  curl --request POST \
    --url http://localhost:8080/api/users/add \
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
