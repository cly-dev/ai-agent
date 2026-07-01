## 为什么

自动化 Workflow（pageAction、webhook）目前是**同步一次性执行**：runner 一路跑到底，没有「挂起等人确认」的能力。只有 chat 链路有写确认门（`workflow-await-user-confirm-gate` + Redis `pending-write-confirmation`），但它是**会话内、实时 SSE、进程内恢复**的，绑死在 chat session 上，无法给非交互触发（pageAction/webhook）复用。

结果是：非交互自动化一旦涉及敏感写操作（`write_data`），要么裸奔直接写、要么完全做不了。业务需要一个**跨触发方式统一的审批卡点**：执行到写操作前挂起、在 C 端「自动化确认」列表里生成一条待办、发起人点击确认后从挂起点继续执行。

同时，既然要「谁发起谁审批」，就必须保证**发起人本就有权执行该 workflow 的写操作**——否则会生成一张永远确认不了的审批卡（`write_data` 必然失败）。这道权限**已经存在**于 `RoleTool`（workflow 的 `write_data.toolId` 是 HTTP Tool，受 `RoleTool` 管），无需新建 workflow 级授权表；只需把这道 tool 权限**提前到触发/恢复前做 fail-fast 校验**。

## 变更内容

- 新增**统一审批请求实体** `ApprovalRequest`：作为 chat / pageAction / webhook 三种触发共享的待审批 SSOT（持久化、可跨进程恢复），记录发起人、workflow、挂起节点、恢复快照与状态。
- 新增**通用恢复快照** `ApprovalResumeSnapshot`：把「从挂起点继续执行」所需的执行上下文（workflowRun、node outputs、已组装的写参数等）序列化存库，与具体触发链路解耦。
- **执行引擎可挂起/可恢复**：pageAction / webhook runner 执行到 `await_user_confirm`（或 `write_data` 前置门）时不再直接写，而是创建 `ApprovalRequest` 并挂起；确认后由恢复入口重放 `ApprovalResumeSnapshot` 继续到 `write_data → summarize`。
- **BREAKING（Schema）**：`enum PageActionRunStatus` 增加 `awaiting_approval`；`PageActionRun` 关联 `ApprovalRequest`。
- 新增 **C 端「自动化确认」收件箱**：以表格列出**审批人自己**的待审批记录，支持确认（继续执行）/ 拒绝（终止）；仅审批人可见、可操作。审批人由权威字段 `approverUserId` 决定——chat/pageAction 等于发起人（「谁发起谁审批」），webhook 无人类发起人时取 workflow 配置指定的审批人。
- 新增 **派生式触发权限校验**（复用 `RoleTool`，不建新表）：触发（chat skill / pageAction / webhook）与审批恢复前，都对 workflow 的 `write_data.toolId`（及必需 HostTool 的 `RoleHostTool`）做 fail-fast 权限检查——缺权限即拒绝触发，不生成审批卡。校验主体：chat/pageAction 为发起人，webhook 为配置审批人。
- chat 链路：保留现有实时写确认门作为**同会话在线**的快路径；同时把挂起态**镜像**为 `ApprovalRequest`，使离线 / 跨端也能在收件箱看到并恢复（统一 SSOT，不重复造轮子）。

## 功能 (Capabilities)

### 新增功能

- `workflow-approval-gate`: 审批卡点的运行时语义——写操作前挂起、`ApprovalRequest` 生命周期、`ApprovalResumeSnapshot` 恢复、pageAction/webhook 可挂起执行、幂等与并发确认保护。
- `workflow-trigger-permission`: 派生自 `RoleTool` 的触发级 fail-fast 校验（workflow `write_data` 工具权限）；chat/pageAction/webhook 触发与审批恢复前的权限校验；权限变更后待审批记录的处理规则。
- `automation-approval-inbox`: C 端自动化确认收件箱——审批人待审批列表（表格）、确认/拒绝 API、审批人独占可见/可操作、状态流转与审计。

### 修改功能

- 无（项目根目录 `openspec/specs/` 尚无归档基线规范）。

## 影响

- **数据库**：`prisma/schema.prisma` 新增 `model ApprovalRequest`、`enum ApprovalStatus`、`enum ApprovalSource`；`enum PageActionRunStatus` 增加 `awaiting_approval`；对应迁移脚本。（不新增 workflow 授权表，复用 `RoleTool`。）
- **执行引擎**：pageAction runner（同步→可挂起）、webhook 触发入口（新增）、`workflow-await-user-confirm-gate.util.ts` 与 `pending-write-confirmation.*`（镜像为 ApprovalRequest）、`workflow-plan-sync` 恢复路径。
- **权限校验**：workflow 触发链路（chat skill 解析、pageAction invoke、webhook 入口）新增基于 `RoleTool` 的 `write_data` 工具 fail-fast 校验；复用现有 `Role*` 授权体系，不扩展表结构。
- **API / 模块**：新增审批收件箱 controller/service（list/confirm/reject）；pageAction 状态机与 SSE。
- **前端 C 端**：新增「自动化确认」模块（待审批表格、确认/拒绝交互）。
