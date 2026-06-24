# syntax=docker/dockerfile:1
# Jenkins: Kaniko --context . ，git clone 到 omnix/ ；COPY 路径带 omnix/ 前缀
# sharp：package.json pnpm.neverBuiltDependencies 跳过安装脚本（本地 transformers 文本 embedding 不依赖）

FROM erp-prod-acr-registry-vpc.cn-hangzhou.cr.aliyuncs.com/cht-base/node:22.18-chrome AS base

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PNPM_HOME="/pnpm" \
    PATH="/pnpm:${PATH}"

WORKDIR /app

FROM base AS deps

COPY omnix/package.json omnix/pnpm-lock.yaml ./

RUN npm config set registry https://registry.npmmirror.com \
  && npm install -g pnpm@8 \
  && pnpm config set registry https://registry.npmmirror.com \
  && pnpm install --frozen-lockfile --fetch-timeout 600000

FROM deps AS build

COPY omnix/prisma ./prisma
COPY omnix/prisma.config.ts omnix/nest-cli.json omnix/tsconfig.json omnix/tsconfig.build.json ./
COPY omnix/ecosystem.config.cjs ./
COPY omnix/src ./src

RUN pnpm exec prisma generate \
  && pnpm run build

FROM base AS runner

ENV NODE_ENV=prod \
    HF_HOME=/app/.cache/huggingface

WORKDIR /app

COPY omnix/package.json omnix/pnpm-lock.yaml omnix/ecosystem.config.cjs ./

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
COPY omnix/docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3030

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3030/admin', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
