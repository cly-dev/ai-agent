## 1. 数据模型重构

- [x] 1.1 在 `prisma/schema.prisma` 新增 `AdminUser` 模型与 `AdminRole` 枚举（`SUPER_ADMIN`/`OPERATOR`/`VIEWER`）
- [x] 1.2 在 `User` 模型新增或调整 `UserType`、`UserRole` 等业务身份字段，去除与后台管理权限耦合的表达
- [x] 1.3 为业务用户到 Tool 子集授权建立关系结构（映射表或等价结构），并补充必要索引与约束
- [x] 1.4 生成并应用 Prisma migration，验证数据库结构可在本地成功创建

## 2. 实体与类型同步

- [x] 2.1 更新 `src/entities` 中用户相关实体，新增 `admin-user.entity.ts` 并同步 `UserEntity` 字段
- [x] 2.2 更新 `src/types` 中用户与权限相关类型，补充 `AdminRole`、`UserType`、`UserRole` 类型定义
- [x] 2.3 更新实体与类型聚合导出（`index.ts`），确保新模型可被模块层正确引用

## 3. 权限与模块适配

- [x] 3.1 在后台管理接口鉴权逻辑中接入 `AdminRole` 分级：`SUPER_ADMIN` 全部、`OPERATOR` 配置管理、`VIEWER` 只读
- [x] 3.2 在业务能力调用链路中接入 `UserType/UserRole` 到 Tool 子集的授权校验
- [x] 3.3 确保业务用户无法访问 Tool/Skill/Integration 管理接口，补充统一拒绝响应

## 4. 迁移与兼容

- [x] 4.1 编写旧 `User/Role` 到新结构的映射脚本（含默认管理员初始化策略）
- [x] 4.2 实现短期双读兼容开关（旧模型与新模型），确保可渐进切换
- [x] 4.3 制定并验证回滚步骤（数据库快照恢复 + 鉴权逻辑切回）

## 5. 验证与收尾

- [x] 5.1 执行静态检查与关键流程验证（管理员管理、业务用户调用 Tool、越权拦截）
- [x] 5.2 清理与旧权限模型耦合的调用路径，确认无新增 lint/type 错误
- [x] 5.3 更新变更说明与实施备注，记录待确认项（`UserRole` 粒度、授权继承策略、审计字段）
