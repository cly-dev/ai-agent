# Worker 独立进程入口（BullMQ consumer + AgentEngine）
# 业务模块仍在 ../../src/，迁移期共享 legacy 代码库。

See [MONOREPO.md](../../MONOREPO.md).

```bash
pnpm run dev          # 从 apps/worker 委托到根目录 start:worker:dev
pnpm run start:prod   # node ../../dist/src/worker-main.js
```

Health: `http://localhost:3031/health`（轻量 HTTP，非完整 Nest admin 路由）
