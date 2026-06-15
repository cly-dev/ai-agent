# Agent LangGraph：图结构、节点与状态

本文档描述 **单 turn 主运行图**（`AgentLangGraphRunner`）的节点、共享状态、条件边与 Plan/ReAct 分层。  
实现入口：`src/core/agent-engine/engine/main/agent-lang-graph.runner.ts`。

> 延伸阅读  
> - Plan 原理与 LLM 提示：[plan-node.md](./plan-node.md)  
> - Plan 字段、advance、排错：[plan-rules-and-state.md](./plan-rules-and-state.md)  
> - Readiness 检查点：[turn-readiness.md](./turn-readiness.md)  
> - 分页 gather：[paged-list-gather.md](./paged-list-gather.md)

---

## 1. 图总览

### 1.1 主路径（新 turn）

```text
START
  → intent          意图 + 工具收窄
  → plan            外层任务计划（每 turn 一次）
  → readiness       回合就绪（槽位 / 澄清 / observation 已满足）
  → llm             ReAct · Reason（工具决策）
  → resultCheck     ReAct · 规则收拢 + Plan advance（L2/L3）
  → tools           ReAct · Act（HTTP / 分页 gather）
  → resultCheck     …
  → summarize       终局或中间汇总
  → llm             中间 summarize 后若仍有 tool 步则续跑
  → END
```

### 1.2 续跑入口

| `AgentLangGraphRunInput` | START 后第一跳 | 说明 |
|--------------------------|----------------|------|
| 默认 | `intent` | 完整冷启动 |
| `resumeFromLlm` | `llm` | 跳过 intent/plan/readiness |
| `resumeFromWriteConfirm` | `resultCheck` 或 `summarize` | 写确认通过后接续 Plan |

### 1.3 全局短路：`pendingRespond`

任意节点可将 `pendingRespond` 设为非空；条件边 `shouldRouteToRespond` 为真时 **直接进入 `summarize`**（不再经过 llm/tools）。

```text
intent / plan / readiness / llm / resultCheck
         │
         └── pendingRespond ──► summarize ──► END（或中间 summarize 后 ──► llm）
```

---

## 2. 共享状态 `AgentGraphState`

LangGraph 使用 **replace reducer**（每字段由节点返回值整体覆盖，非 merge）。

### 2.1 生命周期字段

| 字段 | 含义 | 主要写入方 |
|------|------|------------|
| `iteration` | ReAct **LLM 决策轮次**（`maxSteps` 熔断）；**不是**审计 step 序号 | `llm` |
| `steps` | 持久化 run 轨迹（`AgentRunStep[]`）；`step` 字段单调递增 | 各节点 append |
| `status` | `running` / `success` / `failed` | 各节点、`updateRun` |
| `finished` | 本 turn 图是否结束 | `summarize`、intent 早期退出等 |
| `finalOutput` | 用户可见终局文本（graph 内副本；落库以 `RunAssistantArtifactStore` 为准） | `summarize` |

**审计 step 与 iteration 分离**：`AgentRunStep.step` 由 `nextRunStepNumber()` 分配；`AgentRun.currentStep = maxRunStepNumber(steps)` 在落库时自动计算。详见 [agent-run-steps.md](./agent-run-steps.md)。

### 2.1.1 用户回复权威产物 `RunAssistantArtifactStore`

每轮 `runId` 一个槽（`reset` → `commit` → `peek` → `clear`）：

| 阶段 | 行为 |
|------|------|
| run 开始 | `artifact.reset(sessionId, runId, turnId)` |
| summarize 定稿 | `streamSummarize` / `publishAssistantBlocks` → `artifact.commit(blocks)` |
| plan 中间步 | `artifact.rephase('draft')`（blocks 不变） |
| run 收尾 `finishAgentRun` | 事务内：`AgentRun.output` + `Message`（`AgentRun.outputMessageId` 幂等）+ `MessageTurn`；事务外 Redis sync |
| `complete` SSE | **落库之后**由 `AgentEngineService` 发出 |
| run finally | `artifact.clear` |

写确认提示文案仅 SSE，**不** `commit`。

### 2.2 工具与观测

| 字段 | 含义 | 主要写入方 |
|------|------|------------|
| `scopedTools` / `scopedLangChainTools` / `scopedToolBundle` / `scopedAllowedToolIds` | 本 turn 可用工具（intent 收窄 + skill bind） | `intent`、`applySkillFrameContext` |
| `toolObservations` | 本 run **新增** 的工具观测 | `tools` |
| `preloadedToolObservations` | GOA / 写确认注入的历史观测 | 图初始 state |
| `toolProfilesByName` | 响应 profile | 初始 state |
| `pendingToolCalls` | LLM 产出、待 `tools` 执行 | `llm`、`resultCheck` |
| `lastToolRoundMeta` | 上一轮 tool 元数据（供 resultCheck post_tools） | `tools`；resultCheck 后清空 |
| `pagedListHttpUsed` | 本 turn 分页 HTTP 计数 | `tools` / gather |

### 2.3 意图与 Skill

| 字段 | 含义 | 主要写入方 |
|------|------|------------|
| `intentKind` | `task` / `smalltalk` / `unclear` | `intent` |
| `skillApplied` / `activeSkill*` | 当前 skill 帧上下文 | `applySkillFrameContext` |
| `hasExpandedOnce` | 是否已做过工具范围放宽 | `resultCheck` expand 分支 |

### 2.4 Plan

| 字段 | 含义 | 主要写入方 |
|------|------|------------|
| `taskPlan` | `TaskPlanSnapshot`（含 `frames` 栈） | `plan`、L1 sync、resultCheck advance、`summarize` finalize |
| `planRunContext` | `fresh` \| `resume`：telemetry、plan 首步 summarize 放行；**不参与** pre_tools 观测选桶 | 图初始 state / session resume |
| `planAborted` | Plan 因 EMPTY/duplicate/error 等中止 | `resultCheck` |

### 2.5 路由

| 字段 | 含义 | 主要写入方 |
|------|------|------------|
| `pendingRespond` | 待 `summarize` 消费的回合回复或观测 | intent / readiness / llm / resultCheck / plan 首步 summarize |

类型定义：`src/core/agent-engine/engine/main/agent-engine.types.ts` → `AgentGraphState`。

---

## 3. Plan 与 ReAct 三层（L1 / L2 / L3）

与「运行时重排 Plan 队列」无关；只同步状态与裁决路由。

| 层 | 时机 | 实现 | 作用 |
|----|------|------|------|
| **L1** | 进入 `llm` 前、`result_check`（pre_tools） | `prepareReActPlanState` → `syncTaskPlanBeforeReAct` | 当前 gather 步已被 **本 run** `toolObservations` 满足则 **先 advance**；`plan_advance_skill_step` 时再展开 skill 帧 |
| **L2** | `resultCheck` | `resolvePreToolsResultCheck` / `resolvePostToolsResultCheck` | dedupe、EMPTY、ERROR、分页续拉、plan 步 required |
| **L3** | `resultCheck`（L2 之后） | `resolveResultCheckPlanFallback` | 步已完成后的冲突兜底：如 `plan_advance_summarize` 压过滞后 `tool_calls` |

L1 推进可写入 run step：`type: plan_sync`（`site`: `llm` | `result_check`）；输出含 `planRunContext`（`fresh` | `resume`）。

实现：`plan-sync.util.ts`、`result-check-route.util.ts`。

---

## 4. 节点说明

下表：**进入时依赖的状态** → **离开时典型变化** → **写入的 step 类型**。

### 4.1 `intent`

| 项 | 说明 |
|----|------|
| **职责** | 意图分类（task/smalltalk/unclear）；类目向量召回；`scopedTools` 收窄与 bind cap |
| **进入** | 全量 `input.tools`；`taskPlan` 通常为空 |
| **离开** | `scopedTools*`、`intentKind`；未命中 → `pendingRespond` + `finished` |
| **steps** | `intent` |
| **下一跳** | `finished` → END；`pendingRespond` → `summarize`；否则 → `plan` |

### 4.2 `plan`

| 项 | 说明 |
|----|------|
| **职责** | 每 turn **一次**外层计划：`resolveOuterPlan`（skill 复合步 + tool + summarize）；session resume 从 GOA 恢复 |
| **进入** | `state.taskPlan` 已存在则 **原样跳过** |
| **离开** | `taskPlan`；首步为 summarize/reason → 可设 `pendingRespond`（`resolveTaskPlanInitialAdvance`） |
| **steps** | `plan` |
| **下一跳** | `finished` / `pendingRespond` → 短路；否则 → `readiness` |

Skill **无独立节点**；外层 `kind=skill` 在 `expandPendingSkillStepIfNeeded` 中展开内层帧。

### 4.3 `readiness`

| 项 | 说明 |
|----|------|
| **职责** | CP1–CP7：smalltalk、消息质量、gather 步 businessFields 槽位（CP7 LLM）等 |
| **进入** | `applySkillFrameContext`；`evaluateTurnReadiness` |
| **离开** | `respond` → `pendingRespond`；否则仅附加 readiness step（**L1 在 `llm` 入口**） |
| **steps** | `readiness` |
| **下一跳** | `finished` / `pendingRespond` → `summarize`；否则 → `llm` |

详见 [turn-readiness.md](./turn-readiness.md)。

### 4.4 `llm`

| 项 | 说明 |
|----|------|
| **职责** | ReAct **Reason**：按 `currentObjective` + observations 做工具决策或文本 |
| **进入** | **L1** `prepareReActPlanState` + 可选 `plan_sync`；`isPendingPlanAnswerStep` → 直接 `pendingRespond`（不调 LLM） |
| **离开** | `pendingToolCalls` 或 `pendingRespond`；`iteration++`；`taskPlan` 含 L1 同步结果 |
| **steps** | `plan_sync`、`llm` |
| **下一跳** | `finished` / `pendingRespond` → `summarize`；否则 → `resultCheck` |

工具绑定：`filterScopedToolsForPlanStep` 按当前 pending tool 步 `toolRole` 收窄。

### 4.5 `tools`

| 项 | 说明 |
|----|------|
| **职责** | 执行 `pendingToolCalls`；写确认门闩（`write_confirmation_gate` step）；分页 gather（`expandPagedListGather`） |
| **进入** | `pendingToolCalls` 非空或 resultCheck 触发的分页续拉 |
| **离开** | `toolObservations` 追加；`lastToolRoundMeta`；`pendingToolCalls` 清空；写确认时 `awaitingWriteConfirmation=true` |
| **steps** | `tool`、`gather`（分页）、`write_confirmation_gate` |
| **下一跳** | 固定 → `resultCheck`（写确认暂停时 primary run 以 success 结束，图不再进 resultCheck） |

### 4.6 `resultCheck`

| 项 | 说明 |
|----|------|
| **职责** | **L2** 工具结果规则；**post_tools** Plan advance；**L3** `resolveResultCheckPlanFallback` |
| **进入** | `pre_tools`：`pendingToolCalls` 来自 llm；`post_tools`：`lastToolRoundMeta` |
| **离开** | `taskPlan` advance；`pendingToolCalls` / `pendingRespond`；`planAborted`；expand 时重置 scoped 与 plan |
| **steps** | `plan_sync`（pre_tools L1 兜底）、`result_check`、duplicate skip 伪 tool steps |

**result_check step 常用 output 字段：**

| 字段 | 含义 |
|------|------|
| `phase` | `pre_tools` / `post_tools` |
| `route` / `reason` | L2 outcome |
| `planAdvanceRoute` / `planAdvanceReason` | Plan 推进结论 |
| `planRouteAuthority` | `plan` / `react` / `safety_abort` |
| `planSyncedAt` | 仅 pre_tools 兜底 sync 时为 `result_check` |
| `planSupersededPendingToolCallCount` | L3 丢弃的滞后 tool_calls 数 |

**典型出口：**

| 条件 | 下一跳 |
|------|--------|
| `pendingRespond` | `summarize` |
| `shouldRouteGraphToTools` | `tools` |
| `iteration >= maxSteps` | END |
| 默认 | `llm` |

### 4.7 `summarize`

| 项 | 说明 |
|----|------|
| **职责** | 消费 `pendingRespond`；LLM 或规则生成 Message Blocks；Plan 中间步 `finalizePlanAfterSummarize` |
| **进入** | `resolveObservationForSummarize(pendingRespond)` |
| **离开** | `finalOutput`；`finished=true` 或 **续跑**（`shouldContinuePlanAfterSummarize`） |
| **steps** | `summarize` |
| **下一跳** | `finished` 或写确认续跑 → END；中间 summarize 后仍有 tool 步 → `llm` |

---

## 5. 条件边一览

| 源节点 | 条件 | 目标 |
|--------|------|------|
| START | `resumeFromWriteConfirm` + `pendingRespond` | `summarize` |
| START | `resumeFromWriteConfirm` | `resultCheck` |
| START | `resumeFromLlm` | `llm` |
| START | 默认 | `intent` |
| intent / plan / readiness / llm / resultCheck | `finished` | END |
| 同上 | `shouldRouteToRespond` | `summarize` |
| intent | 默认 | `plan` |
| plan | 默认 | `readiness` |
| readiness | 默认 | `llm` |
| llm | 默认 | `resultCheck` |
| tools | 默认 | `resultCheck` |
| resultCheck | `shouldRouteGraphToTools` | `tools` |
| resultCheck | `iteration >= maxSteps` | END |
| resultCheck | 默认 | `llm` |
| summarize | `finished` 或 `resumeFromWriteConfirm` | END |
| summarize | 默认 | `llm` |

---

## 6. Run step 类型（`AgentRunStep.type`）

| type | 产出节点 |
|------|----------|
| `intent` | intent |
| `plan` | plan |
| `write_confirmation_gate` | tools 写确认门闩（记录待用户确认的 mutation 决策） |
| `plan_sync` | llm / resultCheck（L1） |
| `readiness` | readiness |
| `llm` | llm |
| `tool` | tools |
| `gather` | tools（分页 map-reduce） |
| `result_check` | resultCheck |
| `summarize` | summarize |

Turn 级合并视图（primary + worker）：[agent-run-steps.md §4](./agent-run-steps.md#4-turnexecutiontimelineapi)。

---

## 7. Session 续跑与写确认互斥

| GOA `activeTask.status` | 新 userMessage（非 confirmWrite） | 写确认 API |
|-------------------------|-----------------------------------|------------|
| `in_progress` | `SessionResumeGate` 可 `resume` | — |
| `awaiting_confirmation` | **abandon** → fresh plan（不走 session resume） | `confirmWrite` → worker run |
| `completed` / `abandoned` | fresh | — |

实现：`session-resume-gate.service.ts`、`isActiveTaskChatResumable`（仅 `in_progress` 可 chat resume）。

---

## 8. 推荐排错顺序

1. **看图走到哪一节点**：`steps[].type` 序列是否符合 §1.1。
2. **Plan 是否过期**：搜 `plan_sync`、`planAdvanceReason`、`taskPlanStep`（在 `result_check` / `llm` meta）。
3. **为何进 summarize**：`pendingRespond` 谁写入（intent / readiness / resultCheck plan advance）。
4. **为何跳过 analyze**：查 `planRouteAuthority=plan` 与 `pendingStepIds` 是否线性推进（不应出现队列重排）。
5. **工具未执行**：`result_check.route=tools` 与 `pendingToolCallCount`；分页看 `paged_gather_resume`。
6. **step 序号重复或跳号**：单 run 看 `steps[].step`；跨 primary/worker 用 `turnExecutionTimeline`（[agent-run-steps.md](./agent-run-steps.md)）。

---

## 9. 后续文档维护建议

| 变更类型 | 更新文档 |
|----------|----------|
| 增删图节点或条件边 | **本文档** §1、§5 |
| Run step 编号 / turn 时间线 | [agent-run-steps.md](./agent-run-steps.md) |
| Plan advance / stopWhen 规则 | [plan-rules-and-state.md](./plan-rules-and-state.md) |
| Readiness CP | [turn-readiness.md](./turn-readiness.md) |
| L1/L3 裁决规则 | 本文档 §3 + `result-check-route.util.ts` 注释 |
| 前端 SSE / message blocks | [chat-sse-message-blocks-frontend.md](./chat-sse-message-blocks-frontend.md) |

新建能力时：**先改图与状态表，再改实现**，避免 runner 与文档再次偏离。
