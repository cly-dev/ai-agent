omnix/
├── package.json                 # workspace root
├── pnpm-workspace.yaml
├── src/
│   ├── main.ts                  # legacy 单体（本地 dev 默认 HTTP+Worker 同进程）
│   ├── runtime-main.ts          # Runtime API：HTTP on，Worker off
│   └── worker-main.ts           # Worker：HTTP off，BullMQ consumer on
├── apps/
│   ├── agent-server/            # legacy 别名
│   ├── api/                     # :3020  未来 B 端配置（脚手架）
│   ├── runtime/                 # :3030  → runtime-main.ts
│   ├── worker/                  # :3031  → worker-main.ts（/health）
│   └── page/                    # :3040  未来 PageAction（脚手架）
└── packages/ …

## 阶段 2（已完成）：Runtime + Worker 拆分

| 进程 | 入口 | 端口 | 环境变量默认 |
|------|------|------|--------------|
| Legacy 单体 | `src/main.ts` | 3030 | Worker=on, HTTP=on |
| Runtime API | `src/runtime-main.ts` | 3030 | Worker=**off**, HTTP=on |
| Worker | `src/worker-main.ts` | 3031 `/health` | Worker=**on**, HTTP=off |

业务代码仍在 `src/`，**未复制**；只是拆成两个可独立部署的进程入口。

### 本地开发

```bash
pnpm install
pnpm run build

# 方式 A：单体（和以前一样）
pnpm run start:dev

# 方式 B：双进程（推荐联调生产形态）
pnpm run start:runtime:dev    # 终端 1
pnpm run start:worker:dev     # 终端 2

# 或通过 apps 别名
pnpm run dev:runtime
pnpm run dev:worker

# 自动化验证双进程
pnpm run test:session-run-split
```

### 生产部署（PM2）

```bash
pnpm run build:prod
pnpm run start:server:prod    # ecosystem.config.cjs
# agent-server      → runtime-main.js
# agent-server-worker → worker-main.js
```

### 部署组合

```text
阶段 1   1 进程：pnpm run start:dev（legacy）
阶段 2   2 进程：runtime + worker  ← 当前
阶段 3   3 进程：api + runtime + worker
阶段 4   4 进程：+ page
```

## 后续迁移

完整多服务 + Gateway 方案见：

**`openspec/changes/multi-service-gateway-split/`**

- `proposal.md` — 为什么拆、影响范围
- `design.md` — 路由表、模块归属、迁移阶段、风险
- `specs/` — 各服务边界规范
- `tasks.md` — 可执行任务清单

概要步骤：

1. 抽 `packages/workflow-core` ← `src/core/workflow`
2. 接线 `WorkerAppModule` / `RuntimeAppModule` / `ApiAppModule` / `PageAppModule`
3. Worker → Page → Api → Runtime 顺序 Git 拆分
4. Gateway 切流量（对外 URL path 不变）
