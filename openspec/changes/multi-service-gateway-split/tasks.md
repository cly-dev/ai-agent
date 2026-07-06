## 1. 协议与共享包

- [ ] 1.1 扩展 `packages/protocol`：Redis channel、BullMQ queue 名、健康检查 path、Gateway upstream 常量
- [ ] 1.2 完善 `packages/workflow-core`：从 `src/core/workflow` 抽取无 Nest 依赖的类型与纯函数
- [ ] 1.3 完善 `packages/runtime-cache-protocol`：catalog revision 事件类型
- [ ] 1.4 设计 `@omnix/prisma-client` 发布流程（api 仓 generate → 私有 npm）

## 2. Monorepo 物理目录（Phase 1，单 repo）

- [ ] 2.1 接线 `src/deployments/worker-app.module.ts`：worker 入口改用 `WorkerAppModule` 替代全量 `AppModule`
- [ ] 2.2 创建 `RuntimeAppModule`：仅 C 端 modules + session-run 入队 + SSE subscribe
- [ ] 2.3 创建 `ApiAppModule`：仅 B 端 modules + RuntimeCache 写/失效
- [ ] 2.4 创建 `PageAppModule`：page-action + page-agent
- [ ] 2.5 将 `src/core/agent-engine` 迁入 `apps/worker/src/core/`（或 symlink + tsconfig paths 过渡）
- [ ] 2.6 将 page modules 迁入 `apps/page/src/`
- [ ] 2.7 将 B 端 modules 迁入 `apps/api/src/`
- [ ] 2.8 将 C 端 modules 迁入 `apps/runtime/src/`
- [ ] 2.9 各 app 独立 `nest-cli.json` + `tsconfig`；`pnpm build:all` 产出各 app `dist/`
- [ ] 2.10 根 `src/` 保留 thin re-export，兼容旧 `dist/src/*.js` 路径一个版本

## 3. Worker 跨进程 SSE（Phase 1 关键）

- [ ] 3.1 实现 `RedisRunEventPublisher`：worker 侧 `RunEventPublisher` 只 publish 到 `CHAT_SSE_RELAY_CHANNEL`
- [ ] 3.2 确认 runtime `ChatEventsService` subscribe 能收到 worker 全部 event 类型（think/message/complete/host_action）
- [ ] 3.3 扩展 `scripts/test-session-run-split.sh`：断言跨进程 SSE relay 端到端

## 4. 独立镜像（Phase 2，同 repo）

- [ ] 4.1 编写 `apps/api/Dockerfile`、`apps/runtime/Dockerfile`、`apps/worker/Dockerfile`、`apps/page/Dockerfile`
- [ ] 4.2 更新 Jenkins `.dockerfile` / Kaniko 为多镜像 build matrix
- [ ] 4.3 编写 K8s Deployment + Service 模板（4 服务 + 内网 DNS）
- [ ] 4.4 Worker Service 设为 `ClusterIP` 且无 Gateway 路由

## 5. Gateway（Phase 2）

- [ ] 5.1 创建 `omnix-gateway` 仓库（或 `deploy/gateway/` 目录）：nginx.conf / helm chart
- [ ] 5.2 实现 design.md 路由表（含 SSE proxy 参数）
- [ ] 5.3 添加 Gateway 集成测试：path 转发 smoke（admin/chat/page-agent）
- [ ] 5.4 文档化 TLS、CORS、透传头规范

## 6. Git 拆分（Phase 3–6）

- [ ] 6.1 拆分 `omnix-worker` 独立仓库；CI 独立 pipeline
- [ ] 6.2 拆分 `omnix-page` 独立仓库
- [ ] 6.3 拆分 `omnix-api` 独立仓库（含 prisma schema）
- [ ] 6.4 拆分 `omnix-runtime` 独立仓库
- [ ] 6.5 拆分 `omnix-protocol` 小包仓库（或 GitHub Packages monorepo）
- [ ] 6.6 各仓 README：env 变量清单、依赖服务、本地联调 docker-compose

## 7. 切流量与下线（Phase 7）

- [ ] 7.1 docker-compose / staging 环境部署 4 服务 + Gateway 全链路
- [ ] 7.2 灰度：Gateway 10% 流量到新服务，监控 5xx / SSE 断开 / BullMQ lag
- [ ] 7.3 100% 切流量；保留单体镜像一个版本作回滚
- [ ] 7.4 下线根 `src/main.ts` 单体入口与 legacy PM2 配置
- [ ] 7.5 更新 `MONOREPO.md` 与运维 runbook

## 8. 待定项决策

- [ ] 8.1 确认 Gateway 产品（Nginx / ALB / Kong）
- [ ] 8.2 确认 `/docs` Swagger 归属（建议 api）
- [ ] 8.3 确认 `session`/`message` 长期归属（runtime vs api）
- [ ] 8.4 确认 page 读 LlmModelConfig 方式（直连 DB vs api internal API）
