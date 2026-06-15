# Agent Run 步骤编号与 Turn 时间线

实现：`src/core/agent-engine/engine/main/agent-run-steps.util.ts`  
落库：`AgentRun.steps`（JSON）、`AgentRun.currentStep`  
查询：`GET /agent-run/:id` → `turnExecutionTimeline`（同 turn 合并视图）

> 图节点与 step 类型对照：[agent-graph.md §6](./agent-graph.md#6-run-step-类型agentrunsteptype)  
> 写确认 gate step：[write-confirmation-frontend.md §1.1](./write-confirmation-frontend.md)

---

## 1. 两个序号：不要混用

| 概念 | 字段 | 含义 |
|------|------|------|
| **审计 step** | `AgentRunStep.step` | 本 run 内单调递增的轨迹序号（1, 2, 3…） |
| **ReAct iteration** | `AgentGraphState.iteration` | LLM 决策轮次，用于 `maxSteps` 熔断与 prompt debug |

规则：

- 每个 `AgentRunStep` 的 `step` 由 `nextRunStepNumber(existingSteps)` 分配，**与 iteration 无关**。
- `AgentRun.currentStep` = `maxRunStepNumber(steps)`，由 `updateRun` / `finishAgentRun` **自动写入**，调用方不再传第三参数。
- `iteration` 仍在 graph 内递增（主要在 `llm` 节点），仅表示「第几轮 Reason」，不等于审计 step 数（中间可能有 `plan_sync`、`result_check`、`tool` 等）。

---

## 2. 单 run 内编号

```text
steps = [ intent#1, plan#2, readiness#3, plan_sync#4, llm#5, tool#6, result_check#7, summarize#8 ]
currentStep = 8
```

典型分配点：

| 节点 / 场景 | 工具函数 |
|-------------|----------|
| intent / plan / readiness | `nextRunStepNumber(state.steps)` |
| plan_sync（L1） | `nextRunStepNumber(graphState.steps)` |
| llm | `nextRunStepNumber(graphStateForLlm.steps)` |
| tools（含 duplicate skip） | `buildDuplicateSkipToolSteps(calls, state.steps, reason)` |
| result_check + plan_sync | skip steps 先编号，再 plan_sync，再 result_check |
| write_confirmation_gate | gate step 接在已执行读 tool steps 之后 |
| worker run（写确认续跑） | `priorSteps: []`，从 **1** 重新编号 |

**duplicate skip**：同一轮 dedupe 跳过的多个 tool call 各占一个递增 step，不再共用同一序号。

---

## 3. 多 run 同一 Turn

一个 `MessageTurn` 可包含多个 `AgentRun`：

| role | sequence | 典型场景 |
|------|----------|----------|
| `primary` | 1 | 用户发消息后的主 run |
| `worker` | 2+ | 写确认通过后执行写 Tool + 后续 summarize |

各 run 的 `steps` **独立编号**（worker 从 1 起）。前端若要看 **整轮对话的执行轨迹**，应使用 `turnExecutionTimeline`，而不是只看 primary run 的 `steps`。

---

## 4. `turnExecutionTimeline`（API）

**接口**：`GET /agent-run/:id`（需 `turnId` 非空）

响应在单 run 字段之外附加：

```typescript
type TurnExecutionStep = AgentRunStep & {
  turnStep: number;       // turn 内全局序号 1, 2, 3…
  sourceRunId: number;    // 来自哪个 AgentRun
  sourceRunRole: string;  // primary | worker
};
```

合并规则（`mergeTurnExecutionSteps`）：

1. 取同 `turnId` 下全部 run，按 `sequence` → `id` 排序。
2. 依次拼接各 run 的 `steps`（run 内按 `step` 升序）。
3. 为每条 step 赋 `turnStep`（turn 级单调递增）。

示例（写确认）：

```text
primary  run: intent#1 → plan#2 → llm#3 → tool(read)#4 → write_confirmation_gate#5
worker   run: tool(write)#1 → summarize#2

turnExecutionTimeline:
  turnStep 1–5  → sourceRunId=primary
  turnStep 6–7  → sourceRunId=worker
```

列表分页 `findPage` **不**附带 timeline；仅 `findOne` 在存在 `turnId` 时计算。

---

## 5. `write_confirmation_gate` step

写确认暂停时，primary run 在 **tools 节点**追加：

```json
{
  "step": 5,
  "type": "write_confirmation_gate",
  "output": {
    "status": "awaiting_user",
    "pendingToolCallCount": 1,
    "toolNames": ["..."]
  }
}
```

- primary run 落库 **status=success**（等待用户，非 failed）。
- 读 Tool 若同轮已执行，其 `tool` step 序号 **小于** gate step。
- 用户 `confirmWrite` 后写 Tool 在 **worker run** 产生新的 `tool` step（worker 侧 step 从 1 起）。

---

## 6. 实现索引

| 模块 | 职责 |
|------|------|
| `agent-run-steps.util.ts` | `maxRunStepNumber`、`nextRunStepNumber`、`mergeTurnExecutionSteps` |
| `agent-run-lifecycle.service.ts` | `updateRun`、`finishAgentRun` 写 `currentStep` |
| `agent-lang-graph.runner.ts` | 各节点 append step |
| `agent-tool-runtime.util.ts` | tool round 内 step 编号 |
| `tool-result-check.util.ts` | duplicate skip steps |
| `agent-run.service.ts` | `findOne` 组装 `turnExecutionTimeline` |
| `agent-run.types.ts` | `AgentRunResponse.turnExecutionTimeline` |

---

## 7. 排错

| 现象 | 检查 |
|------|------|
| 两个 step 都是 `step: 1` | 是否混看了 primary + worker；用 `turnExecutionTimeline` |
| `currentStep` 与 max(steps) 不一致 | 是否绕过 `updateRun` 直接写库 |
| worker 步骤从很大数字开始 | worker 应 `priorSteps: []`；勿继承 primary steps 编号 |
| gate 后无 worker step | 用户是否 confirm；pending 是否过期 |
