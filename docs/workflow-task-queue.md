# Workflow 任务队列 · 可执行实施方案

> 版本：2026-06  
> 状态：**待实现（与 Webhook MVP 同期，不提前单独立项）**  
> 上级方案：[event-workflow-webhook.md](./event-workflow-webhook.md)  
> 目标：Webhook / 自动化 Workflow 洪峰时 **削峰、限并发、可重试**。

---

## 0. 推荐决策（必读）

| 时机 | 建议 |
|------|------|
| **现在**（仅聊天、单实例、Webhook 未做） | **不要**单独上队列；继续用 `MessageService.agentRunChains` |
| **做 Webhook / 事件自动化 MVP 时** | **必须**异步 + 限流；与 [event-workflow-webhook.md](./event-workflow-webhook.md) **同一期 PR** 交付，不要事后补 |
| **多实例部署时** | 再把聊天迁到 `agent-run` 队列（本文 Phase 3） |

**第一期只实现 `workflow-run` 队列**（+ Session 锁 + Worker）。`agent-run` / `write-approval` 列为后续，避免现在为多实例预支工作量。

**BullMQ vs 自研最小 Worker：**

| 条件 | 选型 |
|------|------|
| 内测、单实例、每天几条事件 | Redis List + 进程内 worker + 全局 semaphore（约 50 行）即可 |
| 预期 3 个月内多实例，或每天上百条事件 | **直接 BullMQ**（本文下文方案），避免迁两次 |

无论哪种，Webhook **禁止**在 HTTP 线程内同步 `AgentEngine.run`。

```text
推荐落地顺序
────────────
① event-workflow-webhook：场景 / 审核人 / 待办列表（可先手动触发，不走 Webhook）
② 同一 PR 或紧随其后：Webhook 入站 + workflow-run 队列 + Worker
③ 量多或多实例时：agent-run 队列、write-approval 队列、观测 API
```

---

## 1. 现状与问题

| 路径 | 今天怎么做 | 问题 |
|------|------------|------|
| 聊天 `POST /messages` | `MessageService.scheduleAgentRun` 进程内 `Map<sessionId, Promise>` 串行 | 单实例够用；**多实例时**需队列（Phase 3） |
| Webhook Workflow（未实现） | 若同步 `AgentEngine.run` | 事件风暴会打满 LLM / HTTP Tool |
| 批量写确认续跑 | 同步 `resumeAfterWriteConfirm` | 批量大时可能撞 Session（Phase 3 可选队列） |

**第一期（Webhook MVP）队列要解决：**

1. **全局并发上限**（保护 LLM、DB、外部 API）
2. **按 Session 串行**（自动化 Session 与聊天 Session 互斥时靠 Redis 锁）
3. **失败重试 + 可观测**
4. **Webhook 快速 ACK**（入队即返回 202）

**后续（多实例 / 批量审核）再补：** 聊天迁 `agent-run` 队列、租户配额、`write-approval` 队列。

---

## 2. 技术选型

| 项 | 选择 | 理由 |
|----|------|------|
| 队列引擎 | **[BullMQ](https://docs.bullmq.io/)** | 基于 Redis；并发、限流、延迟、重试成熟 |
| Redis 连接 | 复用 `RedisConnectionService`（`ioredis`） | 项目已有；Worker 需 **duplicate 连接** |
| Nest 集成 | **直接用 `bullmq` API**（不用 `@nestjs/bullmq`） | 当前 Nest `^9`，避免 wrapper 版本冲突 |
| Session 互斥 | Redis `SET key NX EX` | 简单可靠，与 BullMQ 正交 |

**依赖（实现时执行）：**

```bash
npm install bullmq
```

---

## 3. 队列分层

### 3.1 第一期（Webhook MVP）— 只做这一条

```text
 Webhook / 手动触发 / B 端「试运行」
        │
        ▼
  workflow-run 队列  ──► Session Redis 锁 ──► AgentEngine.run
  concurrency = 3（默认）
```

| 队列名 | 第一期 | Job 类型 | 默认并发 |
|--------|--------|----------|----------|
| `workflow-run` | **实现** | `WorkflowRun` → `AgentEngine.run` | 3 |
| `agent-run` | 不做 | 聊天 pipeline | — |
| `write-approval` | 不做 | 批量审核 confirm | — |

### 3.2 后续扩展（多实例 / 批量审核时）

```text
workflow-run ──┐
agent-run ─────┼── Session Redis 锁（同 sessionId 串行）
write-approval ┘
```

| 队列名 | 默认并发 | 限流（默认） |
|--------|----------|--------------|
| `workflow-run` | 3 | 10 job/s |
| `agent-run` | 8 | 30 job/s |
| `write-approval` | 2 | 5 job/s |

---

## 4. Job 载荷（TypeScript）

```typescript
// src/core/queue/queue.types.ts

export const QUEUE_NAMES = {
  WORKFLOW_RUN: 'workflow-run',
  AGENT_RUN: 'agent-run',
  WRITE_APPROVAL: 'write-approval',
} as const;

export type WorkflowRunJobData = {
  workflowRunId: number;
  appClientId: number;
  eventScenarioId: number;
  sessionId: string;
  actorUserId: number;
  requestedSkillId?: number;
  input: string;
  pageContext?: Record<string, unknown> | null;
};

export type AgentRunJobData = {
  source: 'chat' | 'write_confirm';
  userId: number;
  sessionId: string;
  appClientId: number;
  input: string;
  userMessageId?: number;
  confirmWrite?: boolean;
  cancelWrite?: boolean;
  requestedSkillId?: number;
  pageContext?: Record<string, unknown> | null;
};

export type WriteApprovalJobData = {
  approvalId: number;
  action: 'confirm' | 'cancel';
  actedByUserId: number;
  sessionId: string;
  appClientId: number;
};
```

**Job ID（幂等）：**

| 队列 | `jobId` 规则 |
|------|----------------|
| `workflow-run` | `wf-run:{workflowRunId}` |
| `agent-run` | `agent-run:{sessionId}:{userMessageId\|confirm\|cancel}` |
| `write-approval` | `approval:{approvalId}:{action}` |

BullMQ 同 `jobId` 重复入队会被忽略（`deduplication`），防止 Webhook 重试双跑。

---

## 5. Session 分布式锁

```typescript
// src/core/queue/session-run-lock.service.ts

const LOCK_TTL_SEC = 600; // 与 AgentRun 最长耗时对齐，可 env 覆盖

export class SessionRunLockService {
  key(sessionId: string) {
    return `${REDIS_KEY_PREFIX}lock:session-run:${sessionId}`;
  }

  /** 获取锁；失败表示该 Session 已有 Run 在执行 */
  async tryAcquire(sessionId: string): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) return true; // 无 Redis 时降级为无锁（与 today memory 一致）
    const ok = await client.set(this.key(sessionId), '1', 'EX', LOCK_TTL_SEC, 'NX');
    return ok === 'OK';
  }

  async release(sessionId: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;
    await client.del(this.key(sessionId));
  }
}
```

**Processor 模板：**

```typescript
async process(job: Job<AgentRunJobData>) {
  const { sessionId } = job.data;
  const acquired = await this.sessionLock.tryAcquire(sessionId);
  if (!acquired) {
    // 同 Session 正在跑：延迟 2s 再试，不占失败次数
    await job.moveToDelayed(Date.now() + 2_000);
    return;
  }
  try {
    await this.agentRunLauncher.run(job.data);
  } finally {
    await this.sessionLock.release(sessionId);
  }
}
```

与现有 `MessageService.agentRunChains` **语义等价**，且多实例安全。

---

## 6. 目录与模块结构

```text
src/core/queue/
  queue.module.ts
  queue.constants.ts          # 默认并发、重试、env 读取
  queue.types.ts
  queue.service.ts              # enqueue 封装
  session-run-lock.service.ts
  redis-connection.duplicate.ts # ioredis duplicate for BullMQ
  workers/
    workflow-run.worker.ts
    agent-run.worker.ts         # Phase 2
    write-approval.worker.ts    # Phase 2
  processors/
    workflow-run.processor.ts   # 调 AgentEngine
    agent-run.processor.ts
    write-approval.processor.ts
```

```typescript
// src/core/queue/queue.module.ts
@Module({
  imports: [
    MemoryModule,
    forwardRef(() => AgentEngineModule),
    // WorkflowModule when exists
  ],
  providers: [
    QueueService,
    SessionRunLockService,
    WorkflowRunWorker,
    WorkflowRunProcessor,
    AgentRunLauncher, // 从 MessageService 抽出
  ],
  exports: [QueueService, SessionRunLockService],
})
export class QueueModule {}
```

`AppModule` 增加 `QueueModule`；`QUEUE_WORKERS_ENABLED=1` 时在当前进程启动 Worker（小团队可先同进程；规模大后拆 `npm run start:worker`）。

---

## 7. 入队点（谁调用 QueueService）

### 7.1 Webhook（Phase 1 核心）

```text
POST /webhooks/:dsn/:key
  → 验签、写 EventRecord、匹配 EventScenario
  → 创建 WorkflowRun(status=pending)
  → queueService.enqueueWorkflowRun({ workflowRunId, ... })
  → HTTP 202 { eventRecordId, workflowRunIds }
```

**禁止**在 HTTP 请求线程内调用 `AgentEngine.run`。

### 7.2 聊天（Phase 3 — 暂不做）

多实例部署前 **保持** `MessageService.scheduleAgentRun`，不迁队列。

待需要时再：

```typescript
// MessageService.create — 替换 scheduleAgentRun
this.queueService.enqueueAgentRun({ source: 'chat', ... });
```

保留 `scheduleAgentRun` 作降级路径。

### 7.3 批量写确认（Phase 3 — 可选）

批量经常 >10 条时再上队列；MVP 可在 API 内 **串行** `resumeAfterWriteConfirm`。

```http
POST /workflow-write-approvals/batch
```

HTTP 线程：校验权限 → 每条 `enqueueWriteApproval` → 返回 `202` + `jobIds`；前端轮询 approval 状态。

---

## 8. WorkflowRun Processor 逻辑

```typescript
async execute(data: WorkflowRunJobData): Promise<void> {
  await this.prisma.workflowRun.update({
    where: { id: data.workflowRunId },
    data: { status: 'running', startedAt: new Date() },
  });

  const acquired = await this.sessionLock.tryAcquire(data.sessionId);
  if (!acquired) {
    throw new Error('SESSION_BUSY'); // BullMQ 重试
  }

  try {
    await this.agentEngine.run({
      userId: data.actorUserId,
      sessionId: data.sessionId,
      input: data.input,
      requestedSkillId: data.requestedSkillId,
      pageContext: data.pageContext ?? null,
      triggerMeta: {
        source: 'workflow',
        workflowRunId: data.workflowRunId,
      },
    });
    // 若进入写确认门闩，AgentEngine 内更新 WorkflowRun → awaiting_write_approval
    // 否则 → success（在 engine 或此处根据 pending 判断）
  } catch (err) {
    await this.prisma.workflowRun.update({
      where: { id: data.workflowRunId },
      data: { status: 'failed', error: stringify(err), finishedAt: new Date() },
    });
    throw err;
  } finally {
    await this.sessionLock.release(data.sessionId);
  }
}
```

---

## 9. 并发与限流配置

### 9.1 环境变量（写入 `.env.example`）

```bash
# --- Task queue (BullMQ) ---
QUEUE_ENABLED=1
QUEUE_WORKERS_ENABLED=1

# workflow-run
WORKFLOW_QUEUE_CONCURRENCY=3
WORKFLOW_QUEUE_RATE_MAX=10
WORKFLOW_QUEUE_RATE_DURATION_MS=1000

# agent-run (Phase 3 — 多实例时再配)
# AGENT_QUEUE_CONCURRENCY=8
# AGENT_QUEUE_RATE_MAX=30

# write-approval (Phase 3 — 可选)
# WRITE_APPROVAL_QUEUE_CONCURRENCY=2

# 重试
QUEUE_DEFAULT_ATTEMPTS=3
QUEUE_BACKOFF_MS=5000

# Session 锁 TTL（秒）
SESSION_RUN_LOCK_TTL_SEC=600

# 可选：按 AppClient 覆盖（JSON）
# WORKFLOW_QUEUE_LIMITS_JSON={"2":{"concurrency":1,"rateMax":3}}
```

### 9.2 Worker 创建示例

```typescript
new Worker(QUEUE_NAMES.WORKFLOW_RUN, processor, {
  connection: duplicateRedisClient(redis),
  concurrency: readEnvInt('WORKFLOW_QUEUE_CONCURRENCY', 3),
  limiter: {
    max: readEnvInt('WORKFLOW_QUEUE_RATE_MAX', 10),
    duration: readEnvInt('WORKFLOW_QUEUE_RATE_DURATION_MS', 1000),
  },
  settings: {
    backoffStrategy: (attempts) => readEnvInt('QUEUE_BACKOFF_MS', 5000) * attempts,
  },
});
```

```typescript
// 入队默认选项
await queue.add('run', data, {
  jobId: `wf-run:${data.workflowRunId}`,
  attempts: readEnvInt('QUEUE_DEFAULT_ATTEMPTS', 3),
  removeOnComplete: 1000,
  removeOnFail: 5000,
});
```

### 9.3 按 AppClient 配额（Phase 3）

在 Processor 入口用 Redis 计数：

```text
agent:quota:workflow:{appClientId}:{minuteBucket}  INCR + EXPIRE 120
超过 scenario.workflowRateLimitPerMinute → moveToDelayed
```

`EventScenario` 可增加可选字段 `maxRunsPerMinute`（默认继承全局）。

---

## 10. 降级策略

| 条件 | 行为 |
|------|------|
| `REDIS_URL` 未配置 | `QueueService.enqueue*` 抛 `503 QUEUE_UNAVAILABLE`；Webhook 返回 503，**不**同步跑 Engine |
| `QUEUE_ENABLED=0` | Webhook / 手动 Workflow 拒绝入队；聊天仍走现有 `scheduleAgentRun`（不受影响） |
| Worker 未启动 | 队列堆积；监控 `waiting` 计数；告警 |

**原则：** 自动化 Workflow **宁可排队/失败，也不 bypass 队列同步执行**。

---

## 11. 观测与运维

### 11.1 日志

每条 Job 开始/结束打结构化日志：

```text
queue job start name=workflow-run jobId=wf-run:42 workflowRunId=42
queue job done  name=workflow-run durationMs=12500 status=success
queue job delayed name=agent-run reason=session_busy sessionId=abc retryInMs=2000
```

### 11.2 指标（建议）

| 指标 | 来源 |
|------|------|
| `queue_waiting{queue}` | `queue.getWaitingCount()` 定时上报 |
| `queue_active{queue}` | `getActiveCount()` |
| `queue_failed{queue}` | `getFailedCount()` |
| `workflow_run_duration_ms` | Processor histogram |

### 11.3 管理 API（可选 Phase 3）

```http
GET /admin/queue/stats
GET /admin/queue/failed?queue=workflow-run&page=1
POST /admin/queue/failed/:jobId/retry
```

---

## 12. 实施步骤（推荐 PR 拆分）

> **不要**单独开「只做队列」的 PR。与 Webhook MVP 合并交付，或紧接其后一个 PR。

### PR-A：事件自动化 MVP（含队列）— 推荐一期交付（约 4–6 天）

**业务（见 [event-workflow-webhook.md](./event-workflow-webhook.md)）：**

- [ ] Prisma：`EventScenario` / `EventRecord` / `WorkflowRun` / `WorkflowWriteApproval`
- [ ] B 端场景配置 + `approverUserIds`
- [ ] C 端写入待办列表 + 单条/批量 confirm/cancel（批量可先 API 内串行）
- [ ] `POST /admin/event-scenario/:id/run` 手动触发（先于 Webhook 联调）

**队列（本文）：**

- [ ] `npm install bullmq`（或自研最小 worker，见 §0）
- [ ] `src/core/queue/*`：`SessionRunLockService` + `workflow-run` only
- [ ] `WorkflowRunProcessor` → `AgentEngine.run`
- [ ] `POST /webhooks/:dsn/:key` → 入队 → HTTP 202
- [ ] env 与 `.env.example`；`queue:smoke` 脚本

### PR-B：观测与配额（可选，约 1 天）

- [ ] `/admin/queue/stats`、failed job 重试
- [ ] `EventScenario.maxRunsPerMinute`

### PR-C：多实例与聊天（等有部署需求时）

- [ ] `agent-run` 队列，替换 `scheduleAgentRun`
- [ ] `write-approval` 队列（批量审核量大时）

---

## 13. 验收标准

| # | 场景 | 预期 |
|---|------|------|
| 1 | 连续 100 个 Webhook | HTTP 均 202；`waiting` 上升；**同时 active ≤ WORKFLOW_QUEUE_CONCURRENCY** |
| 2 | 同 `sessionId` 2 个 Job | 串行完成，总耗时 ≈ 两次 Run 之和 |
| 3 | 重复 `X-Webhook-Id` | 只 1 个 `WorkflowRun` |
| 4 | Worker 宕机 5min 后恢复 | Job 重试成功或进入 failed，可 manual retry |
| 5 | Redis 不可用 | Webhook 503；聊天不受影响 |

---

## 14. 与上级方案的关系

| [event-workflow-webhook.md](./event-workflow-webhook.md) 章节 | 本方案 |
|-------------------------------------------------------------|--------|
| §5 Webhook 异步 202 | **PR-A 与 Webhook 同期** |
| §7 写入审核批量 confirm | MVP：API 串行；量大时 **PR-C** |
| §14 Phase 1 | **PR-A（业务 + workflow-run 队列一体）** |

---

## 15. 关键代码接入清单

| 文件 | 动作 |
|------|------|
| `src/core/memory/redis/redis-keys.ts` | 增加 `sessionRunLockKey(sessionId)` |
| `src/modules/message/message.service.ts` | **PR-C** 再改；MVP 不动 |
| `src/core/agent-engine/engine/agent-engine.service.ts` | `run()` 接受 `triggerMeta` |
| `src/app.module.ts` | `imports: [QueueModule]` |
| `package.json` | `start:worker` 可选脚本 |

---

## 16. 不推荐的做法

| 做法 | 原因 |
|------|------|
| 仅用内存 `Map` 限流 | 多实例无效 |
| Webhook 同步 `AgentEngine.run` | 超时、无背压 |
| 无 Session 锁仅靠高并发 Worker | 同 Session 并发写、GOA/plan 竞态 |
| 引入 Kafka 作为第一期 | 运维过重；Redis + BullMQ 足够 |
