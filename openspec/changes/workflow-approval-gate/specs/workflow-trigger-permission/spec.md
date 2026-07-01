## 新增需求

### 需求:触发权限必须派生自写工具的 RoleTool，不引入 workflow 级授权表

系统禁止为 workflow 触发新增独立授权表，必须复用既有 `RoleTool` / `RoleHostTool`。判定「谁可触发某 workflow」时，系统必须以该 workflow `write_data` 节点的 `input.toolId`（HTTP Tool）为准，校验相关用户所属 Role 经 `RoleTool` 覆盖该 toolId；若 workflow 的写路径依赖 HostTool，则相应校验 `RoleHostTool`。

#### 场景:写工具权限即触发权限

- **当** 判定用户能否触发某含 `write_data` 节点的 workflow
- **那么** 系统必须检查用户 Role 是否经 `RoleTool` 覆盖该 `write_data.toolId`，不得依赖任何 workflow 级授权表

### 需求:触发 workflow 前必须对写工具权限做 fail-fast 校验

触发任一含写操作的 workflow 前，系统必须校验相关用户持有其 `write_data` 工具的 `RoleTool`；无权时禁止启动执行，且禁止创建审批请求（避免生成永远无法确认完成的审批卡）。校验主体随来源不同：chat（解析 skill 绑定的 workflow）与 pageAction invoke 校验**发起人**；webhook 无人类发起人，改为校验 workflow 配置指定的**审批人**（`approverUserId`）。

#### 场景:发起人无写工具权限（chat/pageAction）

- **当** 用户经 chat 或 pageAction 触发一个其 Role 未经 `RoleTool` 覆盖 `write_data.toolId` 的 workflow
- **那么** 系统必须拒绝触发，不得创建审批请求或执行任何节点

#### 场景:发起人有写工具权限（chat/pageAction）

- **当** 用户触发一个其 Role 已覆盖 `write_data.toolId` 的 workflow
- **那么** 系统必须允许进入正常执行链路

#### 场景:webhook 配置审批人无写工具权限

- **当** webhook 触发的 workflow 其配置审批人 Role 未经 `RoleTool` 覆盖 `write_data.toolId`
- **那么** 系统必须拒绝触发，不得创建审批请求或执行任何节点

### 需求:审批恢复前必须二次校验写工具权限

系统在从审批挂起点恢复执行之前，必须重新校验权限主体当前仍持有 `write_data` 工具的 `RoleTool`（chat/pageAction 为发起人，webhook 为配置审批人）；若权限在触发与确认之间被回收，系统禁止恢复执行。

#### 场景:授权在等待期间被回收

- **当** 一条 `pending` 审批的权限主体在确认前其 `write_data` 工具的 `RoleTool` 被移除
- **那么** 系统必须拒绝恢复执行，并将该 `ApprovalRequest` 置为 `cancelled`

### 需求:必须提供触发权限校验的回滚开关

系统必须提供配置项（如 `WORKFLOW_TRIGGER_PERMISSION`），在关闭时跳过写工具 fail-fast 触发校验以兼容存量数据，用于迁移期回滚（运行时 `SkillTool ∩ RoleTool` 门仍然生效）。

#### 场景:关闭权限校验

- **当** 运维将 `WORKFLOW_TRIGGER_PERMISSION=false`
- **那么** 系统必须跳过触发前 fail-fast 校验，照常进入执行链路（写入仍受运行时工具门约束）
