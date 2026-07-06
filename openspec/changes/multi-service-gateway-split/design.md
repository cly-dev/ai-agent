## 上下文

### 当前状态

| 项 | 现状 |
|----|------|
| 代码 | 根 `src/`，全量 `AppModule` |
| 进程 | `runtime-main`（HTTP on, Worker off）+ `worker-main`（HTTP off, Worker on） |
| 部署 | 单 Docker 镜像 + PM2 双进程（`ecosystem.config.cjs`） |
| 端口 | 3030（HTTP）、3031（Worker `/health`） |
| 前缀 | B 端 `/admin/*`；C 端路径见 `CLIENT_PUBLIC_API_EXCLUDES` |
| Monorepo | `apps/{api,runtime,worker,page}` 脚手架 + `packages/protocol` 等占位 |
| 跨进程 SSE | **已有** `CHAT_SSE_RELAY_CHANNEL` Redis Pub/Sub（`chat-events.service.ts`） |
| 跨进程 Run | **已有** BullMQ + Redis Session Run 状态 |

### 目标形态

```text
                         ┌──────────────────────────┐
  Browser / SDK / B端 ──►│  omnix-gateway  :443     │
                         │  (独立 repo，可选)        │
                         └────────────┬─────────────┘
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
     omnix-api:3020          omnix-runtime:3030       omnix-page:3040
     B 端 /admin/*           C 端 Chat/SSE/Run        page-action/agent
              │                      │                      │
              └──────────────────────┼──────────────────────┘
                                     ▼
                            omnix-worker:3031 (内网)
                            BullMQ consumer + AgentEngine
                                     │
                          PostgreSQL + Redis (共享)
```

### 约束

- 对外 HTTP path **不变**（Gateway 透明转发）。
- Worker **不经 Gateway 暴露**；仅内网 `/health` + Redis 消费。
- 遵循 `no-hardcoded-intent-matching`：意图/smalltalk 仍走 JSON/env，不在拆分中引入硬编码词表。
- 拆分顺序：**Worker → Page → Api → Runtime**（边界清晰度递减）。

---

## 目标 / 非目标

**目标：**

- 4 个业务服务 + 1 个 Gateway，各 **一端口、一 Git 仓库、一 Docker 镜像**。
- Gateway 按 path 串联，前端/SDK **无需改 path**。
- 明确每个 `src/modules/*` 与 `src/core/*` 的归属与跨服务依赖。
- 分阶段迁移，每阶段可独立验证、可回滚。
- 复用已有 BullMQ、Redis SSE Relay，不重复造轮子。

**非目标：**

- 本次不拆分 Postgres 为多库（短期共享 schema）。
- 不做服务网格（Istio/Linkerd）——Gateway + 内网 DNS 足够。
- 不在 api 与 runtime 之间引入 gRPC（HTTP/Redis 优先）。
- 不重写 AgentEngine 业务逻辑，仅做边界与部署拆分。
- Gateway 层不做 BFF 聚合（纯反向代理 + 可选 JWT 验签）。

---

## 决策

### 决策 1：服务划分与端口（与 `@omnix/protocol` 对齐）

| 服务 | Git 仓库名（建议） | 端口 | 公网 | 职责 |
|------|-------------------|------|------|------|
| `omnix-gateway` | `omnix-gateway` | 443/80 | 是 | 路由、TLS、CORS、限流 |
| `omnix-api` | `omnix-api` | 3020 | 经 Gateway | B 端配置 CRUD |
| `omnix-runtime` | `omnix-runtime` | 3030 | 经 Gateway | C 端运行面 + SSE |
| `omnix-worker` | `omnix-worker` | 3031 | **否** | 异步 AgentRun |
| `omnix-page` | `omnix-page` | 3040 | 经 Gateway | PageAction + PageAgent |

**理由**：与现有 `packages/protocol/src/services.ts` 及 `MONOREPO.md` 阶段 3/4 一致；Worker 3031 已在生产 PM2 中使用。

---

### 决策 2：Gateway 路由表

Gateway **按最长前缀匹配**；对外域名示例 `https://api.example.com`。

| 优先级 | Path 模式 | 上游 | 备注 |
|--------|-----------|------|------|
| 1 | `/admin/**` | `omnix-api:3020` | 含 globalPrefix |
| 2 | `/docs/**` | `omnix-api:3020` | Swagger（或 runtime，见 Open Questions） |
| 3 | `/chat/**` | `omnix-runtime:3030` | **SSE**：`proxy_buffering off`，`proxy_read_timeout 3600s` |
| 4 | `/user/login` | `omnix-runtime:3030` | POST |
| 5 | `/user/password-reminder` | `omnix-runtime:3030` | GET |
| 6 | `/app-client/auth` | `omnix-runtime:3030` | POST |
| 7 | `/agent/client/**` | `omnix-runtime:3030` | C 端 Agent 列表 |
| 8 | `/host-tool/client/**` | `omnix-runtime:3030` | C 端 HostTool |
| 9 | `/approval/**` | `omnix-runtime:3030` | C 端审批收件箱 |
| 10 | `/page-action/**` | `omnix-page:3040` | |
| 11 | `/page-agent/**` | `omnix-page:3040` | LLM Proxy |
| — | `/health` | Gateway 聚合 | 可选：并行探测各服务 |

Nginx 示例片段：

```nginx
location /admin/ {
  proxy_pass http://omnix-api:3020;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location /chat/ {
  proxy_pass http://omnix-runtime:3030;
  proxy_http_version 1.1;
  proxy_set_header Connection '';
  proxy_buffering off;
  proxy_cache off;
  chunked_transfer_encoding off;
  proxy_read_timeout 3600s;
}

location /page-agent/ {
  proxy_pass http://omnix-page:3040;
}
```

**替代方案**：
- *Kong / APISIX 路由* → 更灵活，运维成本更高；团队若已有可优先。
- *Runtime 做 BFF 转发 page* → 增加耦合，否决。

---

### 决策 3：模块与 Core 归属清单

#### omnix-api（B 端，globalPrefix `/admin`）

**modules/**

| 模块 | Controller 前缀 | 说明 |
|------|----------------|------|
| `admin-user` | `/admin/admin-user` | 管理员账号 |
| `agent` | `/admin/agent` | Agent CRUD（非 client 路由） |
| `tool` | `/admin/tool` | |
| `tool-category` | `/admin/tool-category` | |
| `skill` | `/admin/skill` | |
| `skill-tool` | `/admin/skill-tool` | |
| `workflow` | `/admin/workflow` | 定义与版本 |
| `role` | `/admin/role` | |
| `role-tool` | `/admin/role-tool` | |
| `role-skill` | `/admin/role-skill` | |
| `user`（admin） | `/admin/user` | `UserAdminController` |
| `user-app` | `/admin/user-app` | |
| `user-app-role` | `/admin/user-app-role` | |
| `user-model-config` | `/admin/user-model-config` | |
| `user-llm-model-config` | `/admin/user-llm-model-config` | |
| `llm-model-config` | `/admin/llm-model-config` | |
| `prompt-template` | `/admin/prompt-template` | |
| `integration` | `/admin/integration` | |
| `message-feedback` | `/admin/message-feedback` | B 端审计 |
| `app-client` | `/admin/app-client` | DSN 配置（非 `/app-client/auth`） |

**core/**（api 侧）

| 目录 | 说明 |
|------|------|
| `runtime-cache/` | Catalog 写入 + **失效广播**（api 改配置时 bump revision） |
| `auth/`（Admin 部分） | `AdminPrefixJwtGuard`、`AdminRoleGuard` |
| `security/` | bootstrap、CORS 配置（B 端） |

**prisma/**：schema **归 api 仓库**维护；其他服务依赖发布的 `@omnix/prisma-client`。

---

#### omnix-runtime（C 端运行面）

**modules/**

| 模块 | 对外 Path | 说明 |
|------|-----------|------|
| `chat` | `/chat/**` | SSE 订阅在此进程 |
| `session` | `/admin/session` *或* 迁至 api | 见 Open Questions |
| `message` | `/admin/chat/:sessionId/messages` | 消息 CRUD |
| `message-turn` | `/admin/message-turn` | |
| `agent-run` | `/admin/agent-run` | Run 发起/查询 |
| `user`（C 端） | `/user/login`、`/user/password-reminder` | |
| `app-client`（auth） | `/app-client/auth` | |
| `agent`（client） | `/agent/client/*` | 只读列表 |
| `host-tool`（client） | `/host-tool/client/*` | |
| `approval`（inbox） | `/approval/**` | C 端审批收件箱 |
| `modules/approval/` | 同上 | |

**core/**（runtime 侧）

| 目录 | 说明 |
|------|------|
| `session-run/` | **Coordinator + Launcher + SSE Gateway**（入队侧） |
| `memory/` | Redis 连接、Session 上下文（读） |
| `runtime-cache/` | Catalog **读** + revision 订阅 |
| `host-bridge/` | pageContext 协议 |
| `auth/`（User JWT） | `UserJwtAuthGuard` |
| `approval/`（运行时） | 审批恢复入口（与 inbox 配合） |

**禁止放入 runtime**：`agent-engine` 执行图、LangGraph runner（归 worker）。

---

#### omnix-worker（内网执行面）

**core/**

| 目录 | 说明 |
|------|------|
| `agent-engine/` | LangGraph、Plan、Write Gate、Tool 执行 |
| `session-run/` | BullMQ **Consumer**、`AgentRunLauncher` 执行侧 |
| `workflow/` | Workflow runner / executor |
| `intent/` | 意图召回 |
| `tool-engine/` | HTTP Tool 调用 |
| `llm/` | LLM 调用 |
| `prompt/` | Prompt 组装 |
| `memory/` | Run 状态 Redis 读写 |
| `skill/`（core） | Skill 执行逻辑 |
| `page-action/`（core runner） | 若 page 同步 invoke 需跨服务 HTTP，异步 run 在 worker |
| `draft-review/` | Write draft |
| `approval/`（resume） | 审批恢复执行 |

**modules/**（worker 最小 HTTP）

| 模块 | 说明 |
|------|------|
| 无业务 Controller | 仅 `bootstrap/worker-health-server` → `:3031/health` |

**Run 事件出站**：Worker 内 `ChatRunEventPublisher` 改为 **Redis-only relay**（不持有 SSE 连接），由 Runtime 的 `ChatEventsService` subscribe 后推给浏览器。

---

#### omnix-page（页面侧）

**modules/**

| 模块 | Path |
|------|------|
| `page-action` | `/page-action/invoke` 等 |
| `page-agent` | `/page-agent/compatible-mode/v1/**` |

**core/**

| 目录 | 说明 |
|------|------|
| `page-action/` | Page workflow orchestrator |
| `llm/`（proxy 部分） | PageAgent LLM 转发 |
| `approval/`（page 触发） | pageAction 审批挂起 |

**依赖**：读 `LlmModelConfig`（DB 或调 api 内网接口 + 缓存）。

---

### 决策 4：跨服务通信

```text
Browser ──SSE──► runtime ◄──Redis Pub/Sub── worker
                    │                           │
                    └── BullMQ enqueue ──────────►│ consume
                    │                           │
                    └── Postgres ◄──────────────┘
api ──► Postgres (写配置) ──► Redis cache revision bump ──► runtime/worker 刷新 catalog
```

| 链路 | 机制 | 已有？ |
|------|------|--------|
| Run 入队 | BullMQ `session-run` queue | 是 |
| Run 状态 | Redis HASH + generation | 是 |
| SSE 跨进程 | `CHAT_SSE_RELAY_CHANNEL` publish/subscribe | 是 |
| Catalog 缓存 | `RuntimeCacheModule` + revision | 是 |
| 配置变更失效 | api 写 DB 后 bump revision | 需强化 |
| Worker → Runtime 直连 HTTP | **禁止**（除 health） | — |

**Worker 侧 RunEventPublisher 改造**：抽象 `RedisRunEventPublisher`，publish 到 `CHAT_SSE_RELAY_CHANNEL`；Runtime 保持现有 subscribe 逻辑。

---

### 决策 5：共享包与多仓库策略

| 包 | 仓库 | 发布 |
|----|------|------|
| `@omnix/protocol` | `omnix-protocol`（或 monorepo packages） | 私有 npm |
| `@omnix/workflow-core` | 同上 | 私有 npm |
| `@omnix/runtime-cache-protocol` | 同上 | 私有 npm |
| `@omnix/prisma-client` | 由 `omnix-api` generate 后发布 | 版本与 migration 绑定 |

各服务 `package.json` 依赖固定版本的 `@omnix/*`；schema 变更时 **先 api migrate + 发 prisma-client，再升其他服务**。

---

### 决策 6：鉴权

| 层级 | 策略 |
|------|------|
| Gateway | TLS 终结；**可选** JWT 验签（减轻后端压力） |
| 各服务 | **必须**保留现有 Guard（`AdminPrefixJwtGuard` / `UserJwtAuthGuard`），防止内网绕过 |
| 内网 | K8s NetworkPolicy：worker 仅 Redis/Postgres；page/runtime/api 仅 Gateway 可入 |

共享 `JWT_SECRET`（各服务 env 注入，不硬编码）。

---

### 决策 7：迁移阶段

```text
Phase 0  现状          runtime + worker 双进程，单 repo，单镜像
Phase 1  Monorepo 物理  apps/*/src 独立 Nest 工程，仍单 repo 单镜像（或多 stage COPY）
Phase 2  独立镜像      4 个 Dockerfile，K8s 4 Deployment，Gateway 仍指向旧域名测试
Phase 3  Worker 独立仓  最先 git split；验证 BullMQ + SSE relay
Phase 4  Page 独立仓    path 边界清晰
Phase 5  Api 独立仓     schema 归属明确
Phase 6  Runtime 瘦身   最后拆（耦合最多）
Phase 7  Gateway 切流量 灰度 10% → 100%；下线单体镜像
```

**回滚**：Gateway 权重切回单体；各阶段保持「新旧并行」至少一个 sprint。

---

## 风险 / 权衡

| 风险 | 缓解 |
|------|------|
| Worker 发 SSE 但 Runtime 未订阅 → 用户看不到流式输出 | 集成测试 `test:session-run-split` 扩展为跨容器；监控 relay lag |
| api 改配置后 runtime/worker catalog 不一致 | 强制 `RuntimeCacheInvalidator` + revision；api 写后必须 bump |
| 无 Redis 时多服务无法工作 | 部署检查清单：Redis 为 hard dependency；文档明确禁止无 Redis 多副本 |
| Session 模块归属模糊（admin path 但 C 端用） | Phase 5 前保留在 runtime；长期 session CRUD 归 api、runtime 只读 |
| Prisma schema 多服务 code drift | 仅 api 仓维护 schema；其他只消费 generated client |
| Gateway SSE 超时 | Nginx `proxy_read_timeout`、禁用 buffering |
| 拆分中途双写 | 每 Phase 只迁一个边界；Feature flag 控制入口 |

---

## 迁移计划

### Phase 1（Monorepo 内，低风险）

1. `apps/worker` 迁入 `agent-engine` + session-run consumer，`WorkerAppModule` 替换 `AppModule`。
2. `apps/page` 迁入 page 模块。
3. `apps/api` 迁入 B 端 modules。
4. `apps/runtime` 迁入 C 端 modules。
5. 根 `src/` 保留 thin re-export 兼容旧路径。
6. 更新 Dockerfile：`COPY apps packages pnpm-workspace.yaml` + `pnpm build:all`。

### Phase 2（独立镜像，同 repo）

- 每 app 独立 `Dockerfile` + K8s manifest 模板。
- 内网 Service DNS：`omnix-runtime.default.svc.cluster.local:3030` 等。

### Phase 3–6（Git 拆分）

- 使用 `git filter-repo` 或复制 + 历史截断，按 Phase 顺序开新仓。
- CI 各仓独立 pipeline；Gateway 仓存 nginx.conf / helm chart。

### Phase 7（切流量）

- Gateway 指向新服务；监控 5xx、SSE 断开率、BullMQ pending。
- 保留单体镜像一个版本可快速回滚。

---

## 待定问题

1. **Swagger `/docs` 放 api 还是 runtime？** 建议 api（B 端为主），runtime 另开 `/runtime-docs` 或合并 OpenAPI 于 Gateway。
2. **`session` / `message` 模块是否在 admin 下但归 runtime？** 短期归 runtime（与 chat 同进程）；长期 message 历史查询可迁 api。
3. **Gateway 产品选型？** Nginx（简单） vs 云 ALB path routing vs Kong（需团队确认）。
4. **page 读 LlmModelConfig：直连 DB 还是调 api？** 短期直连 DB；中期 api 内网 `GET /internal/llm-model-config/:id`。
5. **是否 fifth repo `omnix-protocol`？** 建议独立小包仓库，避免 api 仓成为所有服务的 git 依赖。
