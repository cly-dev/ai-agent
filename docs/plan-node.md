# Plan 节点：技术实现与原理

Plan 节点是 Agent 运行时的 **任务规划层**，与 ReAct 决策环配合：**Plan 拆一次，ReAct 逐步执行**。  
目标：避免每轮 LLM 决策仍携带完整用户原话、重复调用同一 READ 工具（如「分析评论」场景下反复 list）。

> **规则与状态详解**（字段、枚举、advance、gather vs 分页拉数、排错）：[plan-rules-and-state.md](./plan-rules-and-state.md)  
> **Run 步骤编号 / Turn 时间线**：[agent-run-steps.md](./agent-run-steps.md)

---

## 1. 设计原理

### 1.1 Plan + ReAct 分工

| 阶段 | 职责 | 是否调 LLM | 是否调 Tool |
|------|------|------------|-------------|
| **Plan** | 拆 deliverable、生成有序 steps、写入 `currentObjective` | 是（默认 `agent.plan` 一次；`PLAN_LLM=0` 时纯规则） | 否 |
| **ReAct · Reason** | 按 `currentObjective` + observations + tool_schema 决策 | 是 | 可选 |
| **ReAct · Act** | 执行 tool_calls | 否 | 是 |
| **ReAct · Observe** | 写入 observations | 否 | — |
| **Advance** | `resultCheck` 推进 plan，必要时短路 summarize | 否 | 否 |

```text
用户原话 ──► Plan（一次）──► currentObjective + pendingSteps
                              │
                              ▼
                    ┌──► llm (Reason)
                    │         │
                    │         ▼
                    │      tools (Act)
                    │         │
                    │         ▼
                    │   observations (Observe)
                    │         │
                    └──── resultCheck (Advance) ──► summarize 或回到 llm
```

### 1.2 核心问题与解法

**问题：** 纯 ReAct 每轮 pinned `<current_user_request>` 仍是完整原话；skill prompt 若写「请调用 @工具」，fetch 完成后 LLM 仍会再 fetch。

**解法：**

1. **用户原话只出现在首轮** `<user_intent>`（Plan 存在时）。
2. **每轮 Reason 主指令是** `<current_objective>`（当前子步骤）。
3. **tool 步完成后规则推进 Plan**；下一步若为 `kind: summarize`，**直接 summarize**，跳过第二次 Reason。

### 1.3 与 Skill / Tool 的边界

| 层 | 管什么 | 不负责什么 |
|----|--------|------------|
| **外层 Plan** | 编排 `kind=skill` 复合步、tool 步、summarize | 不执行工具、不向量选 skill |
| **Skill 帧展开** | bind 工具子集、内层 `resolveTaskPlan` | 不做类目召回 |
| **Plan 栈** | outer + inner 帧 push/pop | 不支持 skill 嵌套超过 2 层 |
| Tool metadata | role、参数、businessFields | 不拆用户问句 |
| resultCheck | dedupe、EMPTY/ERROR、**plan advance**、skill 步展开 | 不调 LLM |

---

## 2. Graph 路由

> 节点职责、共享状态与条件边总表：[agent-graph.md](./agent-graph.md)

```text
START → intent → plan → readiness → llm ⇄ resultCheck ⇄ tools → summarize → END
         │                              │
         └──────── pendingRespond ──────┘

写确认续跑：START → resultCheck | summarize
LLM 续跑：  START → llm
```

**要点：**

- **intent** 先收窄 `scopedTools`（类目向量召回 + bind cap）。
- **plan** 在 scopedTools 确定后运行：`listAvailableSkillsForScopedTools` → **外层** `resolveOuterPlan`（`planMode=outer_orchestration`）。
- **skill** 不作为独立节点；外层 `kind=skill` 步由 `expandPendingSkillStepIfNeeded` 展开为内层帧（`resolveTaskPlan`）。
- Plan **每 turn 只执行一次**（`state.taskPlan` 已存在则跳过；session resume 从 GOA 恢复 `frames`）。
- 外层 Plan 默认调 `agent.plan` LLM；**mutation 且步序不合规**时强制替换为确定性模板（`mutation_template_forced`）；LLM 失败则 `buildTaskPlan` 规则兜底；`PLAN_LLM=0` 时仅规则。**不调 Tool**。

实现位置：`src/core/agent-engine/engine/main/agent-graph/nodes/plan.node.ts`（`plan` 节点 + 条件边见 `build-agent-graph.ts`）。

---

## 3. 数据结构

定义：`src/core/agent-engine/engine/main/task-plan.types.ts`

### 3.1 TaskPlanSnapshot（graph state + Redis 续跑）

| 字段 | 说明 |
|------|------|
| `source` | `workflow` \| `llm` \| `template` \| `minimal` |
| `originalUserRequest` | 用户原话（仅首轮注入 user_intent） |
| `goal` | 任务目标摘要（优先 skill.description → skill.name → 用户原话） |
| `deliverable` | `analysis` \| `list` \| `detail` \| `mutation` \| `answer` |
| `constraints` | 约束列表（预留，当前多为 `[]`） |
| `steps` | 有序步骤定义 |
| `pendingStepIds` | 待执行步骤 id 队列 |
| `completedStepIds` | 已完成步骤 id |
| `taskPhase` | 当前阶段：`gather` \| `analyze` \| `answer` \| `mutate` |
| `currentObjective` | **ReAct Reason 的主 user 指令** |
| `currentStepId` | 当前步骤 id |
| `frames` | Plan 帧栈（outer + skill 内层） |
| `activeFrameIndex` | 当前活跃帧下标 |

### 3.2 TaskPlanStep

| 字段 | 说明 |
|------|------|
| `id` | 步骤唯一 id，如 `fetch`、`analyze` |
| `phase` | 与 taskPhase 对齐 |
| `kind` | `skill`：外层复合步，运行时 push 内层帧；`tool`：需 LLM 选 tool；`summarize` / `reason`：由 resultCheck 或 llm 短路汇总 |
| `skillId` | `kind=skill` 时必填，须 ∈ plan 时 `availableSkills` |
| `toolRole` | 可选，期望的 decisionRole（如 `read-list`） |
| `objective` | 给 LLM 的子目标英文指令 |
| `stopWhen` | tool 步完成条件，见 §5 |

Graph state 字段：`AgentGraphState.taskPlan`（`agent-engine.types.ts`）。  
写确认续跑：`PendingWriteResumeContext.taskPlan`（`pending-write-confirmation.types.ts`）。

---

## 4. Plan 如何生成（buildTaskPlan）

实现：`src/core/agent-engine/engine/main/task-plan.util.ts` → `buildTaskPlan()`

### 4.1 输入

```typescript
{
  userMessage: string;           // 用户原话
  scopedToolSummaries: Array<{   // 来自 scopedTools + resolveToolDecisionRole
    name: string;
    role: ToolDecisionRole;
  }>;
  skillApplied?: boolean;
  skillName?: string | null;
  skillDescription?: string | null;
  skillConfig?: unknown;         // Skill.config JSON
}
```

Plan 节点调用前，skill 命中时会写入 `activeSkillName` / `activeSkillDescription` / `activeSkillConfig`。

### 4.2 生成路径（优先级从高到低）

与 [plan-rules-and-state.md §4](./plan-rules-and-state.md#4-plan-生成规则resolvetaskplan-优先级) 同步。

#### 路径 ① workflow（显式配置，产品未建设表单时可手写 JSON）

`Skill.config` 示例：

```json
{
  "deliverable": "analysis",
  "workflow": {
    "steps": [
      {
        "id": "fetch",
        "phase": "gather",
        "kind": "tool",
        "toolRole": "read-list",
        "objective": "Call read-list once with filters from user_intent.",
        "stopWhen": "observation_non_empty"
      },
      {
        "id": "analyze",
        "phase": "analyze",
        "kind": "summarize",
        "objective": "Analyze observations only. Do NOT call read-list again.",
        "stopWhen": "always"
      }
    ]
  }
}
```

解析：`parseSkillPlanConfig()` → `validatePlanStepsAgainstScoped()` 校验 toolRole 与 scoped tools 一致；**无效 workflow 会降级**到后续路径，不会静默使用坏步骤。

#### 路径 ② 确定性 mutation 模板

**内层**（`resolveTaskPlan`）：`shouldUseDeterministicMutationPlan()` 为 true 时（scoped 含 write，且 `deliverable=mutation` / 外层无 skill / L2·L3 回复类 Skill）→ **跳过 Plan LLM**，产出固定步序：

```text
read_detail|list(gather) → compose_write(analyze/tool) → present(answer/summarize)
  → write(mutate/tool) → confirm(answer/summarize)
```

**外层**（`resolveOuterPlan`）：LLM 返回 `deliverable=mutation` 或含 write tool 步但 **不含** `compose_write`/`present`/`write` 合规序时，同样强制替换为上述模板（`llmFallbackReason: mutation_template_forced`）。外层含 `kind=skill` 步时不替换，由内层 `resolveTaskPlan` 处理。

合规判定：`isCompliantMutationPlan()`（`task-plan.util.ts`）。`skill.config.workflow` 若不合规 mutation 步序，**降级**到本模板。

#### 路径 ③ Plan LLM（无 workflow / 非确定性回复场景时默认）

实现：`resolveTaskPlan()` → `tryBuildTaskPlanViaLlm()`（`task-plan-llm.util.ts`）。

- Prompt 模板：`agent.plan`（DB/Redis，代码兜底见 `prompt-defaults.ts`）。
- 输出：structured JSON（`llmTaskPlanSchema` / zod）。
- 输入 payload：`userMessage`、skill 摘要、`scopedTools`（name + role）、`sessionWorkingMemory`（有 GOA 时）。
- 校验：`kind=tool` 的 `toolRole` 必须在当前 scoped 工具 role 集合内。
- **mutation**：若 LLM 步序不合规（缺 `compose_write`/`present`/`write` 或顺序错误）→ 强制路径 ② 模板（`method: template`，`llmFallbackReason: mutation_template_forced`）。
- 失败或 `PLAN_LLM=0` → 走路径 ④ 规则 template。
- `source: 'llm'`；plan step 的 `method: 'llm'`。

##### 观测满足与跳步（执行层，`plan-observation-scope.util.ts`）

Graph 内观测分两层（见 [working-memory.md](./working-memory.md)）：

| 桶 | 来源 | 用途 |
|----|------|------|
| `preloadedToolObservations` | GOA / 写确认续跑注入 | LLM / summarize 上下文；**分页 gather 续拉** |
| `toolObservations` | 本 run 工具执行 | **pre_tools 跳步**（gather 满足判定） |

观测选取函数：

| 函数 | 合并策略 | 用于 |
|------|----------|------|
| `selectObservationsForPlanToolSatisfaction` | **仅** `runOwned` | readiness、`plan_sync`、`pre_tools` 步满足 |
| `selectObservationsForPagedGatherResume` | `preloaded + runOwned` | `paged_gather_resume`、图边 `shouldRouteGraphToTools` |

`planRunContext`（`fresh` / `resume`）仅标记本 turn 运行上下文（telemetry、`plan_sync` 输出、**plan 首步 summarize 放行**），**不参与** pre_tools 选桶。

硬性规则（`isPlanToolStepSatisfiedByObservations`，`purpose=pre_tools_advance`）：

- **写步（`write-*`）永不** 被历史观测满足；只有 `post_tools` 本轮 HTTP 成功后才 advance。
- **gather 步** 本 run 无观测 → readiness **不会** `observation_satisfied` → 必须 `llm → tools`（即使 GOA 有历史数据）。
- **Plan 首步 summarize**（`resolveTaskPlanInitialAdvance`）：`fresh` 且 `runOwned` 为空 → **不**跳过 ReAct；`resume` 续跑可凭 GOA 直接进入 summarize。
- `satisfiedToolRoles`（Plan LLM 提示）仅反映 **本 run** 已满足的 role。

实现：`plan-observation-scope.util.ts`、`task-plan.util.ts`（`PlanToolStepSatisfactionPurpose`）。

##### Session 工作区与是否重新拉数（Plan LLM，`agent.plan`）

Plan LLM 收到 `sessionWorkingMemory`（`coverage: full_session_goa`）时，须先做 **data fitness** 判断，再决定是否规划 gather（与执行层 run-scoped 跳步互补）：

| 条件 | 规划行为 |
|------|----------|
| 工作区观测与用户意图一致（同筛选、同数量范围、成功非空） | 可跳过对应 `read-*` gather，直接 `analyze` / `answer` summarize |
| 筛选/店铺/时间/关键词/条数与用户要求不一致 | **必须** 规划 gather / tool 重新拉数 |
| 历史 episode 为 EMPTY / 失败 / 结果不可用 | **必须** 调整 gather 或先 clarify |
| `satisfiedToolRoles` 含某 role 但 fitness 不通过 | **忽略** satisfied 提示，仍规划 gather |
| 写操作缺字段、无法从观测草拟 payload | 先 gather，再 draft summarize → write |
| 用户明确要求刷新 / 最新 / 重新获取 | 规划 gather，即使 role 已 satisfied |

原则：**工作区是上下文，不是「永远不用再调工具」的许可证**；执行层在 `fresh` 模式下仍要求本 run 有观测才能 pre_tools 跳步。完整英文提示词见 `prompt-defaults.ts` → `AGENT_PLAN`；部署后执行 `npm run db:publish-prompts`。

环境变量：

| 变量 | 默认 | 说明 |
|------|------|------|
| `PLAN_LLM` | 开启 | `0` 关闭 LLM，仅用规则 template |
| `PLAN_SKILL_PROMPT_EXCERPT_CHARS` | `1200` | 传给 Plan LLM 的 skill.prompt 截断长度 |

#### 路径 ④ template（LLM 失败时的规则兜底）

无 `workflow.steps` 时：

1. 读 `config.deliverable`（可选）。
2. 未配置则按 scoped 工具 `decisionRole` 推断 deliverable：
   - 含 write-* → `mutation`
   - read-list + read-detail → `detail`
   - 仅 read-list → **skill 命中时为 `analysis`**，否则 `list`
   - 仅 read-detail → `detail`
   - 否则 → `answer`
3. 按 deliverable 套内置模板（`buildTemplateSteps()`）。

常见模板：

| deliverable | 步骤 |
|-------------|------|
| `analysis` | fetch(tool, read-list) → analyze(summarize) |
| `list` | fetch(tool) → answer(summarize) |
| `detail` | list/detail(tool…) → answer(summarize) |
| `mutation` | read_detail/list → compose_write → present → write → confirm |

`source: 'template'`。plan step 可能带 `llmFallbackReason: llm_plan_failed | llm_plan_disabled`。

#### 路径 ⑤ minimal

无合适 tool 模板时，单步 `answer(summarize)`。  
`source: 'minimal'`。

### 4.3 不做的事

- **不**从 skill.prompt 正文 parse 步骤（无 Markdown 约定）。
- **不**在 TS 里硬编码中英文关键词拆 deliverable（LLM 或 `config.deliverable` / tool role 模板负责）。
- **不**每轮 ReAct 重复调 Plan LLM（每 turn 仅 plan 节点一次）。

---

## 5. Plan 如何推进（resolveTaskPlanAfterTools）

在 `resultCheck` 的 **post_tools** 阶段调用。若本轮为 **EMPTY 终态**（`empty_tool_results`），**不 advance**，并 **清空 `taskPlan`** 后直接 summarize（见 §5.4）。有正常数据时 plan advance 仍优先于常规 summarize 短路。

### 5.1 触发条件

- `state.taskPlan` 存在。
- 当前 pending 步骤 `kind === 'tool'`。
- 本轮 executionStatuses **无 ERROR**（且无 `retry` / `llm` disposition）。
- 本轮 **非全 EMPTY**（全 EMPTY 时不 advance，见 §5.4）。
- `isToolStepComplete()` 满足（**仅看本轮** `roundObservationIndices` 对应的 observations，不用历史轮次）。

### 5.0 Plan 首步即为 summarize/reason

`plan` 节点内调用 `resolveTaskPlanInitialAdvance()`：若 pending 首步为 `summarize`/`reason`，且（本 run 已有观测 **或** `planRunContext=resume`），直接写入 `pendingRespond`，**跳过** readiness / ReAct tool 环（reason: `plan_initial_summarize`）。`fresh` 且 `runOwned` 为空时返回 null，强制走 readiness → tools。

### 5.2 stopWhen 完成判定

| stopWhen | 含义 |
|----------|------|
| `observation_non_empty`（默认） | `toolObservations.length > 0`（含 EMPTY 列表） |
| `observation_has_fields` | 存在可汇总的非空 observation |
| `always` | 立即完成 |

### 5.3 推进结果

完成当前 tool 步后 `applyPlanAdvance()`：

| 下一步 | resultCheck 路由 | reason |
|--------|------------------|--------|
| `kind: summarize` 或 `reason` | **summarize** | `plan_advance_summarize` |
| `kind: tool` | llm | `plan_advance_tool_step` |
| 无 pending | summarize | `plan_complete` |

**评论分析典型路径（有数据）：**

```text
plan: [fetch(tool), analyze(summarize)]
  → llm: objective=fetch → tools: S02S1101 → observe
  → resultCheck: plan_advance_summarize → summarize（不再回 llm）
```

**mutation 典型路径（确定性模板）：**

```text
plan: [read_detail(tool), compose_write(tool), present(summarize), write(tool), confirm(summarize)]
  → tools: read-detail → resultCheck: plan_advance_tool_step → llm
  → llm（compose_write 拦截）: plan_compose_write observation → summarize（present）
  → summarize: plan_draft_reply + pendingToolCalls → tools → write_confirmation_gate
  → 用户 confirmWrite → worker 执行 write HTTP → confirm summarize
```

`compose_write` **不进 tools**（llm 节点拦截）；`present` **不调 write tool**；`write` 步若已有 `plan_draft_reply` / `plan_compose_write` 则 **复用参数**，不重新 LLM 产参。

勿将 Plan 排成 `read → summarize(draft) → write`（无 compose_write）：预览与执行参数会分叉。优先走路径 ② 模板或让外层 LLM 被 runtime 强制替换。

**EMPTY 终态（中断 plan）：**

```text
plan: [fetch(tool), analyze(summarize)]  （或多步 detail plan）
  → tools → 本轮 executionStatuses 均为 EMPTY
  → resolveTaskPlanAfterTools 返回 null（不 advance）
  → empty_tool_results → taskPlan=null → summarize
```

### 5.4 EMPTY 终态与 plan 中断

当 `shouldShortCircuitEmptyToSummarize()` 为 true（`empty_tool_results`）且存在 `taskPlan`：

1. `resolveTaskPlanAfterTools` 因 `isTerminalEmptyToolRound()` **不 advance**。
2. resultCheck 路由 summarize 时 **`taskPlan` 置 `null`**（`planAbortedEmpty: true`）。
3. 用已有 observations（含 EMPTY 列表）走 summarize。

缺必填参数、缺时间范围等 **不算** EMPTY 终态，不中断 plan，仍回 llm 重试。

### 5.5 Plan 步 toolRole 与 dedupe（多步 plan）

**P0 — LLM decision 收窄工具**

当 pending 首步 `kind === 'tool'` 且配置了 `toolRole` 时，`llm` 节点仅 bind / 展示匹配 role 的工具（`filterScopedToolsForPlanStep`）。无匹配 tool 时 fallback 全量 scoped tools。

当 pending 首步 `kind === 'summarize'` 或 `reason` 时（`isPendingPlanAnswerStep`）：

- **不再进入 decision LLM**：设 `pendingRespond` → `summarize` 节点（或经 readiness 放行后由 `llm` 检测 `plan_answer` 再设）。
- 兜底：`buildPlanSummarizeObservation()`（合并 observations，否则 `direct_user`）。

`plan_advance_summarize` 在 resultCheck 中**始终**进入 summarize（合并失败也有 `buildPlanSummarizeObservation` 兜底），不会被 expand 打断。

**P1 — dedupe 区分「错步重复」与「同步重复」**

`resolvePreToolsResultCheck` 传入 `taskPlan` + `scopedTools`：

| dedupe 场景 | 与当前步 toolRole | 路由 |
|-------------|-------------------|------|
| `duplicate_tool_call_round` / `all_tool_calls_duplicate` | 不符（如 detail 步又调 read-list） | **llm**（`duplicate_off_plan_step`） |
| 同上 | 符合（同步一步真卡住） | **summarize**（保留脱困） |
| 无 taskPlan / 当前步无 toolRole | — | 原 dedupe 行为 |

detail 典型路径：

```text
plan: list(tool) → detail(tool) → answer(summarize)
  → step1 成功 → plan_advance_tool_step → llm（仅 bind read-detail）
  → 若仍重复 read-list → duplicate_off_plan_step → llm
  → read-detail → plan_advance_summarize → summarize
```

---

## 6. ReAct Reason 的 Prompt 注入

`buildDecisionUserFrame()`（`task-plan.util.ts`）替代原 `buildPinnedUserRequestMessage()`。

### 6.1 有 taskPlan 时

**首轮（observationCount = 0）：**

```text
<user_intent>
Original request: …
Goal: …
Deliverable: analysis
</user_intent>

<current_objective>
Call the read-list tool once …
</current_objective>
```

**后续轮（observationCount > 0）：**

```text
<current_objective>
Use observations only. Perform analysis …
</current_objective>
```

不再每轮重复完整用户原话。

### 6.2 无 taskPlan 时（Plan 被 skip）

回退为 legacy：

```text
<current_user_request>…</current_user_request>
```

### 6.3 与其他块的组合顺序

`buildLlmInvokeMessages()` 消息顺序：

1. `<agent_prompt>` / working_memory  
2. `<observations>`（若有）  
3. `<tool_schema>`  
4. `<tool_decision>`（含 `<active_skill>` 若有）  
5. **user frame**（user_intent + current_objective）

Skill prompt 仍由 `buildDecisionPrompt()` 注入 `<active_skill>`，与 Plan 正交。

---

## 7. 可观测性

### 7.1 Run step：`type: plan`

```json
{
  "method": "llm | workflow | template | minimal",
  "llmFallbackReason": "mutation_template_forced | llm_plan_failed | outer_plan_llm_failed | null",
  "outerSkillSelectMethod": "page_host_unique | requested | outer_plan_llm | template | minimal",
  "autoSelectedSkillId": 12,
  "source": "llm | workflow | template | minimal",
  "deliverable": "answer",
  "goal": "…",
  "stepIds": ["requested-skill"],
  "pendingStepIds": ["requested-skill"],
  "currentStepId": "requested-skill",
  "currentObjective": "…",
  "taskPhase": "answer",
  "availableSkillIds": [12, 15],
  "availableHostToolNames": ["fillReplyDraft"],
  "hostToolRunStatus": "planned",
  "plannedHostToolStepIds": ["fill_draft"]
}
```

#### 外层 Skill 选型（开放对话）

```text
intent HTTP scopedTools  +  page scopedHostTools
        ↓
resolveSkillsForOuterPlan → availableSkillIds
        ↓
resolveAutoOuterPlanSkill（页 host 唯一绑定 → page_host_unique，跳过外层 Plan LLM）
        ↓ 否则
resolveOuterPlan（外层 Plan LLM 或 mutation 模板）
        ↓
applySkillFrameContext（内层 workflow + enrichPlanStepsWithHostTools）
```

`page_host_unique` 时外层 `deliverable` 由 `resolveOuterSkillPlanDeliverable` 决定（workflow 步序优先，默认 `answer`，**不**因 intent 收窄出 write tool 而强行 `mutation`）。

### 7.2 Run step：`type: result_check`

新增字段：

```json
{
  "planAdvanceRoute": "summarize | llm | null",
  "planAdvanceReason": "plan_advance_summarize | …",
  "taskPlanStep": "analyze"
}
```

### 7.3 LLM prompt debug

`meta.taskPlanStep`、`meta.taskPlanPhase`（decision 阶段 debug JSON）。

---

## 8. 边界与跳过

| 场景 | Plan 行为 |
|------|-----------|
| `enableToolCall=false` 或 `scopedTools=[]` | 写 skipped plan step，不建 taskPlan |
| `state.taskPlan` 已存在（续跑） | 跳过 plan 节点 |
| intent 直接 summarize（unsupported 等） | 不进入 plan |
| tool 步 ERROR 可恢复 | 不 advance，走原有 error → llm |
| **EMPTY 终态**（`empty_tool_results`） | **中断 plan**（`taskPlan=null`），直接 summarize |
| Plan tool 步 LLM 未产出 tool_calls | 不直接 summarize；`plan_tool_step_required` 回 llm；连续 2 次后 `plan_tool_step_exhausted` 中断 plan 并说明 |
| `deliverable` 与 scoped 工具不匹配 | `alignDeliverableWithScopedTools` 降级（如 detail 仅 read-list → list 模板） |
| dedupe 错步（`duplicate_off_plan_step`） | 不 summarize，回 llm；plan 不 advance |
| dedupe 同步重复 → summarize | **中断 plan**（`planAbortedDuplicate`） |
| plan tool 步 | llm 仅 bind 匹配 `toolRole` 的工具 |
| plan summarize/reason 步 | **跳过 decision LLM**，直接 summarize（`buildPlanSummarizeObservation`） |
| `plan_advance_summarize` | resultCheck **必进** summarize（合并观测失败也有兜底） |
| mutation 模板 | write 步 `toolRole` 按 scoped 中首个 write-* 角色选取 |
| expand_tools | 放宽 scopedTools 后 **重新 `resolveTaskPlan()`**（在 plan_advance summarize 之后不会触发） |
| 写确认暂停 | resumeContext 含完整 taskPlan + skill 元数据 |

---

## 9. 配置指南（运营 / Skill 作者）

### 9.1 最小配置（分析类 skill）

仅绑 read-list，在 `Skill.config` 加：

```json
{ "deliverable": "analysis" }
```

自动套用 `fetch → analyze(summarize)` 模板。

### 9.2 推荐配置（可定制 objective）

使用完整 `workflow`（见 §4.2 示例）。

### 9.3 Skill prompt 写法建议

- **prompt**：分析规则、输出格式、禁止编造。
- **不要**在 prompt 写「第 1 步必须 @工具名」—— fetch 由 Plan `fetch` 步 + `current_objective` 驱动。
- **description**：写好一句话，作为 Plan 的 `goal` 来源，并利于 skill 召回。

---

## 10. 源码索引

| 模块 | 路径 |
|------|------|
| 类型 | `src/core/agent-engine/engine/main/task-plan.types.ts` |
| 建 plan / advance / user frame | `src/core/agent-engine/engine/main/task-plan.util.ts` |
| **LLM Plan** | `src/core/agent-engine/engine/main/task-plan-llm.util.ts` |
| Plan 节点、graph 边、resultCheck 集成 | `agent-graph/nodes/plan.node.ts`、`agent-graph/build-agent-graph.ts`、`agent-graph/nodes/result-check.node.ts` |
| Plan prompt | `agent.plan` → `prompt-defaults.ts` |
| Graph state | `src/core/agent-engine/engine/main/agent-engine.types.ts` |
| 写确认续跑 | `src/modules/chat/pending-write-confirmation.types.ts` |
| `src/core/agent-engine/engine/agent-engine.service.ts` |
| Skill config 读取 | `src/core/skill/skill.service.ts`（hit 返回 `config` / `description`） |

---

## 11. 后续扩展

- Admin 表单编辑 `workflow` / `deliverable`（当前 `Skill.config` JSON 即可用）。
- Plan 完成后 shrink `<active_skill>` 为 reminder。
- `constraints` 从用户句抽取（租户配置或 Plan LLM 扩展字段）。

---

## 12. 与 Skill 文档关系

Skill 数据模型、scopedTools 交集选型、帧展开见 [skill-data-model.md](./skill-data-model.md)。  
Plan 节点在 **intent 之后**、**readiness/llm 之前** 运行；外层编排 skill 步，内层步序由 `resolveTaskPlan` 生成。Skill 选型见 [skill-data-model.md](./skill-data-model.md) 运行时一节。
