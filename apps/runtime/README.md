# Runtime API 进程入口（Chat / Session / SSE；BullMQ 只入队）

See [MONOREPO.md](../../MONOREPO.md).

```bash
pnpm run dev          # 从 apps/runtime 委托到根目录 start:runtime:dev
pnpm run start:prod   # node ../../dist/src/runtime-main.js
```

HTTP: `http://localhost:3030`（与 legacy 单体相同路由）
