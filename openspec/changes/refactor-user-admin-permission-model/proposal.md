## 为什么

当前数据结构将业务用户、后台管理用户和权限模型耦合在同一套 `User/Role` 关系中，难以清晰表达“系统管理权限”与“业务能力权限”的边界。随着 AI Agent 平台同时服务 C 端用户、B 端业务人员和管理后台，需要一次结构化重构，在保持模型简单的前提下为后续 RBAC 升级预留空间。

## 变更内容

- 将用户体系拆分为两类主体：`User`（业务用户）与 `AdminUser`（后台管理员）。
- 为 `User` 引入显式类型与角色枚举（如 C 端外部用户、B 端内部员工），用于承载业务身份分类。
- 为 `AdminUser` 引入 `AdminRole` 枚举：`SUPER_ADMIN`、`OPERATOR`、`VIEWER`，用于后台管理权限分层。
- 调整权限模型：业务侧权限由 `UserType/UserRole` 约束可使用的 Tool 子集；后台系统权限由 `AdminRole` 控制管理能力。
- 梳理 `Tool/Skill/Integration` 管理关系，使后台管理员权限可以直接约束配置与维护操作。

## 功能 (Capabilities)

### 新增功能
- `user-admin-separation`: 定义业务用户与后台管理员的独立身份模型与存储结构。
- `admin-role-permissions`: 定义后台管理员角色分级及其可执行的系统管理权限边界。
- `user-tool-authorization`: 定义业务用户基于身份类型/业务角色使用 Tool 子集的权限模型。

### 修改功能
- `<existing-name>`: 无

## 影响

- 数据库模型：`prisma/schema.prisma` 中用户、角色与权限相关表结构及关联关系。
- 类型与实体：`src/entities/*.entity.ts` 及 `src/types/*.type.ts` 中用户、管理员、权限模型类型定义。
- 业务模块：`src/modules` 中涉及 `Tool/Skill/Integration` 配置与鉴权的服务边界。
- 潜在迁移：需要数据迁移方案以平滑从旧 `User/Role` 关系迁移到新模型。
