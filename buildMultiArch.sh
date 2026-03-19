#!/bin/bash
docker tag https-rest-auth rafaelpernil/https-rest-auth
docker buildx build --push --platform linux/arm64,linux/amd64  --tag rafaelpernil/https-rest-auth .

