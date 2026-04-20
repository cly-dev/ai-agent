## 上下文

项目已经具备 Prisma schema 与迁移基础，但应用层还未形成可直接使用的数据库服务注入与用户业务模块。为了后续功能开发，需要先打通“应用启动 -> Prisma 连接 -> User 模块 CRUD”这条主链路。

## 目标 / 非目标

**目标：**

- 在 Nest 应用中提供统一的 Prisma 数据库连接服务并可复用。
- 在 `src/modules/user` 完成可用的 CRUD（create/list/detail/update/delete）。
- 保持接口与实现简洁，优先满足当前用户模型字段（`id`、`username`、`createdAt`）。
- 增加基础测试/校验，保证核心路径可运行。

**非目标：**

- 不在本次引入复杂鉴权、分页高级筛选、软删除等扩展能力。
- 不实现跨模块事务编排，仅提供用户模块的直接数据访问。

## 决策

### 决策 1：新增 PrismaService + PrismaModule

- 选择：封装 `PrismaClient` 到 `PrismaService`，并通过 `PrismaModule` 对外导出。
- 原因：统一连接生命周期管理，便于其他模块注入。
- 备选：各模块直接 new PrismaClient（会造成连接重复与难维护）。

### 决策 2：User 模块按 Nest 标准分层

- 选择：`controller + service + dto (+ module)`。
- 原因：结构清晰、易测试，与后续生成器产物风格一致。
- 备选：把逻辑写在 controller（不利于扩展和测试）。

### 决策 3：更新接口使用部分字段 DTO

- 选择：更新用户时只允许更新 `username`。
- 原因：最小可用，避免暴露系统字段。
- 备选：全量透传 Prisma 输入（安全与边界控制较弱）。

## 风险 / 权衡

- [数据库地址配置错误导致启动失败] → 在启动时输出明确错误并补充 README/PRISMA 文档指引。
- [删除不存在用户的行为不明确] → 统一返回 404（或业务约定错误）并在 Service 层处理。
- [模块初版测试覆盖有限] → 先覆盖 service 的核心 CRUD，后续补充 e2e。

## Migration Plan

1. 新增 Prisma 基础模块并接入 `AppModule`。
2. 实现 User 模块（DTO/Service/Controller）。
3. 本地连接数据库并验证 CRUD。
4. 添加基础测试并更新文档。

## Open Questions

- 用户列表接口是否需要立即支持分页参数（`page/pageSize`）？
- 删除接口是硬删除还是预留软删除字段？
