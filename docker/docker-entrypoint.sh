#!/bin/sh
set -eu

if [ "${RUN_DB_MIGRATE:-false}" = "true" ]; then
  echo "[entrypoint] running prisma migrate deploy..."
  pnpm exec prisma migrate deploy
fi

exec "$@"
