#!/bin/bash

# read $HONEYCOMB_API_KEY and print a link to the team and environment

# Check if HONEYCOMB_API_KEY is set
if [ -z "$HONEYCOMB_API_KEY" ]; then
  echo "no HONEYCOMB_API_KEY environment variable"
  exit 0 # this is not an error, just the state of things
fi

# Make the API request to Honeycomb Auth endpoint
response=$(curl -s -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                 "https://api.honeycomb.io/1/auth")

# Check if the request was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to fetch data from Honeycomb API."
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "if `jq` were installed, I'd link you to your Honeycomb environment"
  exit 0
fi

# Extract the team slug and environment slug from the response using jq
team_slug=$(echo "$response" | jq -r '.team.slug')
env_slug=$(echo "$response" | jq -r '.environment.slug')

# Check if slugs were found
if [ -z "$team_slug" ] || [ -z "$env_slug" ]; then
  echo "Error: Unable to extract team or environment slug from response."
  exit 1
fi

# To find the dataset, we want the OTEL_SERVICE_NAME of the backend-for-frontend service.
if ! command -v yq &> /dev/null; then
  echo "if `yq` were installed, I'd link you to the right dataset. Making a guess"
  dataset=backend-for-frontend-nodejs
else
  # expecting NAME=VAL format for environment variable
  dataset=$(yq '.services.backend-for-frontend.environment.[] | capture("OTEL_SERVICE_NAME=(?P<val>.*)").val' docker-compose.yaml)  
fi

# Construct and output the environment URL
env_url="https://ui.honeycomb.io/${team_slug}/environments/${env_slug}/datasets/${dataset}/home"
echo "Look for traces in: $env_url"