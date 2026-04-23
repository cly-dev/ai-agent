## 为什么

AI Agent 平台需要在调用模型与工具时携带**跨会话的用户记忆**（偏好、事实摘要等）以及**当前对话的短期上下文**（多轮消息、中间状态）。仅靠 PostgreSQL 中的 `Session`/`Message` 可以满足持久化与审计，但在高并发、低延迟场景下，用 **Redis** 做分层存储能更快读写、便于设置 TTL 与滑动窗口，并与现有 `src/core/memory` 模块对齐，形成统一的记忆与上下文抽象。

## 变更内容

- 引入基于 **Redis** 的内存层：`src/core/memory` 下提供可注入的服务与键空间约定，用于**用户级记忆**与**会话级对话上下文**。
- 明确与 **Prisma `User` / `Session` / `Message`** 的关系：Postgres 仍为权威持久化；Redis 为加速层与 Agent 工作集（可配置回填/同步策略，具体见 design）。
- 增加运行依赖：**Redis** 连接配置（环境变量）、Nest 模块注册；**不**强制改变现有对外 HTTP 契约，除非 spec 中另行约定新 API。
- 数据结构层面：视需要在 `User` 或独立配置中增加与记忆版本/开关相关的元数据（可选，见 design）；**BREAKING**：若引入必填环境变量或默认行为变化，在实现与发布说明中标注。

## 功能 (Capabilities)

### 新增功能

- `redis-user-memory`: 定义按用户维度的 Redis 记忆存储（键格式、值结构、TTL、读写与清除语义），与 `User` 身份绑定。
- `redis-session-context`: 定义按会话（`Session`）维度的 Redis 对话上下文（如近期消息摘要或结构化 turns、与 `sessionId` 绑定）及生命周期。

### 修改功能

- （无）当前仓库 `openspec/changes` 下无已归档的同名能力；若后续与「仅 DB 存消息」的假设冲突，在 `redis-session-context` 规范中声明与 `Message` 表的一致性策略即可。

## 影响

- 新依赖：`ioredis` 或 `redis`（Node 官方客户端）、Nest 动态/配置模块。
- 配置：`REDIS_URL` 或 host/port/password 等环境变量；部署与本地开发文档。
- 代码：`src/core/memory/**` 实现与 `AppModule`（或 `LlmModule`/`Agent` 路径）的导入；可能触及 `agent.service`、未来对话流水线。
- 运维：Redis 实例、内存与淘汰策略；监控键数量与连接数。
- 数据：`User`/`Session` 实体在业务层通过 `userId`/`sessionId` 关联 Redis 键，**不要求**在 `user.entity` 中手写 Redis 字段（实体仍为 Prisma 镜像）。
