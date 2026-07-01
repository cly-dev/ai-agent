## ADDED Requirements

### 需求:系统必须提供 HarnessRunner 统一包裹节点执行
系统必须在执行每个 Workflow 节点前后，通过 `HarnessRunner.runNode` 调用已注册的 Hook 与 Sensor，且 executor 不得绕过 Harness 直接完成节点。

#### 场景:正常节点执行
- **当** 调度器执行某 Workflow 节点
- **那么** 系统必须先执行 `before_node` hooks，再执行 action executor，再执行 `after_node` sensors

#### 场景:Sensor 失败且策略为 fail-fast
- **当** `after_node` sensor 返回 `verdict=fail` 且当前路径为 PageAction
- **那么** 系统必须将节点标记为 `failed`，且必须终止 Workflow 运行

### 需求:generate_and_push 必须通过空填充传感器
系统必须在 `generate_and_push` 节点完成后运行 empty-fill sensor：当 `fillText` 为空或 `dslOutcome` 不为 `dispatched` 时，必须判定失败。

#### 场景:LLM 输出被 thinking 标签耗尽
- **当** Host fill 管道 reconcile 后 `fillText` 长度为 0
- **那么** 系统必须返回 sensor 失败，错误码必须为 `STREAM_EMPTY` 或等价稳定码，且必须写入 Harness trace

### 需求:fetch_data 必须通过观测非空传感器
系统必须在 `fetch_data` 节点完成后验证：至少存在一条与该步 `toolId` 相关的有效 tool observation。

#### 场景:HTTP 工具返回 EMPTY
- **当** tool 执行结果为 EMPTY 且无有效数据
- **那么** 系统必须在 Page 路径 fail-fast，且必须记录 sensor 结果

### 需求:配置期必须进行 Workflow 绑定传感器校验
系统必须在 Workflow 保存 API 中执行 binding sensor：所有节点引用的 `toolId`/`hostToolId` 必须已绑定。

#### 场景:保存时引用未绑定 hostToolId
- **当** 管理员提交 Workflow 且某 `generate_and_push` 节点的 `hostToolId` 未在 `WorkflowHostTool` 中
- **那么** 系统必须返回 400，且不得将 Workflow 写入数据库

### 需求:跳过节点必须可审计
系统若将节点标记为 `skipped`，必须写入 Harness trace，且必须包含 `skipReason`；禁止仅打服务端 warn 而不更新 `WorkflowRunState`。

#### 场景:Host Tool 绑定缺失导致跳过
- **当** 运行时某节点因绑定问题无法执行且策略允许 skip
- **那么** 系统必须将节点 `status=skipped`，且必须在 run steps 中记录 `type=harness` 或 `type=workflow` 的 skip 事件

### 需求:Harness 必须产生标准 trace 事件
系统必须为每次 hook/sensor 执行产生 trace 记录，且字段必须包含：`phase`、`name`、`verdict`、`nodeId`、`timestamp`。

#### 场景:Sensor 执行
- **当** 任意 sensor 运行完成
- **那么** 系统必须将结果追加到 run 审计（PageActionRun.steps 或 AgentRun.steps）的可查询结构中

## MODIFIED Requirements

### 需求:PageAction 空填充处理
系统不得在未运行 Harness sensor 的情况下，将 `lifecycle.completed` 且 `fillText` 为空标记为业务成功。

#### 场景:STREAM_EMPTY
- **当** fill 为空
- **那么** run `status` 必须为 `failed`，且 SSE 必须包含 `errorCode=STREAM_EMPTY`

## REMOVED Requirements

（无）
