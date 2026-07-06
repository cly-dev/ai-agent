## 新增需求

### 需求:omnix-worker 必须作为唯一 BullMQ Run Consumer

`omnix-worker` 必须监听 `:3031` 仅用于 `/health`，必须设置 `SESSION_RUN_WORKER_ENABLED=1` 与 `SESSION_RUN_HTTP_ENABLED=0`，且必须是 Session Run BullMQ 队列的唯一 consumer（可水平扩展副本数，但禁止与 runtime 同进程消费）。

#### 场景:Worker 消费队列并执行 AgentEngine

- **当** runtime 向 BullMQ 入队一条 `chat_turn` job
- **那么** worker 必须 pickup 该 job、执行 `AgentEngine` / LangGraph，并将 Run 状态写回 Redis/Postgres

#### 场景:Worker 无公网 HTTP 业务 API

- **当** 外部客户端请求 worker 的 `:3031` 除 `/health` 外的任意 path
- **那么** worker 必须返回 404 或拒绝连接（取决于 health server 实现）

### 需求:omnix-worker 必须通过 Redis 发布 Run 事件而非持有 SSE 连接

worker 禁止维护浏览器 SSE 连接；所有 Run 流式事件（think、message、complete、error、host_action 等）必须通过 Redis Pub/Sub（`CHAT_SSE_RELAY_CHANNEL`）发布，由 runtime 中继至客户端。

#### 场景:Worker 完成一次 Run

- **当** worker 完成 AgentRun 且 status=completed
- **那么** worker 必须 publish `complete` 事件到 SSE relay channel，且 runtime 的 SSE 客户端必须能收到该事件

### 需求:omnix-worker 必须独立部署与扩缩容

worker 必须拥有独立 Docker 镜像与 K8s Deployment（或等价），且必须可通过 `PM2_WORKER_INSTANCES` 或 HPA 独立于 runtime 扩缩容。

#### 场景:仅增加 Run 算力

- **当** BullMQ pending jobs 持续升高
- **那么** 运维必须能够仅扩容 worker Deployment，而无需同比例扩容 runtime 或 api
