# syntax=docker/dockerfile:1
#
# Build:
#   docker build -f .dockerfile -t agent-server:latest .
#
# Run (env from orchestrator / --env-file, do NOT bake secrets into image):
#   docker run --rm -p 3030:3030 \
#     -e NODE_ENV=prod \
#     -e DATABASE_URL=postgresql://... \
#     -e JWT_SECRET=... \
#     -e REDIS_URL=redis://... \
#     -e CLIENT_CORS_ORIGINS=https://app.example.com \
#     agent-server:latest
#
# Optional: run migrations on container start
#   -e RUN_DB_MIGRATE=true

ARG NODE_VERSION=20.19.0

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable \
  && apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates tini \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Build ────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm exec prisma generate \
  && pnpm run build

# ── Production runtime ───────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=prod
ENV HF_HOME=/app/.cache/huggingface

# Production deps only (@xenova/transformers / onnxruntime-node need glibc linux x64)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod \
  && mkdir -p /app/.cache/huggingface /app/logs \
  && chown -R node:node /app

COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/generated ./generated
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./prisma.config.ts
# Runtime JSON config (read from src/ path via process.cwd())
COPY --from=build --chown=node:node /app/src/core/intent/smalltalk-hints.json ./src/core/intent/smalltalk-hints.json
COPY --chown=node:node docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node
EXPOSE 3030

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3030/admin', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--", "docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
