#!/bin/sh
set -e

# Backend services listen on fixed ports (localhost only)
export AUTH_SERVICE_PORT=5001
export STORY_SERVICE_PORT=5002
export MENTORSHIP_SERVICE_PORT=5003
export RESOURCE_SERVICE_PORT=5004
# Disable dotenv file so Render env vars are used
export DOTENV_PATH=/dev/null

# Start all four Node services in background
node /app/services/auth-service/src/index.js &
node /app/services/story-service/src/index.js &
node /app/services/mentorship-service/src/index.js &
node /app/services/resource-service/src/index.js &

# Give DB connections and servers time to bind
sleep 3

# Nginx dirs (Alpine)
mkdir -p /run/nginx /var/log/nginx

# Render sets PORT (e.g. 10000); default for local runs
export PORT="${PORT:-5000}"
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Nginx runs in foreground so container stays up
exec nginx -g 'daemon off;'
