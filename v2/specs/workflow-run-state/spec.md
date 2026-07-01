## ADDED Requirements

### 需求:系统必须维护 WorkflowRunState 作为 L1 业务运行态
系统必须在每次 Workflow 执行过程中维护 `WorkflowRunState`，且该状态必须包含：`workflowId`、`version`、`currentNodeId`、`status`、以及每节点的 `nodeId`、`action`、`name`、`status`。

#### 场景:初始化运行
- **当** 一次 PageAction invoke 或 Chat run 开始且已解析 Workflow 定义
- **那么** 系统必须创建 `WorkflowRunState`，且所有节点初始 `status` 必须为 `pending`

#### 场景:执行当前节点
- **当** 调度器开始执行 `currentNodeId` 对应节点
- **那么** 系统必须将该节点 `status` 置为 `running`，并必须记录 `startedAt`

### 需求:节点状态必须使用统一枚举
系统对 Workflow 节点的运行状态必须仅使用：`pending`、`running`、`succeeded`、`failed`、`skipped`。

#### 场景:节点成功完成
- **当** executor 正常结束且 Harness sensors 通过
- **那么** 系统必须将节点 `status` 置为 `succeeded`，并必须记录 `finishedAt`

#### 场景:节点失败
- **当** executor 或 sensor 判定失败且策略为 fail-fast
- **那么** 系统必须将节点 `status` 置为 `failed`，且必须将 `WorkflowRunState.status` 置为 `failed`

### 需求:Run 必须持久化 Workflow 快照
系统必须在 `PageActionRun` 完成时持久化 `workflowId`、`workflowVersion` 与 `workflowRun` JSON 快照。

#### 场景:PageAction 执行结束
- **当** PageAction invoke 结束（成功或失败）
- **那么** 系统必须将当时 `WorkflowRunState` 写入 `PageActionRun.workflowRun`，且不得因后续 Workflow 配置变更而改变历史记录

### 需求:对外 SSE 必须暴露动作节点进度
系统必须在 PageAction inline SSE 的 `page_action` 事件中提供节点级字段：`nodeId`、`action`、`nodeStatus`，以及可选 `nodeIndex`、`nodeTotal`。

#### 场景:节点开始
- **当** 某 Workflow 节点进入 `running`
- **那么** 系统必须发送包含该 `nodeId` 与 `nodeStatus=running` 的 SSE 事件

#### 场景:节点完成
- **当** 某 Workflow 节点进入 `succeeded` 或 `failed`
- **那么** 系统必须发送包含最终 `nodeStatus` 的 SSE 事件

### 需求:B 端 run 详情必须以动作节点为主时间线
系统必须在 PageAction run 管理端详情中，优先展示 Workflow 动作节点进度；`lifecycle`/`llm`/`dsl` 步骤仅作为节点内展开详情。

#### 场景:查看多步 Workflow 的 run
- **当** 管理员查询该 run 详情，且 Workflow 含 N 个动作节点
- **那么** 响应必须包含 N 个动作节点及其 `status`，且必须与 `workflowRun` 快照一致

## MODIFIED Requirements

### 需求:PageActionRun steps 审计
系统必须在 `PageActionRun.steps` 中支持 `type: 'workflow'` 记录，且每条记录必须关联 `nodeId` 与 `action`。

#### 场景:记录节点生命周期
- **当** Workflow 节点状态变迁
- **那么** 系统必须追加 `type=workflow` 的 step 行，且不得仅依赖 `lifecycle` 类型表达业务步骤

## REMOVED Requirements

（无）
