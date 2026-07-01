# Workflow 动作节点类型（定稿）

本文档为 **V2 动作节点（`WorkflowActionKind`）的唯一来源**。  
实现、校验、B 端文档、Plan 编译器均以此为准。

---

## 原则

1. **一条 Workflow 可有任意多个节点**；节点类型是「每步可选的动作种类」，不是 flow 固定步数。
2. **动作 = 业务语义**，不是执行器名（`http_tool` / `llm` 等不暴露给配置者）。
3. **注册表可扩展**：未实现的动作可出现在目录中，但 `implemented: false` 时 **禁止保存进 Workflow**。
4. **无 Skill / 无 Workflow 时**：Chat 仍可由 Plan 模板/LLM 推断旧 `TaskPlanStep`，再 **编译** 为本表动作（见 §Plan 编译映射）；**不保证**推断出全部类型（尤其 `generate_and_push`）。

---

## 节点类型注册表（共 8 种，V2 首期目录）

| # | `action` | 中文名 | 业务语义 | 实现批次 | `page_action` | `chat_skill` |
|---|----------|--------|----------|----------|:-------------:|:------------:|
| 1 | `load_page_context` | 加载页上下文 | 消费 `pageContext` / 页内物化观测，不调 HTTP | A | ✅ | ✅ |
| 2 | `fetch_data` | 获取数据 | 调用绑定的 HTTP Tool 拉取数据 | A | ✅ | ✅ |
| 3 | `generate_and_push` | 生成并推送 | LLM 生成内容并通过 Host Tool 推到页面 | A | ✅ | ✅ |
| 4 | `summarize` | 说明总结 | 面向用户的文字说明或作答（含写后确认性总结） | A | ✅ | ✅ |
| 5 | `compose_mutation` | 组装变更参数 | 根据观测组装 HTTP 写操作参数（原 compose_write） | B | ❌ | ✅ |
| 6 | `present_mutation` | 展示变更草稿 | 向用户展示待提交的变更草稿（原 present） | B | ❌ | ✅ |
| 7 | `write_data` | 提交变更 | 调用 HTTP 写 Tool 执行变更 | B | ❌ | ✅ |
| 8 | `await_user_confirm` | 等待用户确认 | 暂停流程，等待用户确认后再继续 | B | ❌ | ✅ |

- **批次 A**：PR2 LangGraph + Page 接入优先实现。  
- **批次 B**：Chat mutation / 写确认链；目录已定义，保存时 `profile=page_action` 不得包含 B 类动作。

### 刻意不纳入目录（暂缓）

| 名称 | 原因 |
|------|------|
| `generate_text` | 与 `summarize` + `input.mode` 重叠；若需「仅内部中间稿」再用 `summarize` 的 `mode: draft` |
| `transform_data` | 边界不清，易与 executor 内逻辑重复 |
| `branch` / `parallel` | 远期；V2 仅线性 Workflow |

---

## 节点定义：`WorkflowNodeDef`

```typescript
type WorkflowActionKind =
  | 'load_page_context'
  | 'fetch_data'
  | 'generate_and_push'
  | 'summarize'
  | 'compose_mutation'
  | 'present_mutation'
  | 'write_data'
  | 'await_user_confirm';

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

type WorkflowNodeStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'skipped';
```

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

### 2. `fetch_data`

```typescript
{
  toolId: number;           // 必填：B 端/前端在节点上直接绑 HTTP Tool ID
  completeWhen?: 'first_success' | 'fetch_all_pages';  // 默认 first_success
}
```

- 内部可含 ReAct（llm → tools → resultCheck），对外仍是一步。

### 3. `generate_and_push`

```typescript
{
  hostToolId: number;       // 必填：B 端/前端在节点上直接绑 HostTool ID
  stream?: boolean;         // 默认 true
}
```

- Sensor：`fillText` 非空且 `dslOutcome=dispatched`（`STREAM_EMPTY`）。

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
| `page_action` | 仅 #1–4（批次 A） |
| `chat_skill` | #1–8 全部（已实现批次须 `implemented: true`） |
| `shared` | 保存时按 **并集** 校验；运行时 Page 入口仍只能执行 #1–4 |

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

## Plan 编译映射（无 Workflow 资产时）

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

编译器产出 `WorkflowRunState`；L1 只信 `workflowRun`（见 `design.md` §三条硬约束）。

---

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-06-24 | 定稿 8 种 action；暂缓 generate_text / transform_data；批次 A/B |
| 2026-06-24 | 无显式 Workflow 资产时：Plan LLM 推断为主路径，compile → workflowRun |
