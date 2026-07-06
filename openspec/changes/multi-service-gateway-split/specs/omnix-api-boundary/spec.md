## 新增需求

### 需求:omnix-api 必须承载全部 B 端 Admin 配置 API

`omnix-api` 服务必须监听 `:3020`，必须使用 globalPrefix `/admin`，且必须提供 Agent、Tool、Skill、Workflow、Role、User（管理）、AppClient（配置）、Integration、PromptTemplate、LlmModelConfig 等 B 端 CRUD API。

#### 场景:管理员创建 Agent

- **当** 持有 Admin JWT 的客户端请求 `POST /admin/agent`
- **那么** 请求必须由 `omnix-api` 处理并持久化至 Postgres，且不得依赖 `omnix-runtime` 或 `omnix-worker` 的同进程调用

#### 场景:无 Admin 权限拒绝

- **当** 客户端未携带有效 Admin JWT 请求 `/admin/tool/list`
- **那么** `omnix-api` 必须返回 401 或 403，且不得降级为匿名访问

### 需求:omnix-api 必须作为 Prisma Schema 的唯一维护方

`omnix-api` 仓库必须包含 `prisma/schema.prisma` 及全部 migration 脚本。其他服务禁止独立修改 schema；其他服务必须通过 `@omnix/prisma-client` 消费与 api 发布版本一致的 generated client。

#### 场景:Schema 变更发布

- **当** api 仓库合并新的 Prisma migration
- **那么** 必须先执行 `prisma migrate deploy`，再发布新版本 `@omnix/prisma-client`，其他服务方可升级依赖

### 需求:omnix-api 配置变更必须触发 Runtime Cache 失效

当 api 修改 Agent、Tool、Skill、Workflow、HostTool 等影响运行时的配置时，api 必须 bump runtime cache revision（通过 Redis 或等价机制），以便 runtime 与 worker 刷新 catalog。

#### 场景:更新 Skill 后 Worker 可见新版本

- **当** 管理员在 api 更新 Skill 并发布
- **那么** 在 revision 传播完成后的下一次 AgentRun，worker 必须使用更新后的 Skill 定义
