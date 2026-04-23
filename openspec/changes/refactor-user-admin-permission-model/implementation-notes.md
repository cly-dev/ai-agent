## 实施备注

### 已完成内容

- 已完成 `User` / `AdminUser` 主体拆分及 `AdminRole`、`UserType`、`UserRole` 枚举引入。
- 已新增 `UserRoleTool` 作为业务用户到 Tool 子集授权关系。
- 已新增迁移脚本 `prisma/scripts/migrate-user-role-to-new-model.ts`，包含：
  - 旧模型数据映射（`User.roleId` 存在时执行）；
  - 默认 `SUPER_ADMIN` 管理员初始化；
  - 基于历史 `RoleSkill + SkillTool` 的授权映射回填。
- 已提供双读兼容开关：`AUTHZ_SOURCE=legacy|new`（默认 `new`）。

### 回滚步骤

1. 恢复数据库快照到迁移前状态（包含 `User.roleId` 与旧鉴权关系）。
2. 设置 `AUTHZ_SOURCE=legacy` 并重启服务，切回旧授权路径。
3. 若已执行新模型数据脚本，保留 `AdminUser` 与 `UserRoleTool` 数据，不作为旧路径运行前置依赖。
4. 核验旧流程（用户登录、角色授权工具查询）后，再决定是否重新执行新迁移。

### 待确认项

- `UserRole` 是否需要进一步按业务线细分（如客服、运营、销售）。
- 用户授权是否采用“角色继承 + 个体覆盖”双层模型。
- `AdminUser` 是否在本次纳入审计字段（最后登录时间、最后操作时间）。

### 风险提示

- 当前 `tool/skill/integration` 控制器仍是空壳路由，`AdminRole` 分级尚未在具体读写接口上细分执行。
- 后续补齐管理接口后，需要把 `SUPER_ADMIN` / `OPERATOR` / `VIEWER` 权限差异绑定到具体 handler。
