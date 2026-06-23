# Plan 规则与状态参考

Plan 是 **每 turn 一次** 的任务规划层：拆 `deliverable`、有序 `steps`、写入 `currentObjective`；**不调 HTTP 工具**。执行由 ReAct（`llm` → `tools` → `resultCheck`）按步推进。

图路由与模块总览见 [plan-node.md](./plan-node.md)。分页 Gather 见 [paged-list-gather.md](./paged-list-gather.md)。

**类型定义**：`src/core/agent-engine/engine/main/task-plan.types.ts`  
**生成与推进**：`task-plan.util.ts`、`task-plan-llm.util.ts`  
**Graph**：`agent-graph/`（`plan.node.ts` + `result-check.node.ts` advance）

---

## 1. 核心概念

| 概念 | 含义 |
|------|------|
| **Plan 快照** | `TaskPlanSnapshot`，存在 `AgentGraphState.taskPlan`，可序列化进 GOA / 写确认续跑 |
| **Deliverable** | 任务交付类型，决定内置模板与 gather 完成条件 |
| **Step** | 有序子任务；`kind` 决定走 ReAct 还是短路 summarize |
| **taskPhase** | 当前 pending 步的 `phase` 镜像，**不是**「是否已调工具」 |
| **currentObjective** | ReAct 每轮 user 帧主指令（有 Plan 时用 `<current_objective>`） |
| **Advance** | `resultCheck` 内规则推进 `pendingStepIds`，不调 LLM |

```text
Plan（一次）→ currentObjective + pendingStepIds
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   kind=tool                 kind=summarize
   llm → tools              resultCheck 短路 → summarize
        → resultCheck advance
```

---

## 2. 枚举与字段

### 2.1 `TaskDeliverable`

| 值 | 典型用户意图 | 规则模板概要 |
|----|--------------|--------------|
| `list` | 获取/展示/导出 N 条记录 | gather read-list → answer summarize |
| `analysis` | 分析、统计、报告、洞察 | gather read-list → analyze summarize |
| `detail` | 单实体详情 | read-detail（必要时先 list）→ answer |
| `mutation` | 创建/更新/提交/写操作 | read → compose_write → present → write → confirm |
| `answer` | 无工具、闲聊、意图不清 | 单步 summarize（或 gather+summarize） |

**Skill 未命中**且走规则兜底时：`仅有 read-list` → 默认 `list`；**Skill 命中** → 默认 `analysis`（见 `inferDeliverableFromTools`）。

### 2.2 `TaskStepPhase`（步骤阶段）

| 值 | 含义 |
|----|------|
| `gather` | 拉取数据（多为 read-list / read-detail） |
| `analyze` | 基于观测做分析/解读（多为 `kind=summarize`） |
| `answer` | 面向用户的最终作答步 |
| `mutate` | 写操作步 |

`taskPhase` 字段 = 当前 pending 第一步的 `phase`（初始化与每次 `applyPlanAdvance` 后更新）。

### 2.3 `TaskStepKind`（步骤执行方式）

| 值 | 行为 |
|----|------|
| `tool` | 走 ReAct：`llm` 选工具 → `tools` 执行 → `resultCheck` 判定完成并 advance |
| `summarize` | **不 bind 工具**；`resultCheck` 满足条件后 **短路 `summarize` 节点** |
| `reason` | 预留；与 `summarize` 同样不 bind 工具、可短路 summarize |

### 2.4 `TaskStepStopWhen`（tool 步完成条件）

| 值 | 判定逻辑（`observationsSatisfyPlanToolStepStopWhen`） |
|----|------------------------------------------------------|
| `observation_non_empty` | 默认。存在可汇总的 observation（**空列表也算有数据**）。**pre_tools 跳步** 仅在本 run `toolObservations` 内判定；分页续拉另用 `selectObservationsForPagedGatherResume`（见 [plan-node.md](./plan-node.md)） |
| `observation_has_fields` | 存在非空、可汇总字段的 observation |
| `observation_fetch_complete` | analyze 路径 gather 专用：无 `resumable` mapReduce；且无需 `observationNeedsPagedFetch`；或 mapReduce 已 `complete`/`partial` |
| `always` | 立即视为完成 |

规则模板对 `deliverable=analysis` 的 read-list gather 步会 **强制** `observation_fetch_complete`（`normalizePlanStepsForDeliverable`）。

### 2.5 `TaskPlanSource` / plan step `method`

| `source` | 产生方式 |
|----------|----------|
| `workflow` | `Skill.config.workflow.steps` 校验通过 |
| `llm` | `agent.plan` LLM 结构化输出 |
| `template` | `buildTemplateSteps()` 规则模板 |
| `minimal` | 无合适工具模板时的单步 answer |

Plan 节点 step 输出里的 `method` 与 `resolveTaskPlan()` 返回值一致（含 `llmFallbackReason`）。

---

## 3. `TaskPlanSnapshot` 状态字段

```typescript
type TaskPlanSnapshot = {
  source: TaskPlanSource;
  originalUserRequest: string;  // 用户原话
  goal: string;                 // 任务目标摘要
  deliverable: TaskDeliverable;
  constraints: string[];        // 预留，多为 []
  steps: TaskPlanStep[];        // 有序步骤定义（全集）
  pendingStepIds: string[];     // 待执行队列（头部为当前步）
  completedStepIds: string[];   // 已完成 id
  taskPhase: TaskStepPhase;     // = pending 首步的 phase
  currentObjective: string;     // = pending 首步的 objective（无步时为 goal）
  currentStepId: string | null; // = pending 首步 id
};
```

### 3.1 字段关系（不变式）

1. `pendingStepIds[0]` 为 **当前活跃步**（与 `currentStepId` 一致，advance 后同步）。
2. `steps` 为计划全集；`pending` + `completed` 划分进度，**不从 `steps` 删元素**。
3. `taskPhase` / `currentObjective` 随 `applyPlanAdvance` 与 pending 首步对齐。
4. 每 **turn** 仅 plan 节点写一次；同 turn 内 ReAct 只 **advance**，不重新 Plan。

### 3.2 Plan 节点 step 输出（可观测 JSON）

除完整快照外，plan run step 常记录摘要字段：

```json
{
  "goal": "获取10条亚马逊评论",
  "method": "llm",
  "source": "llm",
  "deliverable": "list",
  "taskPhase": "gather",
  "stepIds": ["step_1", "step_2"],
  "pendingStepIds": ["step_1", "step_2"],
  "completedStepIds": [],
  "currentStepId": "step_1",
  "currentObjective": "使用read-list工具获取10条亚马逊评论",
  "llmFallbackReason": null
}
```

| 字段 | 说明 |
|------|------|
| `taskPhase: gather` | 表示 **计划当前处于 gather 步**，不是「引擎正在分页拉数」 |
| `method` / `source` | Plan 解析路径 |
| `llmFallbackReason` | LLM 未采用时的原因码（见 §4） |

---

## 4. Plan 生成规则

### 4.0 外层 vs 内层

| 入口 | 函数 | 场景 |
|------|------|------|
| Plan 节点（主 turn） | `resolveOuterPlan()` | 无 skill 帧或外层编排 `kind=skill` |
| Skill 帧展开 | `resolveTaskPlan()` | 内层 tool/summarize 步 |

内层优先级（`resolveTaskPlan`）：

```text
① skill.config.workflow（显式 steps，校验 toolRole ⊆ scoped；mutation 须 isCompliantMutationPlan）
        ↓ 无效 / mutation 不合规
② shouldUseDeterministicMutationPlan → buildMutationSteps 模板
        ↓ 不适用
③ Plan LLM（agent.plan；PLAN_LLM=0 跳过）
        ↓ 步序不合规 mutation → 强制模板（mutation_template_forced）
④ buildTaskPlan 规则 template / minimal
```

外层（`resolveOuterPlan`）：默认 Plan LLM；**mutation 步序不合规**或含 write 步但无合规 compose/present/write 序 → `buildDeterministicMutationPlanResult`；LLM 失败 → `buildTaskPlan`（非 minimal-only）。

`llmFallbackReason`：`mutation_template_forced` \| `outer_plan_llm_failed` \| `outer_plan_llm_disabled` \| `llm_plan_failed` \| `llm_plan_disabled`

### 4.1 路径 ① workflow

- 配置：`Skill.config.deliverable` + `config.workflow.steps[]`
- `validatePlanStepsAgainstScoped()` 失败 → **降级**，不静默使用坏步骤
- `deliverable=mutation` 时 workflow 须通过 `isCompliantMutationPlan()`，否则降级路径 ②

### 4.2 路径 ② 确定性 mutation

- `shouldUseDeterministicMutationPlan()`：scoped 含 write，且非 `deliverable=answer`；Skill 场景另需 `deliverable=mutation` 或 L2/L3 + read
- `buildMutationSteps()` 产出五步：`read_detail|list` → `compose_write` → `present` → `write` → `confirm`
- **跳过 Plan LLM**（内层路径 ②）或 **替换 LLM 步序**（外层 / 内层路径 ③ 不合规时）

### 4.3 路径 ③ Plan LLM

- Prompt：`agent.plan`（`prompt-defaults.ts` / DB）
- 校验：`kind=tool` 的 `toolRole` 必须在 scoped roles 内
- mutation：LLM 可产出 `deliverable` + `goal`，但 **步序由 runtime 替换**（若不合规）
- 失败 → 路径 ④；`llmFallbackReason: llm_plan_failed` \| `llm_plan_disabled`

### 4.4 路径 ④ 规则 template

`inferDeliverableFromTools()` + `buildTemplateSteps()`：

| deliverable | 典型 steps |
|-------------|------------|
| `analysis` | fetch(gather, read-list, fetch_complete) → analyze(summarize) |
| `list` | fetch(gather, read-list, non_empty) → answer(summarize) |
| `detail` | list/detail gather → answer |
| `mutation` | read_detail/list → compose_write → present → write → confirm |

`skillApplied=false` 且仅 read-list → **`list`**（「获取 10 条」应落此路径）。

### 4.5 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `PLAN_LLM` | 开启 | `0` 关闭 LLM，仅规则 template |
| `PLAN_SKILL_PROMPT_EXCERPT_CHARS` | `1200` | 传给 Plan LLM 的 skill.prompt 截断 |

---

## 5. 运行时状态机（Advance）

统一入口：`resolveTaskPlanAdvance()`（`resultCheck` 内）。

### 5.1 两阶段

| 阶段 | 时机 | 作用 |
|------|------|------|
| `pre_tools` | `llm` 未发出 tool_calls 或 dedupe 后 | 若 observation **已满足** 当前 tool 步 → advance（避免重复 fetch） |
| `post_tools` | `tools` 执行完毕 | 若 **本轮** round observations 满足完成条件 → advance |

### 5.2 tool 步完成（`post_tools`）

须同时满足：

1. 当前 pending 步 `kind === 'tool'`
2. 本轮 `toolCalls` 与 pending 步 `toolRole` 匹配
3. `isToolStepComplete()`（看 **本轮** `roundObservationIndices`，非历史全集）
4. 本轮 **非全 EMPTY 终态**（全 EMPTY → 不 advance，清空 plan，走 empty summarize）

### 5.3 `applyPlanAdvance` 转移

完成步 `id` 从 `pendingStepIds` 移除，加入 `completedStepIds`，指针移到下一步：

| 下一步 | `resultCheck` 路由 | `reason` |
|--------|-------------------|----------|
| `kind: summarize` \| `reason` | **summarize** | `plan_advance_summarize` |
| `kind: tool` | **llm** | `plan_advance_tool_step` |
| 无 pending | **summarize** | `plan_complete` |

Plan 步序在生成时确定（workflow / 模板 / Plan LLM）；advance **仅线性推进**，不在 ReAct 环内为 pending write 重排队列。写操作安全由 tools 写确认闸门与 `plan_write_step_*` 规则保障。

### 5.4 首步即为 summarize

`resolveTaskPlanInitialAdvance()`：pending 首步为 `summarize`/`reason` → 直接设 `pendingRespond`，**跳过** readiness / tool 环（`plan_initial_summarize`）。

### 5.5 summarize 完成后

`finalizePlanAfterSummarize()`：将当前 summarize 步标为完成；若仍有 pending **tool** 步 → `shouldContinuePlanAfterSummarize` 为 true，回 **llm** 续跑。

### 5.6 Plan 与 LLM 脱困

`countConsecutiveLlmRoundsWithoutToolCalls()`：plan tool 步连续多轮无 tool_calls → 强制 summarize，避免 `llm ⇄ resultCheck` 死循环。

---

## 6. ReAct 与 Plan 的衔接

### 6.1 User 帧（`buildDecisionUserFrame`）

| 条件 | 注入内容 |
|------|----------|
| 有 `taskPlan` | `<user_intent>`（原话/goal/deliverable）+ `<current_objective>` |
| 无 Plan | `<current_user_request>` |

有 Plan 时 **不再** 每轮重复完整用户原话为主指令。

### 6.2 工具收窄（`filterScopedToolsForPlanStep`）

- pending 为 `kind=tool` 且带 `toolRole` → scoped 工具 **收窄到该 role**
- pending 为 `summarize`/`reason` → **空工具列表**（`isPendingPlanAnswerStep`）

### 6.3 Summarize 上下文（`formatPlanContextForSummarize`）

注入 `<plan_context>`：goal、deliverable、original request、current step objective。

---

## 7. `taskPhase: gather` 与「拉数」

需区分 **三层**：

| 层级 | 含义 | `deliverable=list` 示例 |
|------|------|-------------------------|
| **Plan 标签** | `taskPhase=gather` = 当前步 phase | step_1 为 gather，**计划**要先取数 |
| **单次工具调用** | `llm` → `tools` 调 read-list | 用户可见的「查了一次列表」 |
| **分页 Gather** | `expandPagedListGather` / `__mapReduce` | **不触发**（无 pending `analyze` 步） |

分页 Gather 门槛（`shouldExpandPlanPagedGather`）：

1. `planHasPendingAnalyzeStep` — pending 队列中仍有 `phase=analyze`
2. 当前为 gather + read-list tool 步
3. `observationNeedsPagedFetch` — 列表 meta 显示还需翻页

因此：

- **「获取 10 条」+ `deliverable=list`**：Plan 显示 `gather` 正常；**不会**自动多页 mapReduce。
- **分析类 + `deliverable=analysis`**：gather 步 `stopWhen=fetch_complete`，可能触发分页 Gather 后再 advance 到 analyze。

---

## 8. 典型路径示例

### 8.1 List（获取 N 条评论）

```text
Plan: deliverable=list
  step_1: gather / tool / read-list  (stopWhen: observation_non_empty)
  step_2: answer / summarize

taskPhase=gather → llm → tools(read-list) → resultCheck advance
  → taskPhase=answer → summarize → END
```

### 8.2 Analysis（评论分析）

```text
Plan: deliverable=analysis
  step_1: gather / tool / read-list  (stopWhen: observation_fetch_complete)
  step_2: analyze / summarize

gather 后若 hasMore → 分页 Gather（引擎）→ 满足 fetch_complete → advance
  → analyze summarize → END
```

### 8.3 Mutation（读→写→答）

```text
  read_detail or list → write(mutate) → summarize(confirm)
```

写确认暂停时 plan 可写入 GOA；续跑从 `PendingWriteResumeContext.taskPlan` 恢复。

---

## 9. 持久化与续跑

| 存储 | 内容 |
|------|------|
| `AgentGraphState.taskPlan` | 当前 run 内活跃快照 |
| `AgentRun.goaSnapshot.storedTaskPlan` | run 结束时的 Plan 快照 |
| GOA `ActiveTask.plan` | `StoredTaskPlan`（与 `TaskPlanSnapshot` 互转） |

### 9.1 Session 续跑 gate

`SessionResumeGateService.evaluate()`（plan 节点内）：

| 条件 | 决策 |
|------|------|
| `activeTask.status === awaiting_confirmation` | `abandon_and_fresh`（新消息不走 session resume；须写确认 API 或 abandon） |
| `intentKind !== task` | `fresh` |
| follow-up LLM 判定换题 | `abandon_and_fresh` |
| 否则 | `resume`（从 GOA `activeTask.plan` 恢复，跳过 `resolveTaskPlan`） |

仅 `status === in_progress` 的任务可被 **chat message** session resume（`isActiveTaskChatResumable`）。

### 9.2 观测选桶（与续跑正交）

| 场景 | 观测来源 | 能否 pre_tools 跳 gather |
|------|----------|---------------------------|
| fresh turn + GOA 有历史 read-detail | `preloaded` 可见于 LLM；**跳步只看 `runOwned`** | 否，须本 run 调 tool |
| session resume（`planRunContext=resume`） | 同上 + 首步 summarize 可放行 | gather 仍须 `runOwned`；summarize 步可凭 GOA |
| 分页 gather 续拉 | `preloaded + runOwned` | 见 `selectObservationsForPagedGatherResume` |

详见 [plan-node.md §观测满足](./plan-node.md#观测满足与跳步执行层plan-observation-scopeutilts)。

转换：`toStoredTaskPlan` / `fromStoredTaskPlan`（`session-graph-resume.util.ts`）。

---

## 10. 实现索引

| 模块 | 文件 |
|------|------|
| 类型 | `task-plan.types.ts` |
| 生成 / advance / stopWhen | `task-plan.util.ts` |
| LLM Plan | `task-plan-llm.util.ts` |
| 分页 Gather 门控 | `gather/plan-paged-gather.util.ts` |
| Plan 节点 | `agent-graph/nodes/plan.node.ts` |
| Plan prompt | `prompt-defaults.ts` → `agent.plan` |
| GOA 互转 | `session-graph-resume.util.ts` |

---

## 11. 排错速查

| 现象 | 可能原因 |
|------|----------|
| Plan 是 `gather` 但没调工具 | 正常：Plan 只写计划；需等 `llm` 发 tool_calls |
| `list` 却走了分页拉数 | 检查是否误为 `analysis` 或 step_2 是否为 `analyze` |
| LLM 重复 read-list | advance 未触发：stopWhen 未满足 / 全 EMPTY / toolRole 不匹配 |
| 「获取 N 条」变成 analysis | Plan LLM 误判；规则兜底在 `skillApplied=false` 时应为 `list` |
| fresh turn 有 GOA 观测却未调 read 工具 | 正常：pre_tools 只看 `runOwned`；检查 `planRunContext` 与 readiness 是否 `observation_satisfied` |
| 写确认等待中发新消息仍 resume 到 write | 应 abandon；查 `SessionResumeGate` 与 `awaiting_confirmation` |
| primary/worker step 序号重复 | 用 `turnExecutionTimeline`；见 [agent-run-steps.md](./agent-run-steps.md) |
| 有 plan 仍每轮全文 user | 检查 `buildDecisionUserFrame` 是否拿到 `taskPlan` |
