# Prisma 数据库操作文档

本文档用于本项目中使用 Prisma + PostgreSQL 进行数据库开发与日常运维。

## 1. 前置准备

### 1.1 安装依赖

```bash
pnpm install
```

项目已包含以下依赖：

- `prisma`
- `@prisma/client`

### 1.2 配置环境变量

在项目根目录 `.env` 中配置：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ai_agent?schema=public"
```

本项目通过 `prisma.config.ts` 读取 `DATABASE_URL`：

```ts
datasource: {
  url: process.env["DATABASE_URL"],
}
```

## 2. Schema 位置与说明

- Schema 文件：`prisma/schema.prisma`
- 迁移目录：`prisma/migrations`

当前核心模型包括：

- 用户与会话：`User`、`Session`、`Message`
- Agent 相关：`Agent`、`Skill`、`Tool`
- 多对多中间表：`SkillTool`、`AgentSkill`

## 3. 常用命令

### 3.1 校验 schema

```bash
npx prisma validate
```

用于检查模型字段、关系、索引是否正确。

### 3.2 格式化 schema

```bash
npx prisma format
```

用于规范 `schema.prisma` 的格式。

### 3.3 生成 Prisma Client

```bash
npx prisma generate
```

每次修改 `schema.prisma` 后建议执行一次。  
本项目 generator 输出目录为：`generated/prisma`。

### 3.4 创建并执行迁移（开发环境）

```bash
npx prisma migrate dev --name init
```

说明：

- 会根据 schema 变化生成 SQL 迁移文件
- 自动应用到本地数据库
- 自动触发 `generate`

### 3.5 仅将迁移应用到数据库（测试/生产常用）

```bash
npx prisma migrate deploy
```

用于执行已存在的迁移文件，不会创建新迁移。

### 3.6 打开可视化工具

```bash
npx prisma studio
```

可在线查看和编辑数据库数据。

## 4. 常见开发流程（推荐）

1. 修改 `prisma/schema.prisma`
2. 执行 `npx prisma validate`
3. 执行 `npx prisma migrate dev --name <变更名>`
4. 确认 `prisma/migrations` 生成的 SQL
5. 在业务代码中使用 Prisma Client

## 5. 在 NestJS 中使用 Prisma Client（示例）

可以封装一个 `PrismaService` 统一注入：

```ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

业务中注入后即可 CRUD：

```ts
const user = await this.prisma.user.create({
  data: { username: 'alice' },
});
```

## 6. 常见错误排查

### 6.1 P1012 relation 缺少 opposite field

现象：`The relation field ... is missing an opposite relation field`  
原因：关系只在一侧声明，另一侧模型未补反向字段。  
处理：在关联模型中补充 `xxx[]` 或单对象 relation 字段。

例如：

- `SkillTool.skill` <-> `Skill.skillTools`
- `SkillTool.tool` <-> `Tool.skillTools`
- `AgentSkill.agent` <-> `Agent.agentSkills`
- `AgentSkill.skill` <-> `Skill.agentSkills`

### 6.2 连接数据库失败

优先检查：

- `DATABASE_URL` 是否正确
- PostgreSQL 服务是否启动
- 数据库名/用户名/密码是否匹配

### 6.3 模型改了但代码类型未更新

执行：

```bash
npx prisma generate
```

必要时重启 TypeScript Server / IDE。

## 7. 生产环境建议

- 使用 `npx prisma migrate deploy`，不要在生产环境跑 `migrate dev`
- 将迁移 SQL 纳入代码审查
- 敏感配置仅放在环境变量，不要提交真实密码

## 8. Schema 代码生成（类型/实体/模块）

本项目提供了基于 `prisma/schema.prisma` 的代码生成器，输出目录为 `src/generated`。

### 8.1 全量生成

```bash
pnpm codegen:prisma
```

默认会生成：

- `src/generated/types/*.type.ts`
- `src/generated/entities/*.entity.ts`
- `src/generated/modules/*/*.module.ts`
- 可选项（当前默认开启）：`*.service.ts`、`*.controller.ts`

### 8.2 预览（不落盘）

```bash
pnpm codegen:prisma:dry-run
```

用于查看拟创建/更新文件清单，不会写入任何文件。

### 8.3 按模型增量生成

```bash
pnpm ts-node src/codegen/prisma-schema-codegen.ts --models User,Session --with-service --with-controller
```

### 8.4 覆盖策略

- 默认不会覆盖“手写文件”（不包含生成头注释的文件）
- 若必须覆盖可显式传入 `--overwrite`

### 8.5 推荐流程

1. 修改 `prisma/schema.prisma`
2. 执行 `npx prisma validate`
3. 执行 `pnpm codegen:prisma:dry-run` 检查差异
4. 执行 `pnpm codegen:prisma` 生成文件
5. 提交 schema 与 generated 产物

## 9. User CRUD 接口

数据库连接通过 `PrismaModule` 全局注入，`main.ts` 在启动阶段会主动校验连接。

`src/modules/user` 当前提供以下接口：

- `POST /user` 创建用户
- `GET /user` 查询用户列表
- `GET /user/:id` 查询单个用户
- `PATCH /user/:id` 更新用户（当前支持 `username`）
- `DELETE /user/:id` 删除用户

请求示例：

```bash
curl -X POST http://localhost:3000/user \
  -H "Content-Type: application/json" \
  -d '{"username":"alice"}'
```
