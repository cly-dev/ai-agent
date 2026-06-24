#!/bin/sh
set -eu

# 从密钥文件注入环境变量（K8s Secret / Docker secret mount）
# 用法：-e DATABASE_URL_FILE=/run/secrets/database_url
load_secret_from_file() {
  name="$1"
  file_var="${name}_FILE"
  # shellcheck disable=SC2154
  file_path=$(eval "printf '%s' \"\${$file_var:-}\"")
  if [ -n "$file_path" ] && [ -r "$file_path" ]; then
    export "$name"="$(cat "$file_path")"
  fi
}

load_secret_from_file DATABASE_URL
load_secret_from_file JWT_SECRET
load_secret_from_file REDIS_URL
load_secret_from_file REDIS_PASSWORD

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] ERROR: DATABASE_URL is required (set -e DATABASE_URL or -e DATABASE_URL_FILE=...)" >&2
  exit 1
fi

if [ "${RUN_DB_MIGRATE:-false}" = "true" ]; then
  echo "[entrypoint] running prisma migrate deploy..."
  pnpm exec prisma migrate deploy
fi

exec "$@"
