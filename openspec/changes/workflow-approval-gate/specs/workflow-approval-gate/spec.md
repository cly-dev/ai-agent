## 新增需求

### 需求:写操作执行前必须挂起为审批请求

当 workflow 执行到 `await_user_confirm` 节点（或 `write_data` 的前置确认门）时，系统必须在执行 `write_data` **之前**创建一条 `ApprovalRequest`（`status=pending`）并停止当前执行，禁止在未获确认的情况下执行写入。

#### 场景:pageAction 触发的 mutation workflow 到达确认门

- **当** 一个 `page_action` 触发的 workflow 执行到 `await_user_confirm` 节点
- **那么** 系统必须创建 `ApprovalRequest(source=page_action, status=pending)`，将关联 `PageActionRun.status` 置为 `awaiting_approval`，且不得执行 `write_data`

#### 场景:确认门前写入被阻止

- **当** workflow 存在 `write_data` 节点但对应 `ApprovalRequest` 尚未 `approved`
- **那么** 系统禁止调用写工具，必须停留在挂起态

### 需求:审批请求必须记录审批人且默认等于发起人

系统创建 `ApprovalRequest` 时必须设置权威审批人字段 `approverUserId`。对 chat 与 pageAction 来源，`approverUserId` 必须等于触发用户（同时记入 `initiatorUserId`）；对 webhook 来源，`initiatorUserId` 可为空，`approverUserId` 必须取自 workflow 配置指定的审批人。

#### 场景:chat/pageAction 审批人等于发起人

- **当** 创建 `source=chat` 或 `source=page_action` 的 `ApprovalRequest`
- **那么** `approverUserId` 必须等于 `initiatorUserId`（当前触发用户）

#### 场景:webhook 审批人取自配置

- **当** 创建 `source=webhook` 的 `ApprovalRequest`
- **那么** `initiatorUserId` 可为空，且 `approverUserId` 必须为 workflow 配置指定的审批人（不得为空）

### 需求:审批请求必须携带可跨进程恢复的执行快照

系统创建 `ApprovalRequest` 时，必须将继续执行所需的上下文序列化为 `ApprovalResumeSnapshot` 存入持久化存储（`resumeSnapshot`），该快照必须包含 `workflowRun`、`workflowNodeDefs`、`workflowNodeOutputs`、待写工具调用（名称与参数）、scoped 工具集与触发通道信息。

#### 场景:快照可重建挂起点

- **当** 从 `ApprovalRequest.resumeSnapshot` 反序列化
- **那么** 系统必须能定位挂起节点并重建从该节点续跑所需的 workflow 状态与写参数，无需依赖原执行进程的内存

#### 场景:快照区分触发通道

- **当** 快照的 `channel.kind` 分别为 `chat` / `page_action` / `webhook`
- **那么** 恢复入口必须按通道分派到对应恢复路径，且共用同一 workflow 续跑逻辑

### 需求:挂起与恢复必须完整保留 workflow 执行日志用于审计

系统在挂起、恢复、完成或拒绝审批的整个过程中，禁止清空或覆盖已产生的执行审计（`PageActionRun.steps`、`workflowRun` 快照、chat run 审计步骤）。所有新增步骤必须以追加方式写入，且必须留存审批决策痕迹（决策人、决策时间、拒绝原因），使一次完整链路可端到端重建。

#### 场景:挂起不丢失既有步骤

- **当** workflow 执行到确认门并挂起为 `ApprovalRequest`
- **那么** 挂起前已记录的执行步骤与 `workflowRun` 必须原样保留，并追加一条含 `nodeId` 与 `approvalRequestId` 的「挂起」审计步骤

#### 场景:恢复以追加方式记录且可端到端重建

- **当** 审批通过后从挂起点续跑至完成
- **那么** `write_data` 与 `summarize` 步骤必须以追加方式写入审计日志，保留挂起前全部历史，且整条「触发→挂起→确认→完成」链路（含挂起区间）可从审计记录完整重建

#### 场景:决策留痕

- **当** 审批被确认或拒绝
- **那么** 系统必须记录 `decidedByUserId`、`decidedAt`（拒绝时含原因），且可从该记录追溯回触发实体

### 需求:确认后必须从挂起点续跑至完成

当 `ApprovalRequest` 被批准后，系统必须加载其恢复快照，从挂起节点继续执行 `write_data → summarize`，并在成功后将触发实体置为终态（如 `PageActionRun.status=completed`）。

#### 场景:pageAction 审批通过后续跑

- **当** 发起人确认一条 `source=page_action` 的待审批
- **那么** 系统必须执行写入并推进 workflow 至 `completed`，且将 `PageActionRun.status` 从 `awaiting_approval` 置为 `completed`

#### 场景:审批拒绝后终止

- **当** 发起人拒绝一条待审批
- **那么** 系统禁止执行写入，必须将 `ApprovalRequest.status` 置为 `rejected` 且将触发实体置为 `cancelled`

### 需求:审批确认必须幂等且防并发重复执行

系统必须保证同一 `ApprovalRequest` 只被恢复执行一次。并发或重复的确认必须通过状态 CAS（`pending → approved`）短路，命中 0 行的确认不得再次触发写入。

#### 场景:重复点击确认

- **当** 同一 `ApprovalRequest` 在极短时间内被确认两次
- **那么** 只有首个将 `status` 从 `pending` 置为 `approved` 的操作触发续跑，后续操作必须被幂等短路，不得重复写入

### 需求:chat 挂起态必须镜像为统一审批 SSOT

chat 链路在写确认挂起时，除保留现有实时确认快路径外，必须同时创建 `ApprovalRequest(source=chat)`，使该待审批在统一收件箱可见；任一恢复路径先完成后，另一路径必须通过状态判定幂等短路。

#### 场景:chat 挂起后在收件箱可见

- **当** chat 触发的 mutation 进入写确认挂起
- **那么** 系统必须存在一条 `source=chat, status=pending` 的 `ApprovalRequest`，其 `initiatorUserId` 与 `approverUserId` 均为会话用户

#### 场景:实时确认后收件箱条目失效

- **当** 用户已通过 chat 实时门确认并完成写入
- **那么** 对应 `ApprovalRequest.status` 必须不再为 `pending`，收件箱不得再展示为待处理
