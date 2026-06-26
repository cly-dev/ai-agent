# syntax=docker/dockerfile:1
# 本地：podman build -t agent-server:local .
# Jenkins 用 .dockerfile（omnix/ 前缀）

FROM node:22-bookworm AS base

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PNPM_HOME="/pnpm" \
    PATH="/pnpm:${PATH}"

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN npm config set registry https://registry.npmmirror.com \
  && npm install -g pnpm@8 \
  && pnpm config set registry https://registry.npmmirror.com \
  && pnpm install --frozen-lockfile --fetch-timeout 600000

FROM deps AS build

COPY prisma ./prisma
COPY prisma.config.ts nest-cli.json tsconfig.json tsconfig.build.json ./
COPY ecosystem.config.cjs ./
COPY src ./src

RUN pnpm exec prisma generate \
  && pnpm run build

FROM base AS runner

ENV NODE_ENV=prod \
    HF_HOME=/app/.cache/huggingface

WORKDIR /app

COPY package.json pnpm-lock.yaml ecosystem.config.cjs ./

RUN npm config set registry https://registry.npmmirror.com \
  && npm install -g pnpm@8 pm2 \
  && pnpm config set registry https://registry.npmmirror.com \
  && pnpm install --frozen-lockfile --prod --fetch-timeout 600000 \
  && mkdir -p /app/.cache/huggingface /app/logs

COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/src/core/intent/smalltalk-hints.json ./src/core/intent/smalltalk-hints.json
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3030

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3030/admin', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
