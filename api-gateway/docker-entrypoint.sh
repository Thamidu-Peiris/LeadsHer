#!/bin/sh
set -e

# Substitute env vars into nginx config for Render (dynamic service hostnames)
# Falls back to docker-compose hostnames when vars are unset
export AUTH_SERVICE_HOST="${AUTH_SERVICE_HOST:-auth-service}"
export AUTH_SERVICE_PORT="${AUTH_SERVICE_PORT:-5001}"
export STORY_SERVICE_HOST="${STORY_SERVICE_HOST:-story-service}"
export STORY_SERVICE_PORT="${STORY_SERVICE_PORT:-5002}"
export MENTORSHIP_SERVICE_HOST="${MENTORSHIP_SERVICE_HOST:-mentorship-service}"
export MENTORSHIP_SERVICE_PORT="${MENTORSHIP_SERVICE_PORT:-5003}"
export RESOURCE_SERVICE_HOST="${RESOURCE_SERVICE_HOST:-resource-service}"
export RESOURCE_SERVICE_PORT="${RESOURCE_SERVICE_PORT:-5004}"
export EVENT_SERVICE_HOST="${EVENT_SERVICE_HOST:-event-service}"
export EVENT_SERVICE_PORT="${EVENT_SERVICE_PORT:-5006}"
export PORT="${PORT:-5000}"

envsubst '${AUTH_SERVICE_HOST} ${AUTH_SERVICE_PORT} ${STORY_SERVICE_HOST} ${STORY_SERVICE_PORT} ${MENTORSHIP_SERVICE_HOST} ${MENTORSHIP_SERVICE_PORT} ${RESOURCE_SERVICE_HOST} ${RESOURCE_SERVICE_PORT} ${EVENT_SERVICE_HOST} ${EVENT_SERVICE_PORT} ${PORT}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
