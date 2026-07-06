## 为什么

当前 `agent-server` 为单体 Nest 应用（业务代码集中在根 `src/`），虽已通过 `runtime-main` / `worker-main` 拆成双进程，但仍共享同一镜像、同一 Git 仓库与全量 `AppModule`。随着 B 端配置面、C 端运行面、异步 Worker、PageAgent 职责边界清晰，需要演进为 **一服务一端口一 Git 仓库**，由 **API Gateway 统一对外入口**，以实现独立发版、独立扩缩容与故障隔离。

## 变更内容

- 定义 **5 个部署单元**：`omnix-gateway`（入口）、`omnix-api`（3020）、`omnix-runtime`（3030）、`omnix-worker`（3031 内网）、`omnix-page`（3040）。
- 制定 **Gateway 路径路由表**：对外 URL 不变（如 `/chat/*`、`/admin/*`、`/page-agent/*`），Gateway 按前缀转发至对应后端。
- 制定 **代码归属清单**：`src/modules/*`、`src/core/*`、`prisma/` 各模块迁入哪个仓库。
- 定义 **跨服务基础设施协议**：共享 Postgres、Redis BullMQ 入队/消费、JWT 验签、`CHAT_SSE_RELAY` Redis Pub/Sub（Worker → Runtime SSE）。
- 定义 **共享 npm 包**：`@omnix/protocol`、`@omnix/workflow-core`、`@omnix/runtime-cache-protocol`、可选 `@omnix/prisma-client`。
- 制定 **分阶段迁移路线**：Monorepo 物理目录 → 独立镜像 → 独立 Git 仓库 → Gateway 切流量；每阶段可回滚。
- **BREAKING（部署）**：生产从「单镜像 PM2 双进程」变为「多镜像 + Gateway」；CI/CD、K8s Service、内网 DNS 需同步改造。
- **非 BREAKING（对外 API）**：HTTP path、鉴权头（`Authorization` + `X-App-Dsn`）、响应格式保持不变。

## 功能 (Capabilities)

### 新增功能

- `gateway-routing`：Gateway 对外入口、路径前缀路由、SSE 长连接代理、健康检查聚合。
- `omnix-api-boundary`：`omnix-api` 服务边界——B 端 `/admin/*` 配置与管理 API。
- `omnix-runtime-boundary`：`omnix-runtime` 服务边界——C 端 Chat / Session / SSE / AgentRun 发起。
- `omnix-worker-boundary`：`omnix-worker` 服务边界——BullMQ 消费、AgentEngine 执行、Run 事件发布。
- `omnix-page-boundary`：`omnix-page` 服务边界——PageAction / PageAgent LLM Proxy。
- `cross-service-infrastructure`：跨服务 Postgres、Redis、JWT、SSE 中继、缓存失效、内网通信约定。

### 修改功能

- （无——项目根 `openspec/specs/` 尚无归档基线规范。）

## 影响

- **仓库结构**：由 1 repo 演进为 4～5 repo（gateway 可选独立）；过渡期保留 Monorepo `apps/*` 作为拆分模板。
- **构建/部署**：`Dockerfile`、Jenkins/Kaniko、K8s Deployment/Service、PM2 配置均需按服务拆分；Worker 不暴露公网。
- **数据库**：短期全员共享同一 Postgres + Prisma schema（schema 归 `omnix-api` 仓库维护）；中长期可选 api 独占写 + 其他服务读缓存。
- **Redis**：BullMQ 队列、Session Run 状态、SSE Relay、Runtime Cache 版本——多服务硬依赖。
- **核心模块**：`agent-engine`、`session-run`、`runtime-cache`、`chat-events`（含 Redis relay）跨 runtime/worker 边界需显式协议化。
- **前端/SDK**：Gateway 域名下 path 不变；仅 baseURL 可能从直连 `:3030` 改为统一 Gateway 域名。
