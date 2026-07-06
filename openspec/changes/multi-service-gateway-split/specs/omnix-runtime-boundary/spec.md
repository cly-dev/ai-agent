## 新增需求

### 需求:omnix-runtime 必须承载 C 端 HTTP 与 SSE 连接

`omnix-runtime` 必须监听 `:3030`，必须提供 `/chat/**` SSE 与消息 API、`/user/login`、`/app-client/auth`、`/agent/client/**`、`/host-tool/client/**`、`/approval/**` 等 C 端路由（与 `CLIENT_PUBLIC_API_EXCLUDES` 一致），且禁止在本进程内启动 BullMQ Worker consumer。

#### 场景:用户发起 Chat 并入队 Run

- **当** C 端用户通过 `/chat/send` 发起对话
- **那么** runtime 必须校验 JWT 与 App DSN、将 Run 任务写入 BullMQ 队列，且必须立即通过 SSE 向该 session 推送已接受/排队状态

#### 场景:Runtime 禁止本地消费 Run 队列

- **当** `omnix-runtime` 进程启动且 `SESSION_RUN_WORKER_ENABLED=0`
- **那么** 进程禁止注册 BullMQ Worker consumer；Run 执行必须由 `omnix-worker` 完成

### 需求:omnix-runtime 必须订阅 Redis SSE Relay 并向浏览器推送

`omnix-runtime` 必须订阅 `CHAT_SSE_RELAY_CHANNEL`（或 `@omnix/protocol` 定义的等价 channel），将 worker 发布的 Run 事件 relay 至对应 session 的 SSE 连接。

#### 场景:Worker 执行中产生流式 Think 事件

- **当** worker 在另一进程 publish 一条 SSE relay 消息（event=think, sessionId=X）
- **那么** runtime 必须将该事件推送给 session X 的活跃 SSE 订阅者

### 需求:omnix-runtime 必须通过 Runtime Cache 读取配置

runtime 禁止在每次 Run 发起时全量扫描 DB 加载 Agent/Skill/Tool catalog；必须通过 `RuntimeCacheModule`（或等价）读取带 revision 的缓存快照。

#### 场景:Cache revision 更新后下一次 Run

- **当** api bump cache revision 且 runtime 收到失效通知
- **那么** runtime 下一次 Run 必须使用刷新后的 catalog
