## 1. 数据模型（P0）

- [x] 1.1 `prisma/schema.prisma` 新增 `enum ApprovalSource`、`enum ApprovalStatus`、`model ApprovalRequest`（含 `initiatorUserId?`(审计)、`approverUserId`(权威决策)、`workflowId/version`、`nodeId`、`resumeSnapshot`、`pageActionRunId?`、`sessionId?`、`idempotencyKey?`、状态/时间字段；收件箱索引按 `approverUserId`）
- [x] 1.2 `enum PageActionRunStatus` 增加 `awaiting_approval`；`PageActionRun` 增加与 `ApprovalRequest` 的反向关联
- [x] 1.3 在 `User`/`AppClient`/`Workflow`/`PageActionRun` 上补 `ApprovalRequest` 反向关系（不新增授权表，复用 `RoleTool`）
- [x] 1.4 生成并检入 Prisma 迁移（`prisma/migrations/*`），无需回填存量
- [x] 1.5 定义 `ApprovalResumeSnapshot` 类型（discriminated union：chat/page_action/webhook），抽取自现有 `PendingWriteResumeContext` 的触发无关子集

## 2. 触发权限（P0，派生自 RoleTool）

- [x] 2.1 新增派生式触发权限校验 util（取 workflow `write_data.toolId`，校验 user→role→`RoleTool` 覆盖该 toolId；HostTool 写路径校验 `RoleHostTool`）
- [x] 2.2 在 chat skill 解析绑定 workflow 的入口接入 fail-fast 校验（校验发起人）
- [x] 2.3 在 pageAction invoke 入口接入 fail-fast 校验（校验发起人）
- [x] 2.4 增加 env `WORKFLOW_TRIGGER_PERMISSION` 回滚开关（关闭时跳过 fail-fast，运行时工具门仍生效）
- [x] 2.5 审批恢复入口前做二次写工具权限校验；无权则将 request 置 `cancelled`

## 3. 审批请求生命周期（P0/P1）

- [x] 3.1 新增 `ApprovalRequest` 仓储/服务（创建、按 `approverUserId` 查询、状态 CAS 更新）
- [x] 3.2 实现「写前挂起」：workflow 到 `await_user_confirm` 时创建 `ApprovalRequest(pending)`，按来源解析 `approverUserId`（chat/pageAction=发起人，webhook=配置审批人）并写入 `resumeSnapshot`
- [x] 3.3 实现通用恢复入口：按 `channel.kind` 反序列化快照并分派到对应 runner，从挂起节点续跑 `write_data → summarize`（page_action + chat 收件箱快照续跑已接；webhook 待接）
- [x] 3.4 确认/拒绝的幂等与并发保护（`status` CAS `pending→approved`，命中 0 行短路）

## 4. pageAction 可挂起执行（P1）

- [x] 4.1 pageAction runner 改造：到 `await_user_confirm` 时置 `PageActionRun.status=awaiting_approval` 并返回（不再同步写）
- [x] 4.2 审批通过后恢复：执行写入、推进 workflow 至 `completed`、run 置 `completed`
- [x] 4.3 审批拒绝后：run 置 `cancelled`，不执行写入
- [x] 4.4 pageAction 状态机 / SSE 增补 `awaiting_approval` 分支与展示

## 4A. 执行日志审计留存（P0/P1，硬约束）

- [x] 4A.1 挂起时不得清空/覆盖已有 `PageActionRun.steps` 与 `workflowRun`；追加「挂起」审计步骤（含 nodeId、approvalRequestId、时间）
- [x] 4A.2 恢复续跑时以**追加**方式写入后续步骤（write_data / summarize），保留挂起前全部历史，禁止覆盖
- [x] 4A.3 `ApprovalRequest` 决策留痕：`decidedByUserId` / `decidedAt` / 拒绝原因写入并可追溯回触发 run
- [x] 4A.4 chat 恢复路径同样保留 run 审计步骤（primary `awaiting_approval` gate + worker `approval_confirmed` / primary `approval_rejected`）
- [ ] 4A.5 校验：一次「触发→挂起→确认→完成」的完整链路在审计日志中可端到端重建（含挂起区间）

## 5. chat 镜像 SSOT（P1）

- [x] 5.1 chat 写确认挂起时，除现有 Redis 快路径外同时创建 `ApprovalRequest(source=chat)`
- [x] 5.2 chat 实时确认完成后同步更新 `ApprovalRequest.status`（非 pending），保证收件箱幂等
- [x] 5.3 两条恢复路径互斥：先到者胜，另一路径按 `status` 短路

## 6. 审批收件箱 API（P1）

- [x] 6.1 新增收件箱 controller/service：list（恒过滤 `approverUserId=当前用户`，返回表格字段 + 预览）
- [x] 6.2 confirm 接口（校验操作者=`approverUserId`、仅 pending、触发恢复）
- [x] 6.3 reject 接口（校验操作者=`approverUserId`、仅 pending、终止执行）
- [x] 6.4 访问单条审批的越权保护（非审批人返回未找到/无权限）

## 7. 前端 C 端（P1）

- [ ] 7.1 新增「自动化确认」模块：待审批表格（标题/来源/workflow/时间/停留时长/状态 + 写参数预览）
- [ ] 7.2 确认 / 拒绝交互与状态刷新

## 8. Webhook 与过期（P2）

- [ ] 8.1 webhook 触发入口接入同一挂起/恢复链路（initiatorUserId 为空/服务账号，approverUserId 取 workflow 配置审批人；触发校验落在 approver）
- [ ] 8.2 确定 webhook 审批人配置载体（workflow 级字段 / 触发绑定 / 独立配置表）并落库
- [ ] 8.3 可选 `expiresAt` + 定时任务将超时 pending 置 `expired`

## 9. 文档与迁移说明

- [ ] 9.1 记录 `PageActionRunStatus` BREAKING 新增值与消费方处理
- [ ] 9.2 记录派生式触发权限（`RoleTool` on `write_data`）与 `WORKFLOW_TRIGGER_PERMISSION` 开关用法
- [x] 9.3 更新 `.env.example` 新增开关项
- [ ] 9.4 记录审计日志留存约定（挂起/恢复不丢步、决策留痕）
