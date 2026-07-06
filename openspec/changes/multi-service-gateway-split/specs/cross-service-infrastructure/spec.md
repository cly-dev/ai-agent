## 新增需求

### 需求:多服务部署必须共享 Postgres 与 Redis

`omnix-api`、`omnix-runtime`、`omnix-worker`、`omnix-page` 在生产环境必须连接同一 Postgres 实例（同一 schema）与同一 Redis 实例（同一 DB index 或 prefix 约定）。

#### 场景:无 Redis 时禁止多服务生产部署

- **当** 生产环境未配置 `REDIS_URL` 或 `REDIS_HOST`
- **那么** 多服务拆分部署必须失败启动（deploy check 或文档化 hard dependency），禁止以 in-memory 队列跨进程运行

### 需求:各服务必须使用一致的 JWT 验签配置

所有服务必须使用相同的 `JWT_SECRET`（或 JWKS 等价配置）验证 User JWT 与 Admin JWT；禁止各服务使用不同 secret。

#### 场景:Runtime 签发的 User Token 在 Page 服务有效

- **当** 用户通过 runtime `/user/login` 获得 JWT，并立即请求 page `/page-agent/...`
- **那么** page 服务必须成功验签该 JWT

### 需求:共享协议必须通过 @omnix/protocol npm 包发布

服务名、默认端口、Redis key/channel 前缀、BullMQ queue 名、SSE relay channel 名必须定义在 `@omnix/protocol` 中；各服务禁止硬编码重复的 magic string。

#### 场景:SSE Relay Channel 跨仓库一致

- **当** worker 发布与 runtime 订阅 SSE relay
- **那么** 双方使用的 channel 名必须来自 `@omnix/protocol` 的同一常量

### 需求:内网服务间通信必须走 Cluster DNS 或等价服务发现

Kubernetes（或等价）环境中，Gateway 与各服务必须使用 Service DNS（如 `omnix-runtime:3030`）通信；禁止在代码中硬编码 Pod IP。

#### 场景:Gateway 转发至 Runtime

- **当** Gateway 配置 upstream 为 `http://omnix-runtime:3030`
- **那么** 必须解析为 K8s Service 而非 localhost

### 需求:每服务必须暴露独立健康检查端点

`omnix-api`、`omnix-runtime`、`omnix-page` 必须提供 `GET /health`（或 `/admin/health` 经 Gateway 映射）；`omnix-worker` 必须提供 `GET :3031/health`。健康检查必须验证 DB/Redis 连通性（至少一项）。

#### 场景:K8s Liveness 探测 Worker

- **当** K8s 对 worker Pod 执行 liveness probe
- **那么** 必须请求 `:3031/health` 且 Redis 不可达时 probe 必须失败
