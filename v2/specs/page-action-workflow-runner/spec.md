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
系统执行 `generate_and_push` 时，必须复用 PageAction Host Fill 执行器（`executePageActionHostFill` → `tool_call` → `host_action` instant flush）。B 端注册的 HostTool（`id > 0`）一律 structured instant，**不做** `arg.append` 逐字流式。

#### 场景:结构化推送到预览
- **当** 节点绑定 B 端 HostTool 且 LLM 产参成功
- **那么** 系统必须发送 `host_action`（`tool.flush`），且 `generation` 必须与 `PageActionRun.generation` 一致

### 需求:summarize 必须使用 prose 流（非 HostTool DSL）
系统执行 Workflow / PageAction 的 `summarize` 步骤时，必须使用 `page_action` SSE（`phase=stream` 增量 + `phase=completed` 定稿），**不得**经 `host_action` / 内置 `page_action.show_result` DSL。

#### 场景:总结流式输出
- **当** summarize 节点 `input.stream` 为 true（默认）且非 draft
- **那么** 系统必须发送 `page_action` 且 `phase=stream` 携带 prose 增量；定稿时 `fillText` 写入 run，`dslOutcome` 为 null

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
