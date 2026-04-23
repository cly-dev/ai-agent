## 1. 依赖与配置

- [x] 1.1 添加 Redis 客户端依赖（如 `ioredis`）与类型定义
- [x] 1.2 增加环境变量约定（`REDIS_URL` 或 HOST/PORT/PASSWORD/DB）并在 README 或部署文档中说明

## 2. 核心模块 `src/core/memory`

- [x] 2.1 创建 `MemoryModule`，在 `onModuleInit`/`onModuleDestroy` 中建立与关闭 Redis 连接
- [x] 2.2 实现键名构建工具（前缀 `agent:`、`memory:user:{id}`、`context:session:{id}`）
- [x] 2.3 实现 `UserMemoryStore`（或等价方法）：get / set（JSON）/ delete / 可选 set 带 TTL
- [x] 2.4 实现 `SessionContextStore`（或等价方法）：get / set / patch 合并 / delete，**必须**支持 TTL 与续期
- [x] 2.5 为非法 `userId`/`sessionId`（非正整数等）提供参数校验并拒绝写入

## 3. 集成与一致性

- [x] 3.1 在 `AppModule`（或 Agent 专用模块）中导入 `MemoryModule`
- [x] 3.2 （可选）在 Agent/对话流水线中注入 Store，读取用户记忆与会话上下文拼入 LLM 请求
- [x] 3.3 （可选）实现从 `Message` 表懒加载回填会话上下文至 Redis，行为与设计文档一致

## 4. 验证

- [x] 4.1 本地或 CI 用 Redis 容器做冒烟：连接、读写、TTL 过期
- [x] 4.2 确认多 `sessionId` 键隔离、无跨用户键串用
