#!/bin/bash

# This script runs during building the sandbox template
# and makes sure the Next.js app is (1) running and (2) the `/` page is compiled

function ping_server() {
	counter=0
	response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
	while [[ ${response} -ne 200 ]]; do
	  let counter++
	  if (( counter % 20 == 0 )); then
	    echo "Waiting for server to start..."
	  fi
	  sleep 0.1
	  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
	done
	echo "Server is up and page is compiled."
}

cd /home/user && npx next dev --turbopack &
SERVER_PID=$!

ping_server

echo "Shutting down build-time server (PID $SERVER_PID)..."
kill $SERVER_PID