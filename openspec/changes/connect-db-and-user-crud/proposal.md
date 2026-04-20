## 为什么

项目当前缺少稳定的数据库连接落地与 `src/modules/user` 的业务 CRUD 能力，导致用户数据无法通过标准模块化接口进行创建、查询、更新和删除。现在推进该变更可以让后续鉴权、会话和业务功能建立在可用的数据层之上。

## 变更内容

- 完成应用数据库连接配置与初始化（基于 Prisma）。
- 新增 `src/modules/user` 模块，提供标准增删改查能力。
- 补充用户模块的 DTO、Service、Controller 与必要错误处理。
- 增加最小验证与测试，确保 CRUD 行为可回归。

## 功能 (Capabilities)

### 新增功能
- `database-connection`: 应用启动时可建立数据库连接，并在模块中可注入访问能力。
- `user-crud-module`: 提供用户资源的新增、查询、更新、删除接口与服务实现。

### 修改功能

## 影响

- 受影响代码：`src/modules/user`、数据库接入层（PrismaService/Module）与应用模块注册。
- 受影响 API：新增用户 CRUD 接口（REST 风格）。
- 受影响依赖：复用现有 Prisma 依赖，无需额外数据库 SDK。
- 受影响系统：本地与部署环境需正确配置 `DATABASE_URL`。
