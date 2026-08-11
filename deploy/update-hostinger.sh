#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="/opt/luxengine"
SERVICE_USER="luxengine"
DEPLOY_REF="${LUXENGINE_REF:-main}"
COMPOSE_FILE="${APP_ROOT}/deploy/compose.yml"
COMPOSE_ARGS=(
  --env-file /etc/luxengine/web.env
  --file "${COMPOSE_FILE}"
)

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo." >&2
  exit 1
fi

for required_file in /etc/luxengine/web.env /etc/luxengine/proxy.env; do
  if [[ ! -f "${required_file}" ]]; then
    echo "Missing required environment file: ${required_file}" >&2
    exit 1
  fi
done

if [[ -f /etc/luxengine/proxy-network.env ]]; then
  COMPOSE_ARGS+=(
    --env-file /etc/luxengine/proxy-network.env
    --file "${APP_ROOT}/deploy/compose.proxy-network.yml"
  )
fi

runuser -u "${SERVICE_USER}" -- git -C "${APP_ROOT}" fetch --prune origin
if [[ "${DEPLOY_REF}" == "main" ]]; then
  runuser -u "${SERVICE_USER}" -- git -C "${APP_ROOT}" checkout main
  runuser -u "${SERVICE_USER}" -- git -C "${APP_ROOT}" pull --ff-only origin main
else
  runuser -u "${SERVICE_USER}" -- git -C "${APP_ROOT}" checkout --detach "${DEPLOY_REF}"
fi

COMPOSE_PARALLEL_LIMIT=1 docker compose \
  "${COMPOSE_ARGS[@]}" \
  build --pull
docker compose \
  "${COMPOSE_ARGS[@]}" \
  up --detach --remove-orphans --wait
docker compose "${COMPOSE_ARGS[@]}" ps

curl --fail --silent --show-error http://127.0.0.1:8082/health >/dev/null
curl --fail --silent --show-error http://127.0.0.1:3000/api/health >/dev/null
echo "Lux Engine services updated and healthy."
