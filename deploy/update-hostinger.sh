#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT="/opt/luxengine"
WEB_ROOT="${APP_ROOT}/lux-engine"
SERVICE_USER="luxengine"
UV_BIN="/home/${SERVICE_USER}/.local/bin/uv"
DEPLOY_REF="${LUXENGINE_REF:-main}"

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

runuser -u "${SERVICE_USER}" -- git -C "${APP_ROOT}" fetch --prune origin
if [[ "${DEPLOY_REF}" == "main" ]]; then
  runuser -u "${SERVICE_USER}" -- git -C "${APP_ROOT}" checkout main
  runuser -u "${SERVICE_USER}" -- git -C "${APP_ROOT}" pull --ff-only origin main
else
  runuser -u "${SERVICE_USER}" -- git -C "${APP_ROOT}" checkout --detach "${DEPLOY_REF}"
fi

runuser -u "${SERVICE_USER}" -- "${UV_BIN}" sync \
  --project "${APP_ROOT}" --python 3.14 --no-dev

runuser -u "${SERVICE_USER}" -- bash -c \
  "set -a; source /etc/luxengine/web.env; set +a; cd '${WEB_ROOT}'; npm ci; npm audit --omit=dev --audit-level=critical; npm run build"

systemctl restart free-claude-code.service lux-engine-web.service
systemctl --no-pager --full status free-claude-code.service lux-engine-web.service

curl --fail --silent --show-error http://127.0.0.1:8082/health >/dev/null
curl --fail --silent --show-error http://127.0.0.1:3000/api/health >/dev/null
echo "Lux Engine services updated and healthy."
