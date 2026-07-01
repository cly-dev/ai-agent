## ADDED Requirements

### 需求:PageAction 必须在配置 workflowId 时走 Workflow Runner
系统必须在 `PageAction.workflowId` 非空时，通过 `PageWorkflowRunner` 顺序执行 Workflow 节点，且不得仅执行单步 `executePageActionHostFill`（除非无 workflowId 的兼容模式）。

#### 场景:多步页内 Workflow（示例 4 步）
- **当** PageAction 引用含 `load_page_context`、`fetch_data`、`generate_and_push`、`summarize` 的 Workflow（步数 N 由配置决定）
- **那么** 单次 invoke 必须按 `nodes` 顺序执行 N 步，且 SSE 必须体现各节点进度

#### 场景:无 workflowId 兼容
- **当** PageAction 未配置 `workflowId`
- **那么** 系统必须保持现有单步 host fill 行为，且不得破坏现网 API

### 需求:PageAction 不得依赖 Chat Session 或 LangGraph 全图
系统执行 PageAction Workflow 时，不得创建 Session、不得进入 `intent`/`turnRoute` 节点，且不得写入 GOA `ActiveTask`。

#### 场景:PageAction invoke
- **当** C 端调用 `POST /page-action/invoke`
- **那么** 系统必须仅创建 `PageActionRun`，且必须在 runner 内完成 Workflow 全流程

### 需求:generate_and_push 必须复用 Host Fill 管道
系统执行 `generate_and_push` 时，必须复用 `runHostFillLlmStream` 与 Host Tool DSL 派发逻辑，且必须保持与现有 `host_action` SSE 兼容。

#### 场景:流式填表
- **当** 节点 `input.stream` 为 true（默认）
- **那么** 系统必须发送 `host_action` 流式事件，且 `generation` 必须与 `PageActionRun.generation` 一致

### 需求:fetch_data 必须调用已绑定 HTTP Tool
系统执行 `fetch_data` 时，必须使用节点 `input.toolId` 对应 Tool 执行 HTTP 调用，且必须将 observation 供后续节点使用。

#### 场景:拉取详情后生成
- **当** Workflow 第一步为 `fetch_data`、第二步为 `generate_and_push`
- **那么** 第二步 LLM 上下文必须能访问第一步 observation（经 runner 内存传递）

## MODIFIED Requirements

### 需求:PageAction systemPrompt 与 Workflow objective 的关系
系统必须将 PageAction `systemPrompt` 作为全局提示，将节点 `objective` 作为步骤级目标；合并规则必须在 runner 文档中固定。

#### 场景:步骤级 objective 注入
- **当** 执行 `generate_and_push`
- **那么** LLM 请求必须包含当前节点 `objective`（及 override 后文本）

## REMOVED Requirements

（无）
