## ADDED Requirements

### 需求:GOA ActiveTask 必须支持 workflowRun 快照
系统必须在 `ActiveTask` 中持久化 `workflowRun`（或与 `WorkflowRunState` 同构字段），且跨 turn resume 必须以该快照为进度权威。

#### 场景:任务进行中切换 turn
- **当** 用户在同 session 新消息触发 resume 评估且 `activeTask.status=in_progress`
- **那么** 系统必须使用 `activeTask.workflowRun.currentNodeId` 判断未完成节点

#### 场景:任务完成
- **当** 所有 Workflow 节点 `succeeded`
- **那么** 系统必须将 `activeTask.status` 置为 `completed`，且 `workflowRun.status` 必须为 `completed`

### 需求:stepProgress 必须基于动作节点而非 phase/kind
系统构建 `TaskStepProgress` 时，必须使用 `workflowRun.nodes` 的 `nodeId`、`action`、`status`；不得将 `taskPlan.phase`/`taskPlan.kind` 作为 B 端或 prompt 展示的主字段。

#### 场景:注入 session prompt
- **当** 系统格式化 activeTask 供 LLM 阅读
- **那么** 输出必须列出动作名或 `name` 字段，以及 pending/completed 节点 id

### 需求:AgentRun GOA 快照必须包含 workflowRun
系统写入 `AgentRunGoaSnapshot` 时，必须在双写期后优先包含 `workflowRun`；`storedTaskPlan` 仅作 legacy fallback。

#### 场景:Run 结束写 GOA
- **当** Chat Agent run 结束且存在 Workflow 执行
- **那么** 快照必须包含完整 `workflowRun` 以便 replay

### 需求:写确认不得破坏 Workflow 节点边界
系统在进入 `awaiting_confirmation` 时，必须保持 `workflowRun` 快照不变；写确认续跑必须从同一 `currentNodeId` 或明确定义的下一节点继续，不得重新生成 plan。

#### 场景:写确认暂停
- **当** mutation 相关路径触发写确认闸门
- **那么** `activeTask.status` 必须为 `awaiting_confirmation`，且 `workflowRun` 必须可序列化恢复

## MODIFIED Requirements

### 需求:ActiveTask.plan 字段
系统必须在 PR4 完成后将 `ActiveTask.plan`（`StoredTaskPlan`）标为 deprecated；新写入的 activeTask 应主要携带 `workflowRun`。

#### 场景:新任务开始
- **当** 新 orchestrated task 启动且绑定 Workflow
- **那么** 系统必须初始化 `workflowRun`，且不得仅写 `StoredTaskPlan` 而不写 `workflowRun`

## REMOVED Requirements

（无）
