## 新增需求

### 需求:Gateway 必须按路径前缀透明转发至对应后端服务

Gateway 必须作为 Omnix 对外的唯一 HTTP(S) 入口。Gateway 必须根据请求 path 最长前缀匹配，将流量转发至 `omnix-api`、`omnix-runtime` 或 `omnix-page`，且不得修改对外可见的 URL path。

#### 场景:B 端 Admin API 转发

- **当** 客户端请求 `GET /admin/agent/list`
- **那么** Gateway 必须将请求转发至 `omnix-api:3020`，且 upstream 收到的 path 仍为 `/admin/agent/list`

#### 场景:C 端 Chat SSE 转发

- **当** 客户端请求 `GET /chat/:sessionId/events`（SSE）
- **那么** Gateway 必须转发至 `omnix-runtime:3030`，且必须禁用响应缓冲、允许长连接（read timeout ≥ 3600s）

#### 场景:PageAgent LLM Proxy 转发

- **当** 客户端请求 `POST /page-agent/compatible-mode/v1/chat/completions`
- **那么** Gateway 必须转发至 `omnix-page:3040`

### 需求:Gateway 禁止将公网流量路由至 Worker

Gateway 必须禁止将任何面向用户的 HTTP 请求转发至 `omnix-worker:3031`。Worker 仅允许内网健康检查与 Redis/Postgres 访问。

#### 场景:外部访问 Worker 端口

- **当** 公网客户端尝试访问 `https://api.example.com` 下任意 path，且该 path 未匹配 api/runtime/page 规则
- **那么** Gateway 必须返回 404，且不得将请求转发至 Worker

### 需求:Gateway 必须透传鉴权与 App 上下文头

Gateway 转发请求时必须透传 `Authorization`、`X-App-Dsn`、`X-Request-Id`（若存在）及 `X-Forwarded-For`，不得剥离或改写 JWT。

#### 场景:带 Bearer Token 的 C 端请求

- **当** 客户端携带 `Authorization: Bearer <token>` 与 `X-App-Dsn: <dsn>` 请求 `/chat/send`
- **那么** 上游 `omnix-runtime` 收到的请求头必须包含相同的 `Authorization` 与 `X-App-Dsn`
