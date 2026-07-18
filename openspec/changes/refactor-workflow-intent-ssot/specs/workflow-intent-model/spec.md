## ADDED Requirements

### 需求:Intent 为 Workflow 配置唯一真源

系统必须将 `WorkflowIntent`（operation + capabilities + intent edges）作为可创建/更新的唯一配置真源。系统禁止接受旧式「原子 `nodes[]` + `WorkflowActionKind`」作为可编辑配置。

#### 场景:创建只提交 Intent

- **当** Admin 创建 Workflow 且 body 含合法 `intent`（或 Preset 可展开为 Intent）
- **那么** 系统持久化 `intent`，策略编译生成 `ir`，并写入 Revision 快照

#### 场景:拒绝旧 nodes 配置

- **当** Admin 创建/更新仅提交旧 `{ nodes, edges }` 而无 Intent
- **那么** 系统必须返回 4xx，且不得静默当作 Intent

### 需求:Operation 与 Capability 模型

系统必须支持固定 operation 词表：`read` | `judge` | `deliver` | `mutate`。系统必须支持在步骤上声明 capabilities（含 `evidence.images`、`policy.states` 等）。系统禁止将 `load_page_context` 暴露为 Intent operation 或 capability。

#### 场景:识图为 read 能力

- **当** `read` 步声明 `evidence.images.enabled = true`
- **那么** 编译 IR 可包含内部 `summarize_images` 步，且配置面不得出现独立识图节点

#### 场景:pageContext 隐式

- **当** 任意含页依赖的 Intent 被编译
- **那么** IR 不得包含 `load_page_context` 节点；运行时直接消费请求中的 pageContext

### 需求:策略编译与 Revision IR 快照

系统必须通过策略编译器将 Intent 编译为内部 IR。每次保存必须将 `intent` + `ir` 写入 Revision。Runtime 必须执行 `ir`，不得要求配置者理解 IR action 枚举。

#### 场景:mutate 展开

- **当** Intent 含 `mutate` 且需要确认
- **那么** IR 必须展开为 compose → present → await_user_confirm → write（及策略要求的 summarize），配置面仅一步 `mutate`

#### 场景:Revision 可审计

- **当** 查询某 version Revision
- **那么** 响应必须同时能提供该版本 `intent` 与编译后 `ir`
