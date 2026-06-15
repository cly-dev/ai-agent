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
| **GOA 记忆** | PostgreSQL `SessionGoaMemory` + Redis `goa:session:{id}` 读缓存 | episodes、artifacts、sessionObservationLedger、activeTask、entities |
| **对话上下文** | Redis `context:session:{id}` | `turns[]`、历史压缩字段 |
| **审计** | `Message` / `AgentRun` | 完整对话与 run 步骤 |

**原则**：GOA 以 DB 为权威源，Redis 仅缓存；对话轮次与 GOA 不再共用一个 JSON blob。

### GOA 模型

```text
SessionGoaPayload
├── recentEpisodes[]           # 回合叙事 Goal-Outcome
├── sessionArtifacts[]         # 工具/gather 摘要（prompt）
├── sessionObservationLedger[] # 跨 turn 完整 tool output（引擎预载）
├── activeTask                 # 活跃任务（见下）
└── entities                   # 会话实体（如 xShopId）
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
- **新 userMessage 在写确认等待期间**：`SessionResumeGate` 会 `abandon` 该 activeTask 并 **fresh plan**（不走 session resume）；续写仅通过写确认 API → worker run
- **记忆写入**：`newToolObservations` 仅含本 run 新增 obs（不含图预载）
- **会话 ledger**：每 run 结束 append 到 `sessionObservationLedger`（按 tool+args 去重，任务 completed 后仍保留）
- **图预载**：`mergePriorToolObservationsFromGoa` = ledger + 可续跑 `activeTask.observationLog`

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

1. **`awaiting_confirmation`** → 立即 `abandonActiveTask`，返回 `abandon_and_fresh`（写确认只能走 `confirmWrite` → worker run）
2. `classifyIntentKind` — smalltalk 不续跑
3. `SessionTaskResumeFollowUpService` — LLM 判断是否换题
4. 返回 `resume` | `fresh` | `abandon_and_fresh`

**可 chat resume 的状态**：仅 `activeTask.status === in_progress`（`isActiveTaskChatResumable`）。  
**不可 chat resume**：`awaiting_confirmation`（写确认暂停）、`completed`、`failed`、`abandoned`。

Plan 节点只消费 gate 决策，不再内嵌 Redis 写入。

---

## 4. Prompt 注入

Compose 顺序（GOA 块，与 Plan `sessionWorkingMemory` 同源、全量无 prompt 层抽样）：

```text
<session_goa_coverage>   # full_session_goa + SESSION_MEMORY_MAX_* 上限说明
<recent_episodes>        # 全部 stored episodes
<artifact_summaries>     # 全部 stored artifacts
<observation_inventory>  # ledger + 可续跑 observationLog 合并
<active_task>
<session_entities>
```

实现：`buildFullSessionGoaPromptMessages()`（PromptComposer）与 `buildPlanSessionWorkingMemory()`（Plan JSON）共用 `session-goa-full-projection.util.ts`。

Graph 内观测分两层（不进 compose prompt）：

- `preloadedToolObservations`：GOA `sessionObservationLedger` + 可续跑 `activeTask.observationLog`，或写确认续跑上下文
- `toolObservations`：本 run 新增；记忆写入时作为 `newToolObservations` 并 append 进 ledger

Plan 节点（fresh 路径，非 session resume）：

- `buildPlanSessionWorkingMemory()` 注入 **完整 GOA 快照**（与 Decision PromptComposer 一致，`coverage: full_session_goa`）
- 条数上限与 `SESSION_MEMORY_MAX_*` 一致，无 prompt 层二次截断
- Plan 额外含 `satisfiedToolRoles`（**仅本 run** `toolObservations` 判定）
- **pre_tools 跳步**（readiness / plan_sync）**始终**只看 `toolObservations`；分页续拉例外，见 [plan-node.md §观测满足](./plan-node.md#观测满足与跳步执行层plan-observation-scopeutilts)

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
| `session-goa-full-projection.util.ts` | 完整 GOA prompt 投影（Decision + Plan 共用） |
| `session-goa-ledger.util.ts` | 会话 observation ledger 写入 / 去重 / 图预载合并 |
| `graph-tool-observations.util.ts` | preloaded / run-owned 观测合并 |
| `session-resume-gate.service.ts` | 续跑门控（含 awaiting_confirmation → abandon） |
| `session-context.types.ts` | 仅 turns + 压缩（Redis） |
| `session-task-resume-followup.service.ts` | LLM 追问门控 |

---

## 7. 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `SESSION_MEMORY_MAX_EPISODES` | 8 | 回合叙事条数 |
| `SESSION_MEMORY_MAX_ARTIFACTS` | 12 | 工件条数 |
| `SESSION_MEMORY_MAX_OBSERVATION_LEDGER` | 200 | 会话 observation 账本条数 |
| `MEMORY_SESSION_TTL_SECONDS` | 604800 | Redis TTL |

---

## 8. 部署

```bash
npx prisma migrate deploy   # SessionGoaMemory + AgentRun.goaSnapshot
```
