## ADDED Requirements

### 需求:系统必须维护 Workflow 动作节点注册表
系统必须按 [workflow-action-kinds.md](../../workflow-action-kinds.md) 维护 `WorkflowActionKind` 注册表。V2 目录 **定稿 8 种** action，分 **批次 A**（首期实现）与 **批次 B**（Chat mutation）。

#### 场景:保存含未实现 action 的 Workflow
- **当** `nodes` 中某节点 `action` 在注册表中标记为未实现（`implemented: false`）
- **那么** 系统必须拒绝保存并返回可定位到 `nodeId` 的校验错误

#### 场景:保存含未知 action 的 Workflow
- **当** `nodes` 中某节点 `action` 不在注册表
- **那么** 系统必须拒绝保存

### 需求:各 action 必须具备 input 契约与 profile 约束
系统必须在保存 Workflow 时校验每个节点的 `input` 字段符合其 `action` 在注册表中定义的 schema；且必须符合 `Workflow.profile` 允许的 action 子集。

#### 场景:page_action profile 含批次 B 动作
- **当** Workflow `profile` 为 `page_action` 且节点含 `compose_mutation`、`present_mutation`、`write_data` 或 `await_user_confirm`
- **那么** 系统必须拒绝保存

#### 场景:fetch_data 缺少 tool 引用
- **当** 节点 `action=fetch_data` 且 `input` 既无 `toolId` 也无 `definitionKey`
- **那么** 系统必须拒绝保存

### 需求:executor 必须按 action 注册表分发
运行时 `execute_node` 必须通过 `executor-registry` 按 `WorkflowActionKind` 分发到对应 executor；未实现批次不得静默 no-op。

#### 场景:运行批次 B 动作而 executor 未上线
- **当** 运行时解析到 `action=compose_mutation` 且对应 executor 未注册
- **那么** 系统必须将节点标记为 `failed` 并返回明确错误码，不得 fallback 到旧 Plan 路径而不记录
