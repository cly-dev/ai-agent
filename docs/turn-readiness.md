# Turn Readiness（回合就绪层）

Plan 之后、ReAct（`llm`）之前插入的统一「本回合是否可执行」判断层；与 `intent` 早期退出、`summarize` 终局回复配合，替代原分散的 `pendingSummaryObservation` 短路逻辑。

## 图路由

> 全图节点与 `AgentGraphState` 字段说明：[agent-graph.md](./agent-graph.md)

```text
START → intent → plan → readiness → llm ⇄ resultCheck ⇄ tools → summarize
         │         │         │              │
         └─────────┴─────────┴──────────────┴→ summarize（pendingRespond）

指定 skillId：START → plan → readiness → …（跳过 intent）

写确认续跑：START → resultCheck | summarize（跳过 intent/plan/readiness）
LLM 续跑：  START → llm（跳过 readiness）
```

| 节点 | 职责 |
|------|------|
| **intent** | 类目召回、工具收窄；smalltalk / 意图不清 / 未命中 → `pendingRespond` → **summarize** |
| **plan** | 外层编排（`kind=skill \| tool \| summarize`）；首步为 answer/summarize 时可直接设 `pendingRespond` → **summarize**（跳过 readiness） |
| **readiness** | plan 之后：**仅**执行就绪 — gather 步槽位（CP LLM）、observation 已满足；入口先 `applySkillFrameContext` 展开外层 `kind=skill` 步；**不**做 smalltalk / 消息清晰度判断 |
| **summarize** | 消费 `pendingRespond`，生成 Message Blocks 终局回复 |
| **llm** | `plan_answer` 步、工具决策；入口先 `applySkillFrameContext` |
| **resultCheck** | dedupe / EMPTY / ERROR / plan advance；`plan_advance_skill_step` 时在此展开下一 skill 帧 |

Skill **不再**作为独立图节点；由 Plan 外层 `kind=skill` 步 + `expandPendingSkillStepIfNeeded` 进入内层帧。

## 状态：`pendingRespond`

```ts
type PendingRespond =
  | { mode: 'turn'; request: TurnRespondRequest }
  | { mode: 'observation'; observation: ToolObservation };
```

| 模式 | 典型来源 |
|------|----------|
| `turn` | intent / readiness 请求的回合级回复 |
| `observation` | 工具结果、`direct_reply`、plan summarize、写确认续跑 |

路由：`shouldRouteToRespond(state)` — 有 `pendingRespond` 且未 `finished` 时进 `summarize`。

`summarize` 入口统一调用 `resolveObservationForSummarize(pendingRespond)`，将 `turn` 请求映射为 observation（见 `turn-respond.util.ts`）。

### TurnRespondKind

| kind | 设置方 | summarize 行为 |
|------|--------|----------------|
| `smalltalk` | intent | `AGENT_SUMMARIZE_SMALLTALK` |
| `message_unclear` | intent | `direct_user` + clarification guidance |
| `unsupported_scope` | intent / readiness / llm 兜底 | `direct_user` + unsupported guidance |
| `intent_recall_failed` | intent | 同上 |
| `clarification` | readiness（CP5） | `AGENT_RESPOND_CLARIFICATION` |
| `direct_reply` | llm 短路 | `summarizeDirectLlmReply` |

## Readiness 检查点（按执行顺序）

| # | 条件 | 结果 | 主要路径 |
|---|------|------|----------|
| CP1 | `AGENT_TURN_READINESS=0` | ready（整节点逻辑跳过） | 全部 |
| CP2 | `resumeFromWriteConfirm` | ready | 写确认续跑 |
| CP3 | pending 为 **tool gather** 且 `scopedTools.length === 0` | respond → `unsupported_scope` | skill 帧 bind 后无工具等 |
| CP4 | 无 plan / pending 为 **plan answer** / 非 tool gather / obs 已满足 / 无 businessFields | ready 或 `pendingRespond` | 常见放行 |
| CP5 | LLM 判定缺 businessFields | respond → `clarification` | 有 gather 步且槽位未齐 |

**与 intent 的分工**

- **对话意图**（smalltalk、消息是否清晰、类目召回）：仅在 **intent** 处理；指定 `skillId` 时跳过 intent，用户已在 UI 选定能力。
- **执行就绪**（gather 槽位、observation 是否满足）：**readiness** 在 plan（及 skill 帧展开）之后统一处理；开放路径与 `skillId` 路径共用同一节点与 `evaluateExecutionReadiness`。

**CP5 细节**

- `requiredFields` 来自 `listBusinessFieldsForPlanGatherStep`（plan 步 `toolRole` + 工具 `agentMetadata.businessFields`）。
- 会话上下文：`summarizeSessionObservationsForReadiness(allToolObservations(state))`，与 `isPlanToolStepSatisfiedByObservations` 使用同一 observation 集合。
- **页面上下文**：`formatPageContextPromptBlock(pageContext)` 注入 CP5 LLM user 消息（`<page_context>` JSON），用于从详情页 entity/routeParams 解析 productId、reviewId 等，与「识别上下文」类请求对齐。
- LLM 解析失败 → 视为 ready（不阻塞执行，避免误杀）。
- `AGENT_READINESS_SLOT_LLM=0` → 跳过 CP5，直接 ready（由后续 llm/工具环处理缺参）。

## 典型路径示例

```text
# 详情页填框（page host 唯一 skill 自动选中）
intent → plan(page_host_unique) → skill 帧 workflow → readiness(ready) → …

# 缺 productId（外层仍为 mutation 模板、未带 pageContext）
intent → plan → readiness(CP5) → summarize(clarification)

# Intent 类目未匹配（intent 早期退出）
intent → summarize(direct_user)

# Plan 首步即 answer
intent → plan → summarize（plan 设 pendingRespond，跳过 readiness）

# 正常工具环（含 skill 内层帧）
intent → plan → readiness(ready) → llm → tools → resultCheck → …

# 外层多 skill：内层完成 → pop → resultCheck(plan_advance_skill_step) 展开下一 skill
… → resultCheck → llm（已在内层 bind 好工具）
```

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `AGENT_TURN_READINESS` | 开启 | `0` / `false` 关闭 readiness 评估（节点仍写入 step，reason=`disabled`） |
| `AGENT_READINESS_SLOT_LLM` | 开启 | 关闭后 CP5 不跑 LLM |

## Prompt 模板

| Key | 用途 |
|-----|------|
| `agent.readiness_slot_check` | CP5 结构化 `{ ready, missingFields[] }` |
| `agent.respond_clarification` | `clarification_request` observation 的终局文案 |

## Run step

- 新增 type：`readiness`
- output：`{ status: 'ready' \| 'respond', reason: string }`
- `respond` 时不写 tools 结果，由下一步 `summarize` 落终局 `finalOutput`

## 已知边界

| 场景 | 行为 |
|------|------|
| `resumeFromLlm` | 跳过 readiness，直达 llm |
| readiness 关闭 | llm 节点仍保留 `unsupported_scope` 兜底（无 intent 命中且无工具） |
| plan answer 步 | readiness 放行；由 **llm** 节点检测 `isPendingPlanAnswerStep` 后设 `pendingRespond` |
| CP5 关闭 / LLM 失败 | 不澄清，进入 llm；可能由工具校验或 resultCheck 再兜底 |
| `plan` 被 skip（`tools_disabled`） | `taskPlan` 为 null，readiness 放行 → llm；依赖 `enableToolCall` 关闭工具环 |
| 指定 `skillId` | 跳过 intent；readiness 仍校验 gather 业务槽位，不因寒暄/短句拦截 |

## 审查记录（逻辑要点）

### `observation_satisfied` 时推进 plan

仅在 **本 run** `toolObservations` 满足当前 gather 步时，readiness 返回 `observation_satisfied`。**GOA 预载永远不能令 gather 跳步。** 写步永不由此路径满足。Plan 推进（L1 `plan_sync`）在 **`llm` 入口**统一执行，readiness 只做判定。`evaluateExecutionReadiness` 要求传入 `observationBuckets`（`planObservationBucketsFromState`）。

readiness 只返回 `reason: observation_satisfied`；**`llm` 入口** L1 `syncTaskPlanBeforeReAct` 再推进 plan：

- 推进后 pending 为 **summarize/reason** → `llm` 设 `pendingRespond`，图路由进 summarize
- 推进后仍为 **tool** / **skill** → 更新 `taskPlan` 后进 decision LLM

与 `resultCheck` 的 `pre_tools` 使用同一 `runOwned` 判定；`skillConfig` 传入 `isPlanToolStepSatisfiedByObservations`。

### CP5 与 observation 判定的顺序

1. 先 `isPlanToolStepSatisfiedByObservations`（结构化观测是否够）
2. 再 `listBusinessFieldsForPlanGatherStep` + LLM 槽位（用户自然语言是否已带齐参数）

避免「已有工具结果仍反问」或「无结果但用户已说清 ID」两类误判。

### `pendingRespond` 生命周期

- 任意节点写入后，下游 conditional edge 优先路由到 `summarize`
- `summarize` 成功消费后置 `pendingRespond: null`；`continuePlan` 中间步亦清空
- `readiness` 入口：若已有 `pendingRespond` 则 no-op（防止 plan 预置 summary 被覆盖）
- **`mode: 'turn'` 为终局回复**：`summarize` 后 `finished: true`，**不**触发 `shouldContinuePlanAfterSummarize`（避免澄清/smalltalk 后同轮再进 llm）；`taskPlan` 保持原样供下轮续接

### 曾修复：turn respond 后误续跑 llm

`plan → readiness(clarification) → summarize` 时，若 `taskPlan` 仍有 pending gather 步，`shouldContinuePlanAfterSummarize` 曾为 true，导致同轮 `summarize → llm`。  
现以 `isTerminalTurnRespondPending(pendingRespond)`（`mode === 'turn'`）强制结束本 turn。

### 不宜在 readiness 做的事

- **不**替代 `resultCheck` 的 post_tools 推进（每轮工具执行后仍由 resultCheck 负责）
- **不**处理写确认闸门（`resumeFromWriteConfirm` 在图外注入状态，START 跳过 readiness）
- **不**重复 intent 的类目召回

## 相关代码

| 文件 | 说明 |
|------|------|
| `engine/turn/turn-readiness.util.ts` | `evaluateExecutionReadiness` 主逻辑 |
| `engine/turn/turn-readiness-llm.util.ts` | CP5 槽位 LLM |
| `engine/turn/turn-respond.util.ts` | `pendingRespond` / observation 映射 |
| `engine/turn/turn-graph.util.ts` | `shouldRouteToRespond` |
| `engine/main/skill-frame-expand.util.ts` | skill 帧展开 |
| `engine/main/plan-stack.util.ts` | Plan 帧栈 push/pop |
| `engine/main/agent-graph/` | 图节点与边（`build-agent-graph.ts` + `nodes/`） |
