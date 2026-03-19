#!/bin/bash
docker build -t https-rest-auth .
docker tag https-rest-auth rafaelpernil/https-rest-auth:latest
docker push rafaelpernil/https-rest-auth:latest

kubectl apply -f ./artifacts/deployment.yaml
kubectl apply -f ./artifacts/service.yaml

kubectl scale --replicas=0 deployment https-rest-auth -n allotr
kubectl scale --replicas=1 deployment https-rest-auth -n allotr