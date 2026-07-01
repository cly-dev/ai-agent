## ADDED Requirements

### 需求:系统必须提供 Admin Workflow CRUD API
系统必须在 `/admin` 前缀下提供 Workflow 管理接口，且必须支持：创建、更新、查询详情、分页列表、停用（`isActive=false`）。

#### 场景:创建 Workflow
- **当** 管理员 POST 合法 Workflow 定义
- **那么** 系统必须返回含 `id`、`version`、`workflowKey` 的响应，且必须执行保存期校验

#### 场景:列表筛选
- **当** 管理员按 `appClientId`、`profile`、`isActive` 查询
- **那么** 系统必须返回分页列表，且每项必须包含引用计数（Skill + PageAction）

### 需求:Workflow 详情必须返回绑定与 revision
系统查询 Workflow 详情时，必须返回 `WorkflowTool`、`WorkflowHostTool` 列表，以及可选最近 N 条 `WorkflowRevision`。

#### 场景:查看版本历史
- **当** 管理员请求某 Workflow 的 revisions
- **那么** 系统必须返回按 `version` 降序的 revision 列表

### 需求:Skill 与 PageAction Admin API 必须支持 workflowId
系统必须在 Skill / PageAction 的 create/update 接口接受 `workflowId`、`workflowVersion`、`workflowOverrides`，且保存时必须校验 Workflow 存在且 profile 兼容。

#### 场景:绑定不兼容 profile
- **当** PageAction 绑定 `profile=chat_skill` 的 Workflow 且未声明兼容策略
- **那么** 系统必须拒绝保存或要求显式确认（实现时二选一，须在代码常量中固定）

### 需求:删除或停用 Workflow 必须检查引用
系统停用 Workflow 时，若仍有 `isActive=true` 的 Skill/PageAction 引用，必须返回警告或拒绝（实现时二选一，须在 design 中固定；默认：**拒绝停用**）。

#### 场景:存在活跃引用
- **当** 管理员将 Workflow 设为 `isActive=false` 且存在活跃 PageAction 引用
- **那么** 系统必须拒绝操作并返回引用方列表

## MODIFIED Requirements

### 需求:PageAction run Admin 详情
系统必须在 PageAction run 详情 API 中返回 `workflowId`、`workflowVersion`、`workflowRun`，且 steps 时间线必须可与 `workflowRun.nodes` 对齐。

#### 场景:B 端查看 run
- **当** 管理员 GET run detail
- **那么** 响应必须包含动作节点进度块，且不得仅返回 engine lifecycle 步骤

## REMOVED Requirements

（无）
