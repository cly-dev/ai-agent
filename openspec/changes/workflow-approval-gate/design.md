## 上下文

三种触发方式共享同一套 workflow 编排（`WorkflowNodeDef[]`，含 `compose_mutation → present_mutation → await_user_confirm → write_data → summarize`），但恢复能力割裂：

- **chat**：`workflow-await-user-confirm-gate.util.ts` 在 `await_user_confirm` 挂起，把执行上下文写进 Redis（`PendingWriteConfirmationSnapshot`，含 `PendingWriteResumeContext`），靠**同一会话下一条用户消息 + SSE** 恢复。会话级、实时、进程内。
- **pageAction**：`PageActionRun` 同步 runner，状态机只有 `running/completed/failed/cancelled`，**无挂起点**，跑到 `write_data` 直接写或直接失败。
- **webhook**：尚无基础设施。

现有 chat 快照结构已经证明「可 JSON 序列化的执行上下文足以恢复 graph」是可行的（见 `PendingWriteResumeContext`：steps / toolObservations / workflowRun / workflowNodeDefs / taskPlan…）。本设计把这套能力**上提为持久化、触发无关的通用件**，并补上「谁能触发」的授权缺口。

权限现状：`RoleTool / RoleHostTool / RoleSkill` 已存在（`role*` 表，`@@unique([roleId, xId])`），`UserApp` 绑定 user→app→role。Workflow 无触发级授权。

## 目标 / 非目标

**目标：**

- 一个**持久化、触发无关**的审批实体 `ApprovalRequest`，作为 chat/pageAction/webhook 待审批 SSOT。
- 执行引擎在 `write_data` 前可**挂起并落库**、确认后可**跨进程恢复**继续。
- C 端「自动化确认」收件箱：发起人看到自己的待办表格，确认继续 / 拒绝终止。
- **谁发起谁审批**：审批人恒等于发起人，不引入审批人指派、多级审批、委派。
- **发起人必须具备 workflow 触发权限**（`RoleWorkflow`），触发时与恢复时都校验。

**非目标：**

- 多审批人 / 会签 / 审批链 / 指派 / 转交（明确排除，用户要求「谁发起谁审批，不要绕来绕去」）。
- 审批超时自动通过/拒绝的复杂 SLA（P2 可选，本次仅留手动 + 可选过期失效）。
- 重写 chat 现有实时确认交互（保留快路径，仅增量镜像到 SSOT）。
- 前端具体像素级实现。

## 决策

### 决策 1：统一 `ApprovalRequest` 作为 SSOT，而非各链路各存一份

**选择**：新增持久化 `ApprovalRequest`（DB），承载全部触发来源的待审批态；`ApprovalResumeSnapshot` 作为其 `resumeSnapshot` JSON 字段。

**理由**：chat 用 Redis、pageAction 用 `PageActionRun.workflowRun`、webhook 从零——若各写各的，收件箱要 union 三套异构存储，权限/状态/审计无法统一。单一 DB 实体让「列表、确认、拒绝、审计、幂等」只实现一遍。

**替代方案**：
- *扩展 `PageActionRun` 承载所有来源* → 语义错位（chat 无 PageActionRun），且 webhook 仍无处安放。
- *纯 Redis* → 审批是业务待办，需持久、可查询、可审计，Redis 不合适做 SSOT（可做在线快路径缓存）。

```prisma
enum ApprovalSource { chat page_action webhook }
enum ApprovalStatus { pending approved rejected expired cancelled }

model ApprovalRequest {
  id             Int            @id @default(autoincrement())
  appClientId    Int
  source         ApprovalSource
  status         ApprovalStatus @default(pending)
  /// 谁/什么触发（webhook 无人类发起人时为 null）——审计用，非授权判定字段
  initiatorUserId Int?
  /// 谁必须审批（权威决策字段）：chat/pageAction = 发起人；webhook = workflow 配置指定
  approverUserId  Int
  workflowId     Int
  workflowVersion Int
  /// 挂起节点
  nodeId         String
  /// C 端展示用（标题 / 摘要 / 待写参数预览），不含敏感全量
  title          String
  summary        String?        @db.Text
  previewBlocks  Json?
  /// 通用恢复快照（ApprovalResumeSnapshot 序列化）
  resumeSnapshot Json
  /// 关联触发实体（可选，用于回链与幂等）
  pageActionRunId Int?          @unique
  sessionId      String?
  /// 幂等 & 并发确认保护
  idempotencyKey String?
  decidedByUserId Int?
  decidedAt      DateTime?
  expiresAt      DateTime?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  appClient   AppClient      @relation(fields: [appClientId], references: [id], onDelete: Cascade)
  initiator   User?          @relation("ApprovalInitiator", fields: [initiatorUserId], references: [id], onDelete: SetNull)
  approver    User           @relation("ApprovalApprover", fields: [approverUserId], references: [id], onDelete: Cascade)
  workflow    Workflow       @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  pageActionRun PageActionRun? @relation(fields: [pageActionRunId], references: [id], onDelete: SetNull)

  /// 收件箱查询恒按 approver（审批人视角），非 initiator
  @@index([appClientId, approverUserId, status, createdAt])
  @@index([appClientId, status])
  @@index([workflowId])
}
```

### 决策 2：审批人取自单一权威字段 `approverUserId`，默认等于发起人

**选择**：不引入 `ApproverSpec / ApprovalPolicy` 动态指派引擎，但**拆分两个字段**：`initiatorUserId`（谁/什么触发，审计用，webhook 时为 null）与 `approverUserId`（谁必须审批，唯一权威决策字段）。

- **chat / pageAction**：`approverUserId = initiatorUserId = 当前用户`——「谁发起谁审批」原则完整保留。
- **webhook**：无人类发起人，`initiatorUserId = null`（或服务账号），`approverUserId = workflow 配置指定的审批人`。
- 收件箱查询、确认/拒绝校验**一律用 `approverUserId`**，三种来源统一到审批人视角。

**理由**：用户原则是「谁发起谁审批，不要绕来绕去」。但三场景里 webhook **没有人类发起人**，身份等式在此断裂——若强塞「服务账号 = 发起人 = 审批人」，会丢失「哪个外部事件触发」的审计线索，且服务账号无法真正点确认。拆一个 `approverUserId` 字段是保住原则（chat/pageAction 仍是发起人自审）又覆盖 webhook 的最小代价，不引入指派 UI / 多级审批 / 通知路由。

**替代方案**：
- *纯身份等式（仅 `initiatorUserId`，webhook 用服务账号）* → 审计失真、审批无法落到真人，被否。
- *`ApproverSpec / ApprovalPolicy` 动态指派* → 前一轮设计过，用户否决，过度设计。

### 决策 3：`ApprovalResumeSnapshot` 复用 chat 快照形状，触发无关

**选择**：定义通用快照类型，字段取自现有 `PendingWriteResumeContext` 的**触发无关子集**（workflowRun、workflowNodeDefs、workflowNodeOutputs、已 compose 的写参数、scopedToolIds、pageContext、taskPlan、steps/observations 视需要）。chat 恢复上下文（sessionId/runId/turnId）放到快照的 `channel` 分支里，pageAction/webhook 放各自 channel。

```ts
type ApprovalResumeSnapshot = {
  version: 1;
  workflowRun: WorkflowRunState;
  workflowNodeDefs: WorkflowNodeDef[];
  workflowNodeOutputs: Record<string, unknown>;
  pendingWrite: { name: string; arguments: Record<string, unknown>; riskLevel: ToolLevel };
  scopedToolIds: number[];
  pageContext?: unknown | null;
  channel:
    | { kind: 'chat'; sessionId: string; runId: number; turnId: number; resume: PendingWriteResumeContext }
    | { kind: 'page_action'; pageActionRunId: number }
    | { kind: 'webhook'; /* 回调/幂等信息 */ };
};
```

**理由**：chat 已验证该形状可恢复 graph；把它做成 discriminated union 让恢复入口按 `channel.kind` 分派到对应 runner，engine 主体逻辑复用。

**替代方案**：*每链路独立快照类型* → 恢复入口无法统一，收件箱确认按钮要分三种代码路径。

### 决策 4：pageAction runner 从同步改为「可挂起」状态机

**选择**：`PageActionRunStatus` 增加 `awaiting_approval`。runner 执行到 `await_user_confirm` 时：写 `ApprovalRequest(source=page_action, pageActionRunId)`，把 run 置 `awaiting_approval` 并返回（结束当前进程执行），不再阻塞。确认接口触发恢复入口：加载快照 → 从挂起节点续跑 `write_data → summarize` → run 置 `completed`。拒绝则 run 置 `cancelled`。

**理由**：非交互触发不能进程内 await。落库挂起 + 独立恢复入口是唯一可跨进程/重启的方式，且天然幂等（run 状态 + `ApprovalRequest.status` 双重保护）。

**替代方案**：*保持同步、写前弹确认* → pageAction 无实时通道等待用户，不可行。

### 决策 5：触发权限派生自 `RoleTool`，不新建 `RoleWorkflow` 表

**选择**：不新增 workflow 级授权表。触发权限**派生**自既有 `RoleTool`：workflow 的 `write_data` 节点 `input.toolId` 是 HTTP Tool，本就受 `RoleTool`（+ App 默认共享）管；必需 HostTool 受 `RoleHostTool` 管。触发前与恢复前对这些**必需写工具**做 fail-fast 权限检查，缺权限即拒绝、不生成审批卡。校验主体随来源不同：

- **chat / pageAction**：校验**发起人**（= 审批人）持有 workflow `write_data.toolId` 的 `RoleTool`。
- **webhook**：无人类发起人，改为校验 **workflow 配置指定的 `approverUserId`** 持有该 `RoleTool`。

**恢复前二次校验**：确认时重新校验权限主体仍持有写工具权限，防止授权期间被回收。

**理由**：`RoleTool` 已是执行的真门——没有写工具权限，`write_data` 必然失败。再叠一层 `RoleWorkflow` 是在同一件事上做重复授权，与 `app-default-capability-sharing`「削减重复绑定层」方向相悖。派生校验零新表、复用现有 gate，只是把「运行到 `write_data` 才失败」提前成「触发前 fail-fast」，避免生成永远确认不了的审批卡。

**权衡（明确接受）**：放弃「workflow 级独立授权粒度」——两个共享同一批工具的 workflow 无法分别授权谁能跑。用户认「tool 才是执行底层」，此粒度可舍。若未来确需 workflow 级独立授权，可再引入 `RoleWorkflow` 作为增量收紧层。

**替代方案**：
- *新建 `RoleWorkflow` 表* → 与 `RoleTool` 重复授权、增加 B 端配置负担，被否。
- *仅在运行到 `write_data` 时才靠 `SkillTool ∩ RoleTool` 失败* → 会先生成审批卡再失败，体验差、浪费一次审批往返。

### 决策 6：chat 保留实时快路径 + 镜像 SSOT

**选择**：chat 仍走现有 Redis 实时门（同会话在线秒级恢复体验不变），但**同时**创建 `ApprovalRequest(source=chat, sessionId)` 作为离线/跨端 SSOT。恢复时任一路径先到者胜，另一路径通过 `status` 幂等短路。

**理由**：不牺牲 chat 现有体验，又让 chat 待办出现在统一收件箱。避免大改 chat 交互。

**替代方案**：*chat 也改成纯收件箱恢复* → 退化在线体验（本来 SSE 秒回，变成要去收件箱点），用户体验倒退。

## 风险 / 权衡

- **[双写不一致]** chat 同时写 Redis + ApprovalRequest，两者状态可能漂移 → 以 `ApprovalRequest.status` 为权威，Redis 仅缓存；恢复入口先做 `status` CAS（pending→approved）再执行，失败即短路。
- **[并发确认]** 同一 request 被重复点击/多端确认 → `status` 乐观锁 + `idempotencyKey`；恢复执行前 `updateMany(where status=pending) set approved` 命中 0 行即视为已处理。
- **[快照膨胀]** `resumeSnapshot` JSON 过大（大 observation/pageContext）→ 沿用 chat 已有裁剪策略；必要时 observation 只存 ref，不存全量正文。
- **[权限 TOCTOU]** 触发到确认之间 Role 变更 → 恢复前二次校验（决策 5）；无权则 request 置 `cancelled` 并提示。
- **[孤儿挂起]** 用户永不确认 → 可选 `expiresAt` + 定时任务置 `expired`（P2）；P0 允许长期 pending，仅在列表标注停留时长。
- **[BREAKING PageActionRunStatus]** 现有消费方需处理新枚举值 `awaiting_approval` → 迁移文档标注；B 端列表/前端补充展示分支。

## 迁移计划

1. **P0 数据层**：加 `ApprovalRequest / ApprovalStatus / ApprovalSource`，`PageActionRunStatus += awaiting_approval`；生成迁移。存量数据无需回填。（不新增授权表。）
2. **P0 权限**：接入派生自 `RoleTool` 的 `write_data` 工具 fail-fast 校验（先 chat skill + pageAction；webhook 待入口就绪）。默认策略：迁移期可用 env `WORKFLOW_TRIGGER_PERMISSION` 关闭校验以兼容存量（回滚开关）。
3. **P1 引擎**：pageAction runner 可挂起 + 恢复入口；`ApprovalResumeSnapshot` 抽取；chat 镜像 SSOT。
4. **P1 收件箱**：list/confirm/reject API + 前端表格。
5. **P2**：webhook 触发入口接入同一挂起/恢复；`expiresAt` 过期任务。

**回滚**：`WORKFLOW_TRIGGER_PERMISSION=false` 关权限校验；审批门可通过 workflow 配置/env 关闭回到旧同步行为（pageAction 直接写）。新表可保留不影响旧路径。

## 待解决问题

- webhook 的审批人（`approverUserId`）配置载体：放 `Workflow` 级字段、`PageAction`/触发绑定级、还是独立 webhook 配置表？（P2 落地前暂定 workflow 级配置的审批人）
- 拒绝后是否需要保留可「重新发起」入口，还是彻底终止（P0 暂定彻底终止 = run cancelled）。
- 收件箱通知渠道（站内红点/邮件）是否 P1 必需，还是仅列表轮询（P0 仅列表）。
