#!/bin/bash

API_KEY=${HONEYCOMB_API_KEY_PROD_MARKERS:-$HONEYCOMB_API_KEY}
echo $API_KEY
exit 1

ref=$(git rev-parse HEAD | cut -c1-10)
if [[ -z "$VERSION_NUMBER" ]]; then
    message="ref:$ref"
else
    message="v$VERSION_NUMBER $1 ref:$ref"
fi
body=$(echo '{"message":"'$message'", "type":"deploy"}')

if [[ -z "$1" ]]; then
  dataset="__all__"
else if [[ "$1" == "web" ]]; then
  dataset="web"
else if [[ "$1" == "loadgen" ]]; then
  dataset="meminator-loadgen"
else
  dataset="$1-nodejs" # this is the OTEL_SERVICE_NAME from docker-compose.yml or k8s.yaml for the service of name $1. We happen to have a convention, it won't work for 'web'
fi

echo "dataset: $dataset"

curl https://api.honeycomb.io/1/markers/${dataset} -X POST  \
    -H "X-Honeycomb-Team: ${API_KEY}"  \
    -d "$body"
