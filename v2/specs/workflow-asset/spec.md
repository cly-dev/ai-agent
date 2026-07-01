## ADDED Requirements

### 需求:Workflow 必须为 AppClient 级可复用资产
系统必须在数据库中持久化 Workflow 定义，且每条 Workflow 必须绑定唯一 `appClientId` 与 App 内唯一 `workflowKey`。

#### 场景:创建 Workflow
- **当** 管理员在指定 AppClient 下创建 Workflow 并提供合法 `workflowKey`、名称、`profile`、`nodes`
- **那么** 系统必须持久化 Workflow 记录，且 `workflowKey` 在同一 `appClientId` 内不可重复

#### 场景:多入口引用同一 Workflow
- **当** 多个 Skill 或 PageAction 配置相同 `workflowId`
- **那么** 系统必须使用同一份 Workflow 定义解析运行，不得复制独立副本到各入口 `config`

### 需求:Workflow 节点必须采用业务动作模型
系统必须使用 `WorkflowNodeDef`，且每个节点必须包含字段：`id`、`action`、`name`、`objective`、`input`。允许的 `action` 必须以 [workflow-action-kinds.md](../../workflow-action-kinds.md) 注册表为准（V2 定稿 **8 种**）。

#### 场景:保存含非法 action 的 Workflow
- **当** `nodes` 中某节点 `action` 不在注册表或标记为未实现
- **那么** 系统必须拒绝保存并返回可定位到 `nodeId` 的校验错误

#### 场景:PageAction profile 限制
- **当** Workflow `profile` 为 `page_action`
- **那么** 系统必须拒绝保存包含 **批次 B** 动作（`compose_mutation`、`present_mutation`、`write_data`、`await_user_confirm`）的节点

#### 场景:Workflow 步数不固定
- **当** 管理员配置 `nodes` 数组长度为 N（N ≥ 1）
- **那么** 系统必须按数组顺序作为运行步序，不得强制 N=3 或固定模板

### 需求:Workflow 保存时必须校验工具与 Host Tool 绑定
系统必须为 Workflow 维护 `WorkflowTool` 与 `WorkflowHostTool` 绑定。保存 Workflow 时，所有节点 `input` 引用的 `toolId` / `hostToolId` 必须存在于对应绑定表中。

#### 场景:fetch_data 引用未绑定 Tool
- **当** 某节点 `action=fetch_data` 且 `input.toolId` 不在 `WorkflowTool` 中
- **那么** 系统必须拒绝保存

#### 场景:generate_and_push 引用未绑定 HostTool
- **当** 某节点 `action=generate_and_push` 且 `input.hostToolId` 不在 `WorkflowHostTool` 中
- **那么** 系统必须拒绝保存

#### 场景:compose_mutation 或 write_data 引用未绑定 Tool
- **当** 某节点 `action` 为 `compose_mutation` 或 `write_data` 且 `input.toolId` 不在 `WorkflowTool` 中
- **那么** 系统必须拒绝保存

### 需求:Workflow 版本必须可追溯
系统必须在修改 `nodes`、`deliverable` 或 `constraints` 时递增 `Workflow.version`，并必须写入 `WorkflowRevision` 历史记录。

#### 场景:更新 Workflow 步骤
- **当** 管理员更新 Workflow 的 `nodes` 且校验通过
- **那么** 系统必须将 `version` 加 1，并必须创建对应 `WorkflowRevision` 行

#### 场景:Run 使用 pin 版本
- **当** Skill 或 PageAction 配置 `workflowVersion` 非空
- **那么** 运行时必须使用指定 revision 的 `nodes`，不得静默使用最新版

### 需求:入口必须支持 per-step 覆盖而非复制 Workflow
系统必须允许 Skill / PageAction 配置 `workflowOverrides`（按 `nodeId` 覆盖 `objective` 等字段），且不得要求复制整份 `nodes` 数组。

#### 场景:覆盖单步 objective
- **当** PageAction 引用 `workflowId` 且 `workflowOverrides` 含某 `nodeId` 的 `objective`
- **那么** 运行时解析后的节点必须使用覆盖后的 `objective`，其余字段仍来自 Workflow 定义

## MODIFIED Requirements

### 需求:Skill 计划步序必须优先引用 Workflow 表
系统必须在 Skill 配置 `workflowId` 时，以内层运行步序来源于 Workflow 表为权威；`skill.config.workflow` 仅允许在迁移过渡期作为双读 fallback，且必须记录 deprecate 日志。

#### 场景:Skill 已绑定 workflowId
- **当** Skill 展开执行且 `workflowId` 有效
- **那么** 系统必须加载 Workflow 定义初始化 `WorkflowRunState`，不得仅依赖 `config.workflow`

## REMOVED Requirements

### 需求:Skill config 内嵌 workflow 为唯一步序来源
**原因**：由 Workflow 表与 `workflowId` 引用替代。  
**迁移**：提供 `import-skill-config-workflow` 工具将存量 JSON 导入 Workflow 表。

### 需求:V1 仅允许三种 action
**原因**：由 8 种动作注册表替代；见 [workflow-action-kinds.md](../../workflow-action-kinds.md)。  
**迁移**：存量 3 步模板可映射为 `load_page_context` + `fetch_data` + `generate_and_push` + `summarize` 的子集或超集。
