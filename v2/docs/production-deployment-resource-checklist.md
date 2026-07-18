# 生产部署说明

## 需要的资源

| 资源 | 要求 | 说明 |
|------|------|------|
| **PostgreSQL** | 16+ | 必配，存业务数据 |
| **Redis** | 7+ | 必配（多副本部署时硬性要求） |
| **应用进程** | Node 22 | 两个进程：Runtime + Worker |
| **出站网络** | 能访问外网/内网 API | LLM、客户 Integration/Tool、`APP_CLIENT_HOST` 鉴权 |

**起步规格（单机，Runtime + Worker 同机部署）**

| 机器 | CPU | 内存 | 说明 |
|------|-----|------|------|
| **应用机** | 4 核 | 4 GB | PM2 同机跑 Runtime（3030）+ Worker；Worker 默认并发 4 |
| PostgreSQL | 2 核 | 4 GB+ | 可与应用同机（小流量）或独立 |
| Redis | 0.5 核 | 512 MB | 可与应用同机（小流量）或独立 |

应用机内 PM2 限制：Runtime `max_memory_restart=1G`，Worker `max_memory_restart=2G`（见 `ecosystem.config.cjs`）。

**端口**

- `3030`：对外 HTTP（C 端 + B 端 `/admin`）
- `3031`：Worker 健康检查 `/health`（内网探针用）

---

## 环境变量（最小集）

```bash
NODE_ENV=prod
DATABASE_URL=postgresql://...
JWT_SECRET=              # ≥32 位随机串
CORS_ORIGINS=https://admin.xxx,https://app.xxx
APP_CLIENT_HOST=https://admin.xxx
REDIS_URL=redis://...
```

LLM 优先在数据库 `LlmModelConfig` 配置；`OPENAI_API_KEY` 仅作兜底。

---

## 部署方式

### 方式一：Docker（推荐）

```bash
# 构建
docker build -t agent-server:prod .

# 运行（单容器内 PM2 同时起 Runtime + Worker）
docker run -d \
  -p 3030:3030 -p 3031:3031 \
  --env-file .env.prod \
  -e RUN_DB_MIGRATE=true \
  agent-server:prod
```

首次部署需执行迁移；也可在 CI 里单独跑 `pnpm exec prisma migrate deploy`，容器不设 `RUN_DB_MIGRATE`。

### 方式二：裸机 + PM2

```bash
pnpm install --frozen-lockfile
pnpm run build:prod
pnpm run start:server:prod   # pm2-runtime ecosystem.config.cjs
```

`ecosystem.config.cjs` 会同时启动：

- `runtime-main`（3030，只入队）
- `worker-main`（消费队列，3031 `/health`）

### 发布前必做

```bash
pnpm exec prisma migrate deploy
pnpm run db:seed              # 仅首次；上线后改默认管理员密码
```

---

## 拓扑（单机）

```text
                    ┌─ Runtime :3030（HTTP）
[网关] → 应用机 ────┤
                    └─ Worker（队列消费，:3031/health）
              ↓
         PostgreSQL + Redis（同机或外置）
```

当前默认 **一台应用机** 用 Docker / PM2 同时起两个进程；PG、Redis 小流量可放同机，正式环境建议外置。
