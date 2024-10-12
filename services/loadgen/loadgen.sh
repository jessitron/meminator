#!/bin/bash

# Set your endpoint URL
LOAD_URL=${LOAD_URL:=http://localhost:8080/backend/createPicture}

MIN_SLEEP=${MIN_SLEEP:=2}
MAX_SLEEP=${MAX_SLEEP:=5}

echo "Min sleep: $MIN_SLEEP"
echo "Max sleep: $MAX_SLEEP"
echo "URL to hit: $LOAD_URL"


function tell_hny_about_sleep {
    duration=$1
    json_data=$(cat <<EOF
{
  "name": "sleep between requests",
  "duration_ms": $duration,
  "service.name": "meminator-loadgen"
}
EOF)
    curl -s -X POST \
  'https://api.honeycomb.io/1/events/meminator-loadgen' \
  -H 'Content-Type: application/json' \
  -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
  -d "$json_data"
  if [[ $? -ne 0 ]]; then
    echo "Failed to send event to Honeycomb"
  fi
}

while true; do
    # Call the endpoint and print the HTTP status code

    curl -s -X POST -w "%{http_code}\n" $LOAD_URL 2>&1 > /dev/null &
    
    # Sleep for a random time between 1 and 2 seconds
    sleep_time=$(awk -v min=$MIN_SLEEP -v max=$MAX_SLEEP 'BEGIN{srand(); print min+rand()*(max-min)}')
   #  echo "Sleeping for $sleep_time"
    tell_hny_about_sleep $sleep_time
    sleep $sleep_time
done
