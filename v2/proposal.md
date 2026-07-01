## 为什么

当前 Agent 平台在 **Skill `config.workflow`**、**Plan/`TaskPlanStep`**、**LangGraph ReAct 环**、**GOA `ActiveTask`** 之间缺少统一的业务编排层，导致：

- 同一业务流程（如「拉数 → 生成推送 → 说明总结」）在 Skill、PageAction 多处重复配置；
- 配置使用 `phase/kind/stopWhen` 等引擎方言，保存无校验，运行时可能静默 fallback 或 prune 步骤；
- 对外状态分散在 `taskPlan`、`stepProgress`、`AgentRunStep`（plan_sync/llm/tool）等多套模型，B 端与 C 端难以回答「当前在第几步」；
- 可靠性逻辑（空 fill、tool EMPTY、写确认、scope 收窄）散落在各 Graph 节点，缺少统一的 **Harness** 外壳。

需要一次 **V2 底子改造**：以可复用的 **Workflow 资产** + **动作节点** + **WorkflowRunState（L1）** + **Harness Engineering** 为核心，并 **改造 LangGraph 主轴**（非仅 PageAction 旁路），使 Chat 与 PageAction 共用同一套业务语义。

## 变更内容

- 新增 **Workflow** 数据资产（AppClient 级）：`Workflow`、`WorkflowRevision`、`WorkflowTool`、`WorkflowHostTool`；节点采用 **动作模型**（定稿 **8 种**，见 [workflow-action-kinds.md](./workflow-action-kinds.md)），非 `http_tool|host_tool|llm` 执行器枚举。
- **Skill** / **PageAction** 通过 `workflowId`（可选 `workflowVersion` pin、`workflowOverrides`）引用 Workflow，废弃在 `config` 内嵌整份 workflow 为长期方案。
- 引入 **`WorkflowRunState`（L1）** 作为产品/API/SSE/run 审计的唯一业务进度；`TaskPlanSnapshot` 降级为 Chat 过渡期的编译 IR（L3）。
- 引入 **`src/core/harness/`**：节点级 Hook / Sensor / Policy，统一空 fill、绑定校验、写确认闸门、trace；禁止静默 skip 而不审计。
- **改造 LangGraph**：主轴 `workflow_init → execute_node → workflow_advance`；ReAct（llm/resultCheck/tools）收入 `fetch_data` 等 executor 内部。
- **LangGraph 优先**：先改 Chat Graph 主轴；PageAction 后接同一 executors。
- **无 Workflow 资产时**：`orchestrated_task` 仍走 `workflowRun`；步序由 **Plan LLM 按用户意图推断** 并 compile 为 action 节点（模板仅 fallback）。
- **意图与 Workflow 冲突时**：保留 `skill-intent-alignment`（`clarify` / `intent_first`）、`pendingRespond` 澄清链、mutation 模板强制等现网逻辑；**契约优先于表内 Workflow 资产**。
- **不**在本变更中重写意图召回、smalltalk、Category Intent；其与 Workflow 正交，保留在 bootstrap 层。

## 功能 (Capabilities)

### 新增功能

- `workflow-asset`：Workflow 表结构、动作节点定义、保存期校验、版本与绑定。
- `workflow-action-registry`：8 种 action 目录、input 契约、profile 约束、Plan 编译映射（见 [workflow-action-kinds.md](./workflow-action-kinds.md)）。
- `workflow-run-state`：L1 运行态、节点状态机、run 快照与 SSE 事件契约。
- `harness-engineering`：Hook/Sensor/Policy 框架、trace、fail-fast（Page）与可扩展 degrade（Chat）。
- `page-action-workflow-runner`：PageAction invoke 走 Workflow + Harness（无 LangGraph session）。
- `langgraph-workflow-orchestration`：Chat Agent Graph 以 Workflow 为轴重组节点与 state。
- `admin-workflow-api`：B 端 Workflow CRUD、引用关系、run 详情按动作节点展示。

### 修改功能

- `skill-plan-workflow`：Skill 内层步序从 `config.workflow` 迁移为 `workflowId` 引用；`parseSkillPlanConfig` 只作 legacy 双读。
- `session-active-task`：GOA `ActiveTask` 以 `workflowRun` 为进度真相，`StoredTaskPlan` 逐步废弃。
- `page-action-run-audit`：run 记录 `workflowId`/`workflowVersion`/`workflowRun`，时间线对齐动作节点。

## 影响

- **数据库**：Prisma 新表与 `Skill`/`PageAction`/`PageActionRun` 字段扩展；迁移脚本。
- **核心模块**：新建 `src/core/workflow/`、`src/core/harness/`；大幅触及 `agent-graph/`、`plan/`、`session-goa-*`。
- **API**：新增 `/admin/workflow`；Skill/PageAction DTO 增 `workflowId`；PageAction SSE 增节点事件字段。
- **文档**：`docs/page-action-admin-run-frontend.md` 等需随 V2 契约更新（实现阶段）。
- **兼容性**：过渡期双读 `skill.config.workflow`、双写 `taskPlan`↔`workflowRun`；明确 PR 截止后移除 legacy 路径。
- **非目标（本提案）**：向量记忆、多 Agent 并行编排平台、可视化 Workflow 编辑器（可先 JSON）。

## 成功标准

- 配置一条 Workflow（步数任意，如页内 4 步：load → fetch → push → summarize）可被多个 PageAction/Skill 引用；
- PageAction invoke 的 SSE 与 run 详情按 **动作节点** 展示状态，无 `phase/kind` 外露；
- `STREAM_EMPTY` 等失败经 Harness Sensor 记录，Page 路径 fail-fast；
- Chat 路径在 PR4 完成后，`ActiveTask` 续跑以 `workflowRun.currentNodeId` 为准。
