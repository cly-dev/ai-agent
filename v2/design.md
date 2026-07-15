## 上下文

- 现有 Chat 走 LangGraph：`intent → turnRoute → plan → readiness → llm ⇄ resultCheck ⇄ tools → summarize`（`build-agent-graph.ts`）。
- Plan 步序来自 `skill.config.workflow` / 模板 / Plan LLM（`resolveTaskPlan`），校验弱，失败可静默降级。
- PageAction **不走 LangGraph**，单步 `executePageActionHostFill`（`page-action-host-fill.executor.ts`），已与 Chat 共用 `runHostFillLlmStream`。
- GOA `ActiveTask` 由 `StoredTaskPlan` 推导 `stepProgress`（`session-goa-projection.util.ts`）。
- 全库尚无 `workflowId` / `workflowRun` 字段，适合增量引入。

## 目标 / 非目标

**目标：**

- Workflow 为 AppClient 级可复用资产；节点为 **业务动作**，非执行器类型。
- L1 `WorkflowRunState` 对产品、SSE、B 端 run 详情权威。
- Harness 统一节点前后校验、失败策略、trace；配置期 fail-fast。
- LangGraph 主轴改为按 Workflow 节点推进；ReAct 内聚到 executor。
- **LangGraph + 批次 A executors 先于 PageAction** 打通；Page 复用同一 registry。

**非目标：**

- 不在 V2 第一个里程碑实现批次 **B** 的 executor（`compose_mutation` 等）；目录已定义，见 [workflow-action-kinds.md](./workflow-action-kinds.md)。
- 不在 V2 实现 Workflow 可视化 DAG 编辑器。
- 不替换 `ToolDecisionRole` 体系；`fetch_data` 以 `toolId` 精确绑定为主。
- 不强制本阶段补齐全量 golden eval CI（可作为 PR6 可选项）。

## 架构总览

```text
┌─────────────────────────────────────────────────────────────┐
│ Harness（src/core/harness）                                  │
│  before_node hooks · after_node sensors · policies · trace   │
├─────────────────────────────────────────────────────────────┤
│ Workflow Run（L1 WorkflowRunState）                            │
│  （多条节点，每步 action 见 workflow-action-kinds.md）      │
├─────────────────────────────────────────────────────────────┤
│ Executors                                                    │
│  fetch-data · generate-and-push · summarize                 │
├─────────────────────────────────────────────────────────────┤
│ Model + Tool Engine + Host Bridge                            │
└─────────────────────────────────────────────────────────────┘

Chat 入口: intent/turnRoute → workflow_init → [Harness+execute+advance]*
Page 入口: workflow_init → [Harness+execute+advance]* → END
Session(L2): resume · awaiting_confirmation · abandon（GOA）
Graph(L3): taskPlan IR（仅 fetch_data 内 ReAct，过渡期）
```

## 数据模型

### Workflow（配置）

```prisma
enum WorkflowProfile { chat_skill, page_action, shared }
enum WorkflowDeliverable { analysis, list, detail, mutation, answer }

model Workflow {
  id, appClientId, workflowKey, name, description?, goal?
  profile, deliverable, nodes Json  // WorkflowNodeDef[]
  version, constraints Json, isActive, sortOrder, timestamps
}

model WorkflowRevision { workflowId, version, nodes, deliverable, constraints, changeNote? }
model WorkflowTool { workflowId, toolId, isRequired }
model WorkflowHostTool { workflowId, hostToolId, isRequired }
```

### 引用与覆盖

```prisma
Skill:       workflowId?, workflowVersion?, workflowOverrides? Json
PageAction:  workflowId?, workflowVersion?, workflowOverrides? Json
PageActionRun: workflowId?, workflowVersion?, workflowRun Json
```

### WorkflowNodeDef（`nodes[]` JSON）

**动作类型定稿见 [workflow-action-kinds.md](./workflow-action-kinds.md)。** 摘要：

| 批次 | action |
|------|--------|
| A（首期实现） | `load_page_context`, `fetch_data`, `generate_and_push`, `summarize` |
| B（Chat mutation） | `compose_mutation`, `present_mutation`, `write_data`, `await_user_confirm` |

```typescript
type WorkflowActionKind =
  | 'load_page_context'
  | 'detect_clues'
  | 'fetch_data'
  | 'generate_and_push'
  | 'summarize'
  | 'compose_mutation'
  | 'present_mutation'
  | 'write_data'
  | 'await_user_confirm';

type WorkflowNodeDef = {
  id: string;
  action: WorkflowActionKind;
  name: string;
  objective: string;
  input: WorkflowActionInput; // 按 action 区分，见 workflow-action-kinds.md
};

/** 可选顶层边；缺省按 nodes[] 顺序合成 always */
type WorkflowEdge = {
  id: string;
  from: string;
  to: string;
  kind?: 'always' | 'clue' | 'default';
  clue?: { key: string; description: string };
};

type WorkflowDefinition = {
  workflowKey: string;
  name: string;
  profile: WorkflowProfile;
  goal?: string | null;
  constraints?: string[];
  nodes: WorkflowNodeDef[];
  edges?: WorkflowEdge[];
  entryNodeId?: string;
};

type WorkflowNodeStatus =
  | 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';
```

`Workflow.profile` **创建时必选**：

| profile | 允许保存的 action |
|---------|-------------------|
| `page_action` | 仅批次 A |
| `chat_skill` | A + B（已实现者） |
| `shared` | 保存按并集；Page 运行时仍只执行 A |

## WorkflowRunState（L1）

```typescript
type WorkflowRunState = {
  workflowId: number;
  version: number;
  currentNodeId: string | null;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  nodes: Array<{
    nodeId: string;
    action: WorkflowActionKind;
    name: string;
    status: WorkflowNodeStatus;
    startedAt?: string;
    finishedAt?: string;
    outputRef?: string;
    error?: { code: string; message: string };
  }>;
};
```

状态推进：`initWorkflowRun` → `startNode` → executor → `completeNode` | `failNode` → `advance` | `finalize`。

## Harness 设计

### 目录

```text
src/core/harness/
  harness.types.ts
  harness-context.util.ts
  harness-runner.ts
  hooks/   write-confirm.hook.ts, cancel.hook.ts
  sensors/ empty-fill.sensor.ts, tool-empty.sensor.ts, workflow-binding.sensor.ts
  policies/ fail-fast.policy.ts, degrade.policy.ts
  trace/   harness-trace.util.ts
```

### 执行包裹

```text
HarnessRunner.runNode():
  run before_node hooks
  → execute action executor
  → run after_node sensors
  → on fail: policy (fail-fast | retry | skip+audit)
  → emit harness + workflow_node trace
```

### v1 传感器映射

| 节点 | Sensor | Page Policy |
|------|--------|-------------|
| `load_page_context` | 页上下文/物化观测非空 | fail 或 Chat skip+trace |
| `fetch_data` | observation 非空 | fail |
| `generate_and_push` | fillText 非空、dslOutcome=dispatched | fail（STREAM_EMPTY） |
| `summarize` | 输出非空（可选） | fail 或 Chat brief 兜底 |
| B 类 mutation / confirm | 见 workflow-action-kinds.md | Chat only |

`skipped` 必须写 trace，禁止仅 warn。

## LangGraph 改造

### State 拆分（`AgentGraphState` 演进）

| 分区 | 层级 | 回答的问题 |
|------|------|------------|
| `workflowRun` | **L1** | 业务流到第几步？（对产品 / SSE / GOA 投影权威） |
| `session` | **L2** | 跨 turn、写确认、resume 怎么办？ |
| `scope` | — | 本轮能用哪些 Tool / HostTool / Skill？ |
| `execution` | **L3** | 当前节点内部 ReAct 到哪？（瞬态） |
| `taskPlan?` | 过渡 IR | 仅双写期由 adapter 生成，**禁止节点直写** |

目标结构（PR2 类型演进方向）：

```typescript
type AgentGraphState = {
  // —— Run 级横切（不属于四层业务分区）——
  steps: AgentRunStep[];
  status: AgentRunStatus;
  finished: boolean;
  finalOutput: string;
  intentKind: 'task' | 'smalltalk' | 'unclear';
  pendingRespond: PendingRespond | null;

  // —— L1 ——
  workflowRun: WorkflowRunState | null;

  // —— L2（Graph 内切片；完整快照在 GOA）——
  session: {
    awaitingWriteConfirmation?: boolean;
    confirmedPreviewSerialized?: string | null;
    planRunContext?: PlanRunContext;
    planAborted?: boolean;
  };

  // —— Scope ——
  scope: {
    scopedTools: AgentEngineTool[];
    scopedLangChainTools: DynamicStructuredTool[];
    scopedAllowedToolIds: number[];
    scopedToolBundle: BuiltLangChainTools | null;
    intentScopedToolsBundle: TurnScopedToolsBundle | null;
    toolProfilesByName: Record<string, ToolResponseProfile | null>;
    scopedHostTools?: HostToolDecisionDefinition[];
    scopedHostLangChainTools?: DynamicStructuredTool[];
    pageContext?: AgentChatPageContext | null;
    turnRoutingDecision?: TurnRoutingDecision | null;
    turnExecutionContract?: TurnExecutionContract | null;
    skill: {
      applied: boolean;
      id: number | null;
      prompt: string | null;
      name: string | null;
      description: string | null;
      config: unknown;
      riskLevel: ToolLevel | null;
    };
  };

  // —— L3（单步 executor 内；节点完成后应可清空）——
  execution: {
    iteration: number;
    pendingToolCalls: GraphToolCall[];
    lastToolRoundMeta: { ... } | null;
    pagedListHttpUsed?: number;
    hasExpandedOnce: boolean;
    /** 本 run 新增观测；节点完成后归档到 node outputRef */
    toolObservations: ToolObservation[];
    preloadedToolObservations?: ToolObservation[];
  };

  /** @deprecated 双写期只读；由 workflow-plan-sync.util 单点写入 */
  taskPlan?: TaskPlanSnapshot | null;
};
```

### 现字段 → 新分区归属表

| 现 `AgentGraphState` 字段 | V2 分区 | 备注 |
|---------------------------|---------|------|
| `workflowRun`（新增） | L1 `workflowRun` | 权威进度 |
| `taskPlan` | 过渡 `taskPlan?` | adapter 推导，deprecated |
| `awaitingWriteConfirmation` | L2 `session` | |
| `confirmedPreviewSerialized` | L2 `session` | |
| `planRunContext` | L2 `session` | fresh / resume |
| `planAborted` | L2 `session` | |
| `scopedTools` / `scopedLangChainTools` / `scopedToolBundle` / `scopedAllowedToolIds` | `scope` | |
| `intentScopedToolsBundle` | `scope` | |
| `toolProfilesByName` | `scope` | |
| `scopedHostTools` / `scopedHostLangChainTools` | `scope` | |
| `pageContext` | `scope` | |
| `turnRoutingDecision` | `scope` | |
| `turnExecutionContract` | `scope` | |
| `skillApplied` + `activeSkill*` | `scope.skill` | 收成嵌套对象 |
| `iteration` | L3 `execution` | |
| `pendingToolCalls` | L3 `execution` | |
| `lastToolRoundMeta` | L3 `execution` | |
| `pagedListHttpUsed` | L3 `execution` | |
| `hasExpandedOnce` | L3 `execution` | |
| `toolObservations` | L3 `execution` | 节点间用 `outputRef` 传递 |
| `preloadedToolObservations` | L3 `execution` | GOA / 写确认预载 |
| `steps` | Run 横切 | 审计日志（含 harness trace） |
| `status` / `finished` / `finalOutput` | Run 横切 | 整次 run 结局 |
| `intentKind` / `pendingRespond` | Run 横切 | workflow 之前的回合语义 |

**GOA（DB）与 Graph `session` 边界：**

| 存储 | 权威内容 |
|------|----------|
| GOA `ActiveTask.workflowRun` | 跨 turn 的 L1 快照（PR4 落地） |
| Graph `session` | 本轮 resume / 写确认需要的切片 |
| Graph `workflowRun` | 本轮运行中的 L1 工作副本 |

规则：**resume 时从 GOA 灌入 `workflowRun`，不得从 `StoredTaskPlan` 重建步序。**

### 节点间数据传递（`outputRef`）

禁止靠顶层 `toolObservations` 无限增长来推断「上一步完成了什么」。

```text
fetch_data 完成
  → 将本轮相关 observation 归档
  → workflowRun.nodes[i].outputRef = "obs:step_fetch:0"（或 artifact id）
generate_and_push 读取
  → 按 outputRef 解析上步产出，注入 LLM / Host 上下文
```

实现可选：`execution.nodeOutputs: Record<nodeId, unknown>` 作为 run 内 store，`outputRef` 指向 store 内键名。

### 三条硬约束（PR2 必须遵守）

1. **L1 只信 `workflowRun`**  
   产品进度、SSE `workflow_node_*`、GOA `stepProgress` 投影（PR4）一律读 `workflowRun`；禁止用 `taskPlan.pendingStepIds` 或 `AgentRunStep.type=plan_sync` 作为用户可见「第几步」。

2. **节点间数据用 `outputRef`，不靠顶层 observation 猜进度**  
   `execution.toolObservations` 仅服务当前节点 ReAct；节点 `succeeded` 时必须归档并写 `outputRef`；下一步 executor 只读上游 `outputRef`。

3. **`taskPlan` 只读、单点双写**  
   仅 `workflow-plan-sync.util.ts` 可从 `workflowRun` 推导并更新 `taskPlan`；任何 graph node / executor **禁止直写** `taskPlan`。双写不一致时打 error 日志。

Harness trace 写入 `steps[]`（`type: harness` / `type: workflow`），**不**单独增加 `harnessState` 分区。

### 节点变更

| 现节点 | V2 |
|--------|-----|
| `plan` | `workflow_init`（load DB / legacy compile / resume） |
| `readiness` | 并入 `execute_node` 前置 |
| `llm`/`resultCheck`/`tools` 顶层环 | `fetch_data` executor 内部 |
| `summarize` | 仅 `action=summarize` 或 smalltalk |
| 新增 | `execute_node`、`workflow_advance` |

### 边（Chat）

```text
START → intent → turnRoute → workflow_init → execute_node → workflow_advance
  → execute_node | finalize → END
（await_user_confirm：Workflow 节点 + L2 session 暂停）
```

### workflow_init 解析优先级

**原则：Workflow 资产（DB）与 Workflow 运行时（`workflowRun`）分离。**

- 有显式 `workflowId` → 加载资产。
- **无显式资产** → 仍必须有 `workflowRun`；步序由 **Plan LLM 根据用户意图推断**，再 compile 为 action 节点（ephemeral workflow）。
- 确定性模板 / minimal 仅为 **Plan LLM 失败或校验不通过时的 fallback**，不是无 Skill 时的默认首选路径。

`orchestrated_task` 且未走 `direct_answer` / smalltalk 短路时，`workflow_init` 按以下优先级解析：

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 | **Resume** | GOA / session 未完成 `workflowRun` → 原样恢复 `currentNodeId`，**不重新 Plan LLM** |
| 2 | **显式资产** | `Skill.workflowId` / `PageAction.workflowId`（及未来可选 `Agent.defaultWorkflowId`）→ DB load + `workflowOverrides` |
| 3 | **Legacy 内嵌** | `skill.config.workflow` → compile 为 `WorkflowRunState`（双读过渡期，deprecate 日志） |
| 4 | **Plan LLM 推断** ★ | 无上述来源时：**调用 Outer/Inner Plan LLM**（沿用 `resolveOuterPlan` / `resolveTaskPlan`），根据 `userMessage` + scoped tools + 可选 skills 产出 plan → `compilePlanToWorkflowRun(plan)` |
| 5 | **确定性模板** | Plan LLM 不可用或输出不合规时：mutation 强制模板、`buildTemplateSteps`（list/detail/analysis 等） |
| 6 | **minimal** | 单节点 `summarize`（或 `load_page_context` → `summarize`，按 page_context policy） |

Plan LLM 推断路径（优先级 4）要点：

```text
userMessage + scopedTools (+ availableSkills 摘要)
  → Plan LLM（structured output: deliverable + steps）
  → 校验 / normalize（scoped roles、host_tool 裁剪、mutation 合规）
  → compilePlanToWorkflowRun(plan)   // TaskPlanStep[] → WorkflowNodeDef[]
  → initWorkflowRun({ compiledFrom: 'plan_llm', ... })
  → execute_node 主轴（与显式资产相同）
```

Run 快照必须记录 `workflowRun.compiledFrom`（建议枚举：`workflow_db` | `plan_llm` | `template` | `minimal` | `resume` | `legacy_config`），便于 B 端区分「表资产」与「本 turn 推断」。

**与 Skill 的关系：** 未选 Skill 不等于跳过 Plan LLM；`skillSelect=llm` 时 Outer Plan LLM 为默认步序来源。显式 Skill + `workflowId` 表示产品化、可复用的推断结果，而非「只有选了 Skill 才能编排」。

**Fallback 边界（仍须遵守）：**

| 情况 | 行为 |
|------|------|
| scoped 含 write 且 LLM 产出非合规 mutation 步序 | 替换为确定性 mutation 模板（安全优先，非否定 Plan LLM 主路径） |
| Plan LLM 调用失败 | `buildTemplateSteps` / minimal |
| 编译后含未实现 action | fail-fast 或降级到可执行子集 + audit trace |

实现落点：`workflow-init.node.ts` 承接原 `plan.node` 职责；新增 `compile-plan-to-workflow.util.ts`（与 `legacy/compile-task-plan.util.ts` 反向）。

### 用户意图 vs Workflow 冲突（继承现网，Workflow 不得绕过）

**V2 不取消 `turnRoute` / `TurnExecutionContract` / `skill-intent-alignment` 层。**  
显式 Workflow 资产与 Plan LLM 推断均发生在 **契约通过之后**；用户意图与 Skill/Workflow 冲突时，必须保留现有澄清与默认执行逻辑。

#### 执行顺序（Chat）

```text
intent → turnRoute → buildTurnExecutionContract
  ├─ terminalRespond（澄清 / off_domain）→ summarize → END（不进入 workflow_init）
  ├─ plan.enabled=false → 同上
  └─ plan.enabled=true → workflow_init → execute_node → …
```

#### 写通道（`writeChannel`）与 Skill 执行通道

Route LLM 输出 **`writeChannel`**（`none` | `http` | `host`），与读路径 `pageContextApplies` / `pageContextTaskKind` 正交：

| channel | 含义 | 典型场景 |
|---------|------|----------|
| `none` | 无写意图 | 只读分析、闲聊、纯编排读数 |
| `http` | HTTP Tool 变更（API submit/reply/remark） | 显式 Skill + mutation Workflow |
| `host` | Host / 浏览器写（fill draft、sync UI） | `on_page_task` + HostTools |

**派生规则：**

- `hostMutationIntent` 已废弃为派生字段：`llmWriteChannel === 'host'`（供 host_tool policy 与审计兼容）。
- 显式 Skill 选中时，从绑定的 Workflow `nodes` + `deliverable` 推导 `SkillExecutionChannels`（`httpRead` / `httpMutation` / `hostPush` / `primaryWriteChannel`），在 route LLM **之前**加载并传入 payload。
- `finalizeTurnWriteChannel`：当 LLM 误判 `host` 且 Skill 为 http-only 或 `primaryWriteChannel=http`（mutation Workflow）时，锚定为 `http` 并校正 `route→orchestrated_task`。

**对齐矩阵（`skill-intent-alignment`）** 使用 `effectiveWriteChannel`（锚定后）× `profile.channels`，不再把 HTTP mutation 与 Host 写混为同一 `hostMutationIntent`。

`route_plan` 步骤输出：`llmWriteChannel`（LLM draft）、`effectiveWriteChannel`（锚定后）、`skillChannelAnchored`、`skillExecutionChannels`。

`workflow_init` **不得**在 `alignment.status=clarify` 或 `plan.enabled=false` 时仍加载 DB Workflow 或强行走固定节点。

#### Skill × 用户意图冲突（`skill-intent-alignment.util.ts`）

沿用 `resolveSkillIntentAlignment` 与 `Skill.config.intentMismatchPolicy` 覆盖：

| 默认策略 | mismatch code | 行为 |
|----------|---------------|------|
| `clarify` | `write_intent_vs_http_only_skill`、`write_intent_vs_no_host_skill` | `terminalRespond`（`skill_intent_mismatch`）→ summarize 澄清文案 → **本 turn 结束，不 init workflow** |
| `intent_first` | `read_intent_vs_*`、`direct_answer_vs_any_skill`、`orchestrated_http_vs_host_only_skill` 等 | **忽略显式 Skill 选择**（`skillSelect→llm`），**不加载 `Skill.workflowId`**，改走 Plan LLM 推断（上表优先级 4） |

`intent_first` 时：`shouldEnforceRequestedSkillFromContract` 为 false，内层帧不按所选 Skill 收窄；与现 `plan.node` + `resolvePlanFromContract` 行为一致。

#### Plan LLM 与确定性模板冲突

沿用 `shouldReplacePlanWithMutationTemplate` / `shouldUseDeterministicMutationPlan`：

- scoped 含 write 且 Plan LLM 产出 **非合规 mutation 步序** → **强制替换**为确定性 mutation 模板，再 compile 为 WorkflowRun（非让用户走错误 LLM 步序）。
- 外层 Plan 含 `kind=skill` 复合步时，不强行套 mutation 模板（与现网相同）。

#### 其他须保留的回合级逻辑

| 机制 | V2 落点 | 说明 |
|------|---------|------|
| `pendingRespond` / `turnRespond` | `intent` / `readiness` 前置；`shouldRouteToRespond` | 意图不清、unsupported、observation 驱动澄清 → 直达 summarize，不进 workflow |
| `direct_answer` | `turnRoute` + contract `plan.enabled=false` | 不创建 `WorkflowRunState` |
| `abandonActiveTaskOnFreshPlan` | `workflow_init` 开头（原 `plan.node`） | 新 turn 重新 init 前放弃 GOA 未完成 activeTask |
| `pageContext` 执行策略 | `scope` + compile 时合并/跳过 gather | 页上下文可答则少拉数；映射为 `load_page_context` 或跳过 `fetch_data` |
| 写确认 | `await_user_confirm` + L2 `session` | 不因绑了 Workflow 而跳过确认闸门 |
| 工具终态 EMPTY | Harness sensor + `isTerminalEmptyToolRound` | 中断当前节点 / workflow，非静默 advance |
| Runtime 步序校验 | `validateWorkflowAgainstScope`（新增，对标 `validatePlanStepsAgainstScoped`） | 显式 Workflow 节点引用 tool 不在本轮 scope → **fallback Plan LLM 或 template**，并 audit；不得硬跑 |

#### 显式 Workflow 与 Plan LLM 的优先级（有契约前提下）

```text
1. intent_first / clarify 已处理（见上）→ 可能已无显式 workflow 可用
2. aligned + workflowId 且 runtime 校验通过 → load DB
3. aligned + workflowId 但 runtime 校验失败 → Plan LLM（或 template fallback）
4. 无 workflowId → Plan LLM 主路径
```

**原则：用户意图与回合契约优先于表内 Workflow 资产；Workflow 是「怎么编排」，不能覆盖「该不该编排、该不该用所选 Skill」。**

### PageAction

不进入完整 Chat Graph；`PageWorkflowRunner` 调用同一套 `workflow-run` + `harness-runner` + executors。

## Plan ↔ Workflow 编译（过渡期）

### Plan LLM → WorkflowRun（无显式资产时的主路径）

`compilePlanToWorkflowRun(plan)`：`TaskPlanSnapshot` → `WorkflowNodeDef[]` → `initWorkflowRun`。

| 原 `TaskPlanStep` 模式 | 编译为 action |
|------------------------|---------------|
| page_context 仅 summarize | `load_page_context` → `summarize`（或合并为一步 `summarize`） |
| gather + read-detail/list | `fetch_data` |
| reason + host_tool（相邻） | `generate_and_push` |
| kind=summarize | `summarize` |
| compose_write | `compose_mutation` |
| present summarize | `present_mutation` |
| write tool | `write_data` |
| 写确认暂停（运行时） | 插入 `await_user_confirm`（**不由 Plan LLM 自由推断**；mutation 模板或 runtime 插入） |
| `workflow_inline` + `summarize_images` | `summarize_images`（**仅资产镜像往返**；Plan LLM schema 不含此 kind） |

编译器产出 `WorkflowRunState`；L1 只信 `workflowRun`（见上文 §三条硬约束）。  
**`summarize_images` 不由 Plan LLM 规划**——须画布 opt-in；详见 `workflow-action-kinds.md` §Plan 与 `docs/b-end-workflow-summarize-images.md` §11。

### Workflow → TaskPlan（双写过渡期，executor 未全覆盖时）

`compileTaskPlanFromWorkflow(nodes)` 仅供 Chat 未改完的 executor 反向 IR 使用：

| Workflow action | TaskPlanStep（IR） |
|-----------------|-------------------|
| fetch_data | kind: tool + toolRole |
| load_page_context | 单步或 summarize 前奏（编译策略） |
| summarize_images | kind: `workflow_inline` + `workflowAction: summarize_images`（不进 ReAct） |
| generate_and_push | kind: reason + host_tool（合并） |
| summarize / present_mutation | kind: summarize（按 action 区分 harness） |
| compose_mutation | compose_write |
| write_data | write tool |
| await_user_confirm | kind: `workflow_gate`（运行时闸门） |
| detect_clues | 无 Plan 步（仅 workflow 执行轴） |

**禁止**将 TaskPlanStep 作为 B 端配置 schema。

## 决策

1. **动作节点而非执行器节点** — 配置者看到「获取数据 / 生成推送 / 总结」，执行器内聚多步。
2. **Workflow 表 + Revision** — 配置变更可追溯；run pin `workflowVersion`。
3. **Page 先 fail-fast** — 不做静默 fallback；Chat degrade 二期。
4. **Harness 与 Workflow 并列** — 可靠性不进 `nodes` JSON，进 Harness 注册表。
5. **同构图异入口** — Page 省略 intent/turnRoute；**executor 与 HarnessRunner 由 LangGraph 路径先落地**，PageAction 后接同一套内核。

6. **LangGraph 优先** — V2 底子以 Chat Graph 主轴改造为第一里程碑；不先建独立的 Page-only Runner 分叉。

7. **无资产时 Plan LLM 推断** — 无显式 Workflow 表记录时，`workflow_init` 必须由 Plan LLM 根据用户意图生成 plan 并 compile 为 `workflowRun`；模板仅作 fallback，不得作为无 Skill 场景的默认步序来源。

8. **意图冲突优先于 Workflow 资产** — `turnExecutionContract` / `skill-intent-alignment` / `pendingRespond` 澄清链必须在 `workflow_init` 之前生效；`clarify` 不得 init workflow；`intent_first` 必须忽略显式 `workflowId` 改走 Plan LLM；mutation 非合规步序仍强制确定性模板。

## 重构防跑偏（合规检查）

> 担心「改完 LangGraph 反而更乱」是合理的。下列条目是 **PR2 合入前必须满足的 design compliance**；任一违反即视为不符合 V2 设计。

### 典型跑偏模式（禁止）

| 反模式 | 为什么违背设计 | 正确做法 |
|--------|------------------|----------|
| `workflowId` 存在就跳过 `turnRoute` / alignment | 意图冲突优先于资产 | 契约通过后才 `workflow_init` |
| 顶层仍保留 `llm⇄tools` 当业务步进 | ReAct 应内聚 executor | 仅 `fetch_data` executor 内部 ReAct |
| `plan.node` 与 `workflow_init` 双写步序 | 两个权威 | `plan` 委托或删除；步序只出自 `workflow_init` |
| executor / advance 直写 `taskPlan` | 违反单点双写 | 仅 `workflow-plan-sync.util.ts` |
| 用 `taskPlan.pendingStepIds` 驱动画边 | L1 应只信 `workflowRun` | `workflow_advance` 读 `workflowRun` |
| 无 Skill 时默认 template、不调 Plan LLM | 与定稿原则冲突 | 先 `tryBuildOuterPlanViaLlm`，失败再 fallback |
| Page 单独一套 executor / Harness | 双轨编排 | 同一 `executor-registry` |
| 静默 skip 节点不写 trace | Harness 要求 | `skipped` + audit |
| Resume 从 `StoredTaskPlan` 重建步序 | GOA 边界错误 | 只灌 `ActiveTask.workflowRun` |

### 合入前自检（建议 PR2 checklist）

**图结构**

- [ ] `orchestrated_task` 主环仅为 `workflow_init → execute_node → workflow_advance`
- [ ] `direct_answer` / `smalltalk` / `terminalRespond` 不创建 `workflowRun`
- [ ] `resumeFromWriteConfirm` 恢复 `workflowRun.currentNodeId`，不重新 Plan LLM

**步序来源**

- [ ] 无资产：Plan LLM → compile（`compiledFrom=plan_llm`）
- [ ] `intent_first`：不 load `Skill.workflowId`
- [ ] `clarify`：不进入 `workflow_init`
- [ ] mutation 非合规：强制模板后再 compile

**状态**

- [ ] 产品可见进度只读 `workflowRun.nodes`
- [ ] 节点间数据走 `outputRef`，不靠顶层 observation 堆叠推断
- [ ] `taskPlan` 若有，仅 sync 模块写入

**行为不回退（现网 parity）**

- [ ] skill mismatch clarify 文案与路径一致
- [ ] `abandonActiveTaskOnFreshPlan` 仍生效
- [ ] 写确认闸门仍暂停 Graph
- [ ] EMPTY tool 轮次仍中断而非假成功 advance

### 安全落地顺序（降低「改崩」概率）

```text
PR0  纯类型 + workflow-run 状态机 + validate（无 Graph 改动）
PR1  落表 + Admin（仍走旧 Graph）
PR2a executors + HarnessRunner（单测 / 本地直调，不接 Graph）
PR2b workflow_init + advance 接 Graph，feature flag：WORKFLOW_GRAPH_AXIS=0|1
PR2c 双写 taskPlan，默认 flag=0；灰度 flag=1
PR3  Page 接同一 registry
PR4  GOA workflowRun
PR5  删旧环（flag 默认 1，移除 plan 权威）
```

**关键：PR2 不要一步删掉旧 `llm/tools/resultCheck` 顶环**；flag=0 时走现网，flag=1 走新轴，对比同一 fixture 的 run 快照（`workflowRun`、`steps`、最终输出）。

### 单测 / 回归建议（实现阶段）

| 夹具场景 | 断言 |
|----------|------|
| 无 Skill + orchestrated | `compiledFrom=plan_llm`，节点数与 plan 编译一致 |
| 选 Skill + workflowId + aligned | load DB，`workflowId` 与 revision 正确 |
| write vs http skill | `clarify`，无 `workflowRun` |
| read vs host-only skill | `intent_first`，`compiledFrom=plan_llm`，非 DB load |
| mutation + 非合规 LLM plan | 模板替换后 compile |
| resume 未完成 workflow | `currentNodeId` 连续，不重新 init |
| 仅 summarize minimal | 单节点，无顶层 tools 环 |

（单测是否落地按仓库策略；上表为 PR2 评审最低期望。）

## 风险 / 权衡

| 风险 | 缓解 |
|------|------|
| LangGraph 改动面大 | 分 PR；PR2 专做 Graph + executors；PR3 Page 接同一 executors |
| 双写期事件重复 | SSE 字段版本化；文档标明废弃 plan_sync 展示 |
| GOA resume 回归 | PR4 专 PR；replay util 单测（用户要求时） |
| 迁移存量 skill.config.workflow | legacy 导入脚本 + 双读窗口 |

## 实施阶段（与 tasks.md 对齐）

| 阶段 | 交付 |
|------|------|
| PR0 | `core/workflow` + `core/harness` 类型与状态机、校验 |
| PR1 | Prisma + Admin Workflow API（`workflow_init` 可 load DB） |
| PR2 | **Executors + LangGraph 改造**；`WORKFLOW_GRAPH_AXIS` 灰度；验收 **tasks.md §8.A–8.E** |
| PR3 | PageAction 接入同一 executors（薄入口，无独立编排分叉） |
| PR4 | GOA activeTask.workflowRun |
| PR5 | 移除 legacy 权威路径 |
| PR6 | Golden workflow eval（可选） |

## 待定问题

- [x] 动作节点类型 → 见 [workflow-action-kinds.md](./workflow-action-kinds.md)（8 种定稿）
- [x] 无显式 Workflow 资产时步序来源 → Plan LLM 推断 + compile（模板仅 fallback）
- [x] 用户意图与 Workflow 冲突 → 保留 `skill-intent-alignment` 澄清 / `intent_first` / mutation 模板强制等现网逻辑
- [ ] `workflowKey` 命名规范是否强制 `{domain}.{action}`？
- [ ] 新 Workflow `profile` 已定为创建时必选
- [ ] Chat `summarize` 失败是否允许 brief 兜底文案？
- [ ] B 端是否需要在 V2 首版提供「从 Skill 导入 workflow」按钮？
