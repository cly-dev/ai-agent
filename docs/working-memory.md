# 会话 GOA 记忆技术说明

实现位于 `src/core/memory/`。与多轮历史压缩的分工见 [`session-history-compression.md`](../src/core/memory/context/session-history-compression.md)。

### 目录结构

```text
src/core/memory/
├── memory.module.ts, index.ts
├── shared/          # memory.constants, memory-id.util, session-memory.constants
├── redis/           # Redis 连接与 key 约定
├── context/         # 会话对话 turns、历史压缩
├── goa/             # GOA 记忆（DB + 缓存、投影、replay、迁移）
├── resume/          # 任务续跑 gate 与 follow-up
└── user/            # 用户级 Redis 记忆
```

---

## 1. 架构（重构后）

### 存储分离

| 层 | 存储 | 内容 |
|----|------|------|
| **GOA 记忆** | PostgreSQL `SessionGoaMemory` + Redis `goa:session:{id}` 读缓存 | episodes、artifacts、activeTask、entities |
| **对话上下文** | Redis `context:session:{id}` | `turns[]`、历史压缩字段 |
| **审计** | `Message` / `AgentRun` | 完整对话与 run 步骤 |

**原则**：GOA 以 DB 为权威源，Redis 仅缓存；对话轮次与 GOA 不再共用一个 JSON blob。

### GOA 模型

```text
SessionGoaPayload
├── recentEpisodes[]     # 回合叙事 Goal-Outcome
├── sessionArtifacts[]   # 工具/gather 摘要
├── activeTask           # 活跃任务（见下）
└── entities             # 会话实体（如 xShopId）
```

### ActiveTask（替代 taskState + resumeTaskPlan + observationSnapshots）

```typescript
type ActiveTask = {
  taskId: string;
  status: 'in_progress' | 'awaiting_confirmation' | 'completed' | 'failed' | 'abandoned';
  plan: StoredTaskPlan;           // 与 TaskPlanSnapshot 互转，唯一 Plan 形态
  stepProgress: TaskStepProgress[];
  observationLog: ObservationEntry[];  // 跨 run 观测账本
  startedTurnId, lastTurnId, lastRunId: number;
  updatedAt: string;
};
```

- **写确认暂停**：`status = awaiting_confirmation`，`phase = task_only` 只更新 activeTask，不写 episode
- **记忆写入**：`newToolObservations` 仅含本 run 新增 obs（不含图预载）
- **续跑预载**：`flattenObservationLog(activeTask.observationLog)`

---

## 2. 写入流水线

```
Agent run 结束
  → buildMemoryUpdateContext()   # newToolObservations, storedTaskPlan
  → SessionGoaService.appendFromAgentRun()
  → SessionGoaStore.save()         # DB upsert + Redis cache
  → SessionHistoryCompressionService.maybeCompressAfterTurn()  # 仅 turns
```

---

## 3. 续跑

`SessionResumeGateService.evaluate()`（run 前，Plan 节点调用）：

1. `classifyIntentKind` — smalltalk 不续跑
2. `SessionTaskResumeFollowUpService` — LLM 判断是否换题
3. 返回 `resume` | `fresh` | `abandon_and_fresh`

Plan 节点只消费 gate 决策，不再内嵌 Redis 写入。

---

## 4. Prompt 注入

Compose 顺序（GOA 块）：

```text
<recent_episodes>
<artifact_summaries>
<active_task>          # 原 task_state
<session_entities>     # 来自 entities，非 workingMemory
```

Graph 内观测分两层（不进 compose prompt）：

- `preloadedToolObservations`：GOA `observationLog` 或写确认续跑上下文
- `toolObservations`：本 run 新增；记忆写入时作为 `newToolObservations`

---

## 5. 冷启动与迁移

### 只读 `get()` vs 入口 `warm()` / `ensurePayload()`

| API | 行为 |
|-----|------|
| `SessionGoaStore.get()` | DB 权威；校验 Redis `payload.updatedAt`，过期则刷新缓存 |
| `SessionGoaStore.warm()` / `SessionGoaService.ensurePayload()` | 无 DB 行时：legacy 迁移 → AgentRun replay → 写入 DB |

`PromptComposer` / `AgentLangGraphRunner` 入口调用 `ensurePayload()`；run 内写入与压缩用 `get()`。

### 冷启动链（仅 `warm`）

1. DB `SessionGoaMemory` 已有则返回
2. 旧 Redis context blob 迁移（`session-goa-migrate.util.ts`）+ 剥离旧字段
3. 从 `MessageTurn` + `AgentRun` replay（优先读 `AgentRun.goaSnapshot`，回退 `taskPlanTrace`）

### Run 结束时 Plan 快照

`AgentRun.goaSnapshot` 在 `finalizeRunAndTurn` 写入，含 `storedTaskPlan`、`activeTaskStatus`（含 `awaiting_confirmation`）、`intentKind`。

续跑策略：仅 `intentKind === 'task'` 时可 resume activeTask；`smalltalk` / `unclear` 不续跑。

---

## 6. 模块索引

| 文件 | 职责 |
|------|------|
| `session-goa.types.ts` | GOA / ActiveTask 类型 |
| `session-goa.store.ts` | DB 权威 + 缓存校验 + `warm()` 冷启动 |
| `session-goa-run-snapshot.util.ts` | `AgentRun.goaSnapshot` 构建 / 解析 |
| `session-goa-replay.service.ts` | 从 AgentRun 回放 episodes + activeTask |
| `session-goa-replay.util.ts` | 解析 `taskPlanTrace` / tool steps |
| `session-goa-legacy-cleanup.util.ts` | 迁移后剥离 Redis 旧 GOA 字段 |
| `session-goa.service.ts` | 写入、prompt 组装、abandon |
| `session-goa-projection.util.ts` | 从 AgentRun 投影 episode/artifact/task（artifact↔stepId 绑定） |
| `graph-tool-observations.util.ts` | preloaded / run-owned 观测合并 |
| `session-resume-gate.service.ts` | 续跑门控 |
| `session-context.types.ts` | 仅 turns + 压缩（Redis） |
| `session-task-resume-followup.service.ts` | LLM 追问门控 |

---

## 7. 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `SESSION_MEMORY_MAX_EPISODES` | 8 | 回合叙事条数 |
| `SESSION_MEMORY_MAX_ARTIFACTS` | 12 | 工件条数 |
| `MEMORY_SESSION_TTL_SECONDS` | 604800 | Redis TTL |

---

## 8. 部署

```bash
npx prisma migrate deploy   # SessionGoaMemory + AgentRun.goaSnapshot
```
