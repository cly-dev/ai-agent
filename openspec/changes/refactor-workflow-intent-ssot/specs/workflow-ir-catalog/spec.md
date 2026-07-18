## ADDED Requirements

### 需求:IR 为少而稳定的机器语言词表

系统必须维护六类 IR 节点目录（Trigger / Data / AI / Control / Action / System），type 总数必须 ≤ 30。系统禁止将垂直业务名（如 refund、seo、广告审核专用名）注册为 IR `type`。系统禁止将 `load_page_context`、`summarize_images`、`detect_clues`、`generate_and_push` 作为 IR `type`。

#### 场景:识图不进 IR type

- **当** Intent 声明图证据能力
- **那么** 编译结果必须使用 `llm`（或等价 AI 节点）并带 vision capability，不得出现 `summarize_images` type

#### 场景:页上下文非节点

- **当** 运行依赖 pageContext
- **那么** Runtime Context 必须自动注入；IR 不得包含 `load_page_context`

### 需求:统一 IR 节点协议

每个 IR 节点必须包含 `id`、`type`、`config`，并允许可选 `input`、`output`、`retry`、`timeoutMs`。Runtime 必须通过统一 `execute(node, context)` 路径调度（允许内部按 type 分发）。

#### 场景:节点可携带重试策略

- **当** 节点声明 `retry.maxAttempts`
- **那么** 执行层必须遵守该策略或显式拒绝（不得静默忽略已声明字段而不报错）

### 需求:Intent 到 IR 的编译边界

Admin 配置真源必须仍为 Intent；IR 必须仅作为编译快照与执行输入。`generate_and_push` 语义在编译后必须拆为生成类 AI 节点与 `host_effect` 或 `message_send`。

#### 场景:推送拆分

- **当** Intent `deliver.channel=fill`
- **那么** IR 必须包含 `host_effect`（可与前置 `llm` 组合），不得使用单一 `generate_and_push` type
