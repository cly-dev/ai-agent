# Workflow 动作节点类型（定稿）

本文档为 **V2 动作节点（`WorkflowActionKind`）的唯一来源**。  
实现、校验、B 端文档、Plan 编译器均以此为准。  
**配置心智 / 五层结构**（先读这个再拖画布）：[docs/b-end-workflow-node-structure.md](./docs/b-end-workflow-node-structure.md)。

---

## 原则

1. **一条 Workflow 可有任意多个节点**；节点类型是「每步可选的动作种类」，不是 flow 固定步数。
2. **动作 = 业务语义**，不是执行器名（`http_tool` / `llm` 等不暴露给配置者）。
3. **注册表可扩展**：未实现的动作可出现在目录中，但 `implemented: false` 时 **禁止保存进 Workflow**。
4. **无 Skill / 无 Workflow 时**：Chat 仍可由 Plan 模板/LLM 推断旧 `TaskPlanStep`，再 **编译** 为本表动作（见 §Plan 编译映射）；**不保证**推断出全部类型（尤其 `generate_and_push`、`summarize_images`）。
5. **`summarize_images` 仅画布 opt-in**：Plan LLM **不会**也不应推断出本节点；有图 URL ≠ 自动识图。见 [b-end-workflow-summarize-images.md](./docs/b-end-workflow-summarize-images.md) §Plan。

---

## 节点类型注册表（共 10 种）

| # | `action` | 中文名 | 业务语义 | 实现批次 | `page_action` | `chat_skill` |
|---|----------|--------|----------|----------|:-------------:|:------------:|
| 1 | `load_page_context` | 加载页上下文 | 消费 `pageContext` / 页内物化观测，不调 HTTP | A | ✅ | ✅ |
| 2 | `detect_clues` | 状态识别 | LLM 判定可配置状态是否成立；**一节点多状态、多选扇出**，供 `edges[]` 分支（展示名「状态识别」，协议名不变） | A | ✅ | ✅ |
| 3 | `fetch_data` | 获取数据 | 调用绑定的 HTTP Tool 拉取数据 | A | ✅ | ✅ |
| 4 | `summarize_images` | 图片识别 | 扫描上游/页上下文图片 URL，拼 IMAGE_PANEL 后多模态摘要（**显式 opt-in**） | A | ✅ | ✅ |
| 5 | `generate_and_push` | 生成并推送 | LLM 生成内容并通过 Host Tool 推到页面 | A | ✅ | ✅ |
| 6 | `summarize` | 说明总结 | 面向用户的文字说明或作答（含写后确认性总结） | A | ✅ | ✅ |
| 7 | `compose_mutation` | 组装变更参数 | 根据观测组装 HTTP 写操作参数（原 compose_write） | B | ❌ | ✅ |
| 8 | `present_mutation` | 展示变更草稿 | 向用户展示待提交的变更草稿（原 present） | B | ❌ | ✅ |
| 9 | `write_data` | 提交变更 | 调用 HTTP 写 Tool 执行变更 | B | ❌ | ✅ |
| 10 | `await_user_confirm` | 等待用户确认 | 暂停流程，等待用户确认后再继续 | B | ❌ | ✅ |

- **批次 A**：PR2 LangGraph + Page 接入优先实现。  
- **批次 B**：Chat mutation / 写确认链；目录已定义，保存时 `profile=page_action` 不得包含 B 类动作。

### 刻意不纳入目录（暂缓）

| 名称 | 原因 |
|------|------|
| `generate_text` | 与 `summarize` + `input.mode` 重叠；若需「仅内部中间稿」再用 `summarize` 的 `mode: draft` |
| `transform_data` | 边界不清，易与 executor 内逻辑重复 |
| `parallel` / 任意复杂 DAG | 真并行另案；当前扇出为串行多选，允许多个 `detect_clues` |

---

## 节点定义：`WorkflowNodeDef`

```typescript
type WorkflowActionKind =
  | 'load_page_context'
  | 'detect_clues'
  | 'fetch_data'
  | 'summarize_images'
  | 'generate_and_push'
  | 'summarize'
  | 'compose_mutation'
  | 'present_mutation'
  | 'write_data'
  | 'await_user_confirm';

type WorkflowEdgeKind = 'always' | 'clue' | 'default';

type WorkflowEdge = {
  id: string;
  from: string;
  to: string;
  kind?: WorkflowEdgeKind; // 缺省 always
  /** kind=clue：线索定义挂在边上（key + description） */
  clue?: { key: string; description: string };
};

type WorkflowNodeDef = {
  /** 节点 id，在一条 Workflow 内唯一，建议 snake_case */
  id: string;
  action: WorkflowActionKind;
  /** B 端展示名 */
  name: string;
  /** 本步目标，注入 LLM / 审计 */
  objective: string;
  input: WorkflowActionInput;
};

/** DB `nodes` Json 双形态：数组（遗留线性）或 { nodes, edges?, entryNodeId? } */
```

### 顶层 `edges[]`（可选）

- 无 `edges`：按 `nodes` 数组顺序合成 `always` 边（行为与线性一致）。
- 有 `edges`：由 `advance` 边驱动；`detect_clues` 出边仅为 `clue` / `default`。
- **状态识别**：每条 `clue` 边 = 一个可配置状态；可多选命中后串行扇出，零命中走 `default`。路由真源仅 `matched`；`value`/`reason` 供审计（及 Page fetch 可选补缺），**不替代**下游组参。
- B 端交互见 [b-end-workflow-detect-clues-edges.md](./docs/b-end-workflow-detect-clues-edges.md)。

---

## 各动作 `input` 契约

### 1. `load_page_context`

```typescript
{
  /** 默认 true：将 pageContext 写入本步 outputRef */
  materialize?: boolean;
}
```

- 无 `toolId` / `hostToolId`。  
- Sensor：页上下文或物化观测非空（可配置为 warn + skip 仅 Chat）。

### 1b. `detect_clues`（状态识别）

```typescript
{
  /** 可选判定口径（含互斥规则）；状态目录仍来自出边 clue.key + description */
  hint?: string;
}
```

输出（nodeOutputs）：

```typescript
{
  clues: Array<{
    key: string;
    matched: boolean;
    confidence: number; // 0..1
    value: string | null;
    reason: string;
  }>;
  matchedClueKeys: string[]; // 由 matched 派生
}
```

- **一节点多状态**：每条出边 `kind=clue` 即一个状态；默认可多选命中。
- 成功后：按命中目标集合 **串行**执行；未命中目标 `skipped`；零命中走 `default`。
- 互斥（如 spam vs 业务意图）用 `description` / `hint` 约束模型，第一期无独立 `matchMode`。
- **第一期拓扑**：状态 `to` 互异；各叶 `always` → 同一 `default.to`；`default.to` 不与任一状态 `to` 重叠。
- LLM 失败 → 节点 `failed`（不静默当零命中）。

### 1c. `summarize_images`（图片识别）

```typescript
{
  from?: 'upstream' | 'page_context' | 'all'; // 默认 upstream
  maxCells?: number;  // 1..6，默认 6
  cellPx?: number;    // 128..1024，默认 512
  hint?: string;
  onFailure?: 'degrade' | 'fail'; // 默认 degrade
  cacheTtlSec?: number; // 0..604800，默认 86400；0=禁用缓存
}
```

- **显式 opt-in**：画布无本节点则不识图。  
- 协议级扫描上游 / pageContext 中的图片 URL；拼 IMAGE_PANEL/v1 后调多模态模型。  
- 环境 catch：`ENABLE_IMAGE_PANEL_VISION=0` 或 sharp 缺失 → 默认 degrade（不拖垮流程）；未配节点不影响进程启动（sharp lazy-load）。  
- 单张拉图失败：格子 `fetch_failed`，不拖垮整节点（默认）。  
- B 端对接：[b-end-workflow-summarize-images.md](./docs/b-end-workflow-summarize-images.md)。

### 2. `fetch_data`

```typescript
{
  toolIds: number[];        // 必填：候选 HTTP Tool（≥1）；ReAct / Page 从中选择
  // toolId?: number;       // 遗留单绑，等价 toolIds:[toolId]
  completeWhen?: 'first_success' | 'fetch_all_pages';  // 默认 first_success
}
```

- Chat：候选进入 bindTools，由模型选一把。
- Page：单候选直执；多候选一轮 tool_call 选择后再 HTTP。

### 3. `generate_and_push`

```typescript
{
  hostToolIds: number[];    // 必填：候选 HostTool（≥1）；ReAct / Page 从中选择
  // hostToolId?: number;   // 遗留单绑，等价 hostToolIds:[hostToolId]
}
```

- Chat：节点白名单收窄 Host Tool 面。
- Page：单候选走 HostFill；多候选一轮选 tool + 组参后 instant flush。
- Sensor：`fillText` 非空且 `dslOutcome=dispatched`（`STREAM_EMPTY`）。
- 流式交付由 **HostTool 契约**（instant / fill_stream）+ 环境变量 `HOST_TOOL_STREAM` 决定；**已移除**节点级 `input.stream`。

### 4. `summarize`

```typescript
{
  mode?: 'brief' | 'detailed' | 'draft' | 'final';
  // draft：中间稿，不作为权威终稿 SSE
  // final：用户可见终稿（默认）
}
```

- 写 mutation 后的结果说明：用本 action + objective 描述，**不**单独设 `confirm` 类型。

### 5. `compose_mutation`

```typescript
{
  toolId: number;           // 写 Tool，须在 WorkflowTool 绑定内
}
```

- 对应 Plan `compose_write`；允许 LLM 产 tool_call 参数，不直接 HTTP 写。

### 6. `present_mutation`

```typescript
{
  mode?: 'brief' | 'detailed';  // 默认 brief
}
```

- 必须从上游 `compose_mutation` 的 outputRef 读取；禁止调用 write Tool（Harness 强制）。

### 7. `write_data`

```typescript
{
  toolId: number;
  /** 默认 true：使用 compose 步产出的参数 */
  useComposedArgs?: boolean;
}
```

### 8. `await_user_confirm`

```typescript
{
  /** 展示给用户的确认文案类型，可选 */
  confirmKind?: 'mutation' | 'generic';
}
```

- 运行时：节点 `running` → Graph 暂停 → L2 `session.awaitingWriteConfirmation` + GOA 快照 `workflowRun.currentNodeId`。  
- 用户确认后从**下一节点**继续。

---

## Profile 校验规则

| `Workflow.profile` | 允许保存的 action |
|------------------|-------------------|
| `page_action` | 仅批次 A（#1–6，含 `summarize_images`） |
| `chat_skill` | #1–10 全部（已实现批次须 `implemented: true`） |
| `shared` | 保存时按 **并集** 校验；运行时 Page 入口仍只能执行批次 A（#1–6） |

创建 Workflow 时 **`profile` 必选**（不设默认值）。

---

## 示例 Flow（说明：类型 8 种，步数任意）

> **B 端配置**：推荐使用 **Workflow Preset**（`preset` + `presetConfig`）一键展开为下述原子链，不必手拖每个节点。见 `v2/docs/frontend-workflow-config-guide.md` §2。

**页内自动回填（4 步）**

```text
load_page_context → fetch_data → generate_and_push → summarize
```

**仅页内填表（2 步）**

```text
load_page_context → generate_and_push
```

**Chat mutation（6 步）**

```text
fetch_data → compose_mutation → present_mutation → await_user_confirm → write_data → summarize
```

---

## Plan 编译映射

### A. 有 Workflow 资产（`workflow_db` / Skill.`workflowId`）— **以画布节点为准**

执行轴是 `workflowRun`（`execute_node`），**不是** Outer/Inner Plan LLM 重排节点。

| 方向 | 行为 |
|------|------|
| Workflow → Plan IR | `compileTaskPlanFromWorkflow`：`summarize_images` → `kind: workflow_inline` + `workflowAction: 'summarize_images'`（**不进 ReAct**） |
| `workflow_init` | `source=workflow_db` 时用资产 nodes **重编** `taskPlan` 镜像，避免仍沿用 Outer Plan 步序 |
| 进度 / SSE / GOA | 只信 `workflowRun.nodes`；`taskPlan` 仅为过渡双写 |

因此：**画布上配置了 `summarize_images`，运行就会按边执行该节点**；Plan 侧只做 IR 镜像（`workflow_inline`），不会另起一套识图规划。

### B. 无 Workflow 资产时 — Plan LLM 推断再 compile

**主路径：Plan LLM 推断** → `compilePlanToWorkflowRun(plan)` → `workflowRun`（`compiledFrom: plan_llm`）。  
确定性模板 / minimal 仅在 Plan LLM 失败或校验不通过时使用（`compiledFrom: template | minimal`）。

| 原 `TaskPlanStep` 模式 | 编译为 action |
|------------------------|---------------|
| page_context 仅 summarize | `load_page_context` → `summarize`（或合并为一步 `summarize`） |
| gather + read-detail/list | `fetch_data` |
| reason + host_tool（相邻） | `generate_and_push` |
| kind=summarize | `summarize` |
| compose_write | `compose_mutation` |
| present summarize | `present_mutation` |
| write tool | `write_data` |
| 写确认暂停（运行时） | 插入或映射 `await_user_confirm`（**不由 Plan LLM 自由推断**） |
| `kind: workflow_inline` + `workflowAction: summarize_images` | `summarize_images`（**仅往返/资产镜像**；LLM schema **不含**此 kind） |

**刻意不映射：** Plan LLM structured output 只允许 `tool` / `host_tool` / `summarize` / `reason`（外层另含 `skill`），**不会产出** `summarize_images`。要识图必须配 Skill Workflow 画布节点。

编译器产出 `WorkflowRunState`；L1 只信 `workflowRun`（见 `design.md` §三条硬约束）。

---

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-06-24 | 定稿 8 种 action；暂缓 generate_text / transform_data；批次 A/B |
| 2026-06-24 | 无显式 Workflow 资产时：Plan LLM 推断为主路径，compile → workflowRun |
| 2026-07-15 | 增加 `summarize_images`；Plan 侧 `workflow_inline` 镜像；明确 Plan LLM 不推断识图 |
| 2026-07-15 | 移除 `generate_and_push.input.stream` / Preset `pushStream`（改由 HostTool 契约 + `HOST_TOOL_STREAM`） |
