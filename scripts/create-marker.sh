#!/bin/bash

ref=$(git rev-parse HEAD | cut -c1-10)
if [[ -z "$VERSION_NUMBER" ]]; then
    message="ref:$ref"
else
    message="v$VERSION_NUMBER ref:$ref"
fi
body=$(echo '{"message":"'$message'", "type":"deploy"}')

if [[ -n "$1" ]]; then
    dataset="$1-nodejs" # this is the OTEL_SERVICE_NAME from docker-compose.yml or k8s.yaml for the service of name $1. We happen to have a convention, it won't work for 'web'
else
  dataset="__all__"
fi

echo "dataset: $dataset"

curl https://api.honeycomb.io/1/markers/${dataset} -X POST  \
    -H "X-Honeycomb-Team: ${HONEYCOMB_API_KEY}"  \
    -d "$body"
