# 事件场景 · Webhook · Workflow 自动化方案

> 版本：设计稿（2026-06）  
> 状态：**未实现** — 供评审与分期开发  
> 相关：[skill-data-model.md](./skill-data-model.md)、[plan-node.md](./plan-node.md)、[write-confirmation-frontend.md](./write-confirmation-frontend.md)、[skill-admin-frontend.md](./skill-admin-frontend.md)

---

## 1. 目标

在现有 **AppClient → Agent → Skill → LangGraph Plan/ReAct** 之上，增加 **事件驱动自动化**：

| 能力 | 说明 |
|------|------|
| **Webhook 入站** | 业务系统 / 第三方平台推送事件 |
| **事件场景（EventScenario）** | 配置「什么事件 → 跑哪个 Skill/workflow」 |
| **Workflow 执行** | 异步触发 `AgentEngine.run`，复用 `Skill.config.workflow` |
| **写入审核** | 涉及写操作时，指定 **多名审核用户**；审核人在 **待办列表** 中 **批量确认或取消** |

聊天发消息路径 **不变**；事件自动化是第二条 Run 入口。

```text
                    ┌─────────────────┐
  用户聊天消息 ──────►│                 │
                    │  AgentEngine    │──► LangGraph（intent → plan → …）
  Webhook 事件 ─────►│  .run()         │
                    └────────┬────────┘
                             │
              写操作门闩 ────┴──► WorkflowWriteApproval（指定审核人待办列表）
```

---

## 2. 设计原则

1. **Workflow 步序复用** `Skill.config.workflow`，不另起 DSL（见 [skill-admin-frontend.md](./skill-admin-frontend.md) §7）。
2. **写确认复用** 现有 `PendingWriteConfirmationStore` + `write_confirmation_gate`；扩展为 **工作流待办**，而非仅 SSE 弹窗。
3. **审核人可配置、可多选**；仅名单内用户可在待办列表操作。
4. **Headless 场景默认不自动写入**；`headless_auto` 仅 L1 且显式开启 `autoApprove` 时允许。
5. **Host Tool** 在无浏览器上下文时跳过或转人工（见 §8）。

---

## 3. 概念与实体

```text
AppClient
  ├── WebhookEndpoint          入站 URL + 验签密钥
  ├── EventScenario            事件匹配 + 绑定 Agent/Skill + 审核人 + 执行策略
  ├── EventRecord              原始事件审计（幂等）
  └── WorkflowRun              一次场景触发的执行实例

WorkflowWriteApproval          写操作待办（关联 pending + 审核人名单）
  └── 审核人 C 端列表 / 批量 confirm · cancel
```

| 实体 | 职责 |
|------|------|
| **WebhookEndpoint** | `POST /webhooks/:dsn/:key`；HMAC 验签、IP 白名单 |
| **EventScenario** | `eventType` + `filterJson` → 绑定 `agentId` / `skillId` / `approverUserIds` |
| **EventRecord** | 入站 payload 落库；幂等键去重 |
| **WorkflowRun** | 状态机；关联 `AgentRun`、`EventRecord`、`EventScenario` |
| **WorkflowWriteApproval** | 写门闩对外待办；供指定用户列表查询与批量操作 |

---

## 4. 数据模型（Prisma 草案）

### 4.1 枚举

```prisma
enum WorkflowTriggerSource {
  webhook
  schedule
  manual
}

enum WorkflowRunStatus {
  pending
  running
  awaiting_write_approval   // 已产出草稿，等待审核人确认写入
  success
  failed
  skipped
  cancelled
}

enum WorkflowExecutionMode {
  headless_draft            // 只跑到 present，不 submit
  notify_approvers          // 默认：写操作进入待办列表
  headless_auto             // 仅 L1 + autoApprove（慎用）
}

enum WorkflowWriteApprovalStatus {
  pending
  confirmed
  cancelled
  expired
}

enum WriteApprovalPolicy {
  any_approver              // 任一审核人确认即可执行（默认）
  all_approvers             // 须全部确认（二期）
}
```

### 4.2 表结构

```prisma
model WebhookEndpoint {
  id            Int      @id @default(autoincrement())
  appClientId   Int
  key           String   // URL 段，如 "amazon-reviews"
  secret        String
  isActive      Boolean  @default(true)
  allowedIps    String[] @default([])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  appClient  AppClient       @relation(...)
  scenarios  EventScenario[]

  @@unique([appClientId, key])
}

model EventScenario {
  id                Int      @id @default(autoincrement())
  appClientId       Int
  webhookEndpointId Int?
  name              String
  description       String?
  isActive          Boolean  @default(true)
  priority          Int      @default(100)

  eventType         String
  filterJson        Json?

  agentId           Int
  skillId           Int?
  executionMode     WorkflowExecutionMode @default(notify_approvers)

  contextMapping    Json     // userMessage / pageContext 模板
  sessionStrategy   Json     // 见 §6

  /// 写操作审核：指定 App 用户 ID 列表（多选）
  approverUserIds   Int[]
  writeApprovalPolicy WriteApprovalPolicy @default(any_approver)
  approvalExpireMinutes Int @default(1440)  // 默认 24h

  outboundWebhook   Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  agent   Agent   @relation(...)
  skill   Skill?  @relation(...)
  runs    WorkflowRun[]
}

model EventRecord {
  id                Int      @id @default(autoincrement())
  appClientId       Int
  webhookEndpointId Int?
  idempotencyKey    String?
  eventType         String
  payload           Json
  normalized        Json?
  receivedAt        DateTime @default(now())

  @@unique([appClientId, idempotencyKey])
  @@index([appClientId, eventType, receivedAt])
}

model WorkflowRun {
  id                Int      @id @default(autoincrement())
  appClientId       Int
  eventScenarioId   Int
  eventRecordId     Int
  agentRunId        Int?
  sessionId         String?
  actorUserId       Int?     // 执行身份（系统账号或责任人）
  status            WorkflowRunStatus
  executionMode     WorkflowExecutionMode
  error             String?
  outputSummary     Json?
  startedAt         DateTime?
  finishedAt        DateTime?
  createdAt         DateTime @default(now())

  scenario     EventScenario @relation(...)
  eventRecord  EventRecord   @relation(...)
  agentRun     AgentRun?     @relation(...)
  approvals    WorkflowWriteApproval[]
}

model WorkflowWriteApproval {
  id                Int      @id @default(autoincrement())
  appClientId       Int
  workflowRunId     Int
  sessionId         String
  primaryRunId      Int      // gate 时 primary AgentRun
  turnId            Int
  status            WorkflowWriteApprovalStatus @default(pending)

  /// 场景配置的审核人快照（创建时复制，避免场景改配置影响在途单）
  approverUserIds   Int[]
  writeApprovalPolicy WriteApprovalPolicy

  /// 展示用摘要（不含完整 tool 参数，防泄露）
  title             String
  summaryMarkdown   String?  // present 步用户层草稿摘要
  entityType        String?
  entityId          String?
  skillName         String?
  scenarioName      String

  /// 实际操作人（确认/取消时写入）
  actedByUserId     Int?
  actedAt           DateTime?
  expireAt          DateTime

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  workflowRun WorkflowRun @relation(...)

  @@index([appClientId, status, expireAt])
  @@index([workflowRunId])
}
```

### 4.3 与现有写确认 Redis 的关系

`PendingWriteConfirmationSnapshot` 扩展字段（向后兼容）：

```typescript
type PendingWriteConfirmationSnapshot = {
  // …现有字段
  source?: 'chat' | 'workflow';
  workflowRunId?: number;
  workflowWriteApprovalId?: number;
  approverUserIds?: number[];
  writeApprovalPolicy?: 'any_approver' | 'all_approvers';
};
```

- **聊天路径**：`source` 缺省为 `chat`，行为与 [write-confirmation-frontend.md](./write-confirmation-frontend.md) 一致（SSE 弹窗 + 会话内 confirmWrite）。
- **工作流路径**：`source=workflow`，同时创建 `WorkflowWriteApproval` 行；**不依赖** 审核人正在看该 Session 的 SSE。

---

## 5. Webhook 入站

### 5.1 路由

```http
POST /webhooks/:dsn/:endpointKey
Headers:
  X-Webhook-Signature: sha256=<hex>
  X-Webhook-Id: <idempotency-key>
  X-Webhook-Timestamp: <unix-seconds>
Content-Type: application/json
```

| 步骤 | 说明 |
|------|------|
| 验签 | `HMAC-SHA256(secret, timestamp + "." + rawBody)` |
| 防重放 | timestamp 窗口 ±5 分钟 |
| 幂等 | `(appClientId, X-Webhook-Id)` 唯一；重复返回 `200` + 已有 `workflowRunIds` |
| 异步 | 落 `EventRecord` 后入 Redis 队列，HTTP **202** 返回 |

### 5.2 EventEnvelope（内部标准格式）

```typescript
type EventEnvelope = {
  eventId: string;
  eventType: string;       // 如 "review.created"
  occurredAt: string;
  source: string;
  entity?: { type: string; id: string; shopId?: string };
  data: Record<string, unknown>;
  metadata?: { locale?: string; traceId?: string };
};
```

各业务 payload 经 **适配器**（按 endpoint / eventType 配置）映射为 Envelope，避免在引擎代码中硬编码字段解析。

---

## 6. 事件场景与 Workflow 执行

### 6.1 场景匹配

```text
候选 = EventScenario
  WHERE appClientId = ? AND isActive
    AND eventType = envelope.eventType
ORDER BY priority ASC
→ 对每条执行 filterJson（JSONLogic）
```

`contextMapping` 示例：

```json
{
  "userMessageTemplate": "新差评：reviewId={{entity.id}}，星级={{data.rating}}",
  "pageContext": {
    "page": "review-detail",
    "entity": { "type": "review", "id": "{{entity.id}}" }
  }
}
```

模板引擎：**Handlebars**（配置化，符合 no-hardcoded-intent 约束）。

### 6.2 sessionStrategy

| 类型 | 行为 |
|------|------|
| `system` | 固定系统 `actorUserId` + 独立 automation Session |
| `per_entity` | `sessionId` 按 `entityType:entityId` 复用 |
| `fixed` | 配置固定 `sessionId` |

工作流 Run 调用：

```typescript
AgentEngine.run({
  userId: actorUserId,
  sessionId,
  input: renderedMessage,
  requestedSkillId: scenario.skillId,
  pageContext,
  triggerMeta: { source: 'workflow', workflowRunId, eventRecordId },
});
```

内层 Plan 优先 `Skill.config.workflow`（已有 `resolveTaskPlan` 路径）。

### 6.3 WorkflowRun 状态机

```text
pending → running
running → awaiting_write_approval   （写门闩）
running → success                   （无写 / headless_draft 结束）
running → failed
awaiting_write_approval → success   （审核确认 + worker 写完）
awaiting_write_approval → cancelled （审核取消）
awaiting_write_approval → expired   （超时）
```

---

## 7. 写入审核（核心）

### 7.1 何时进入待办

与现有规则一致（[write-confirmation-frontend.md](./write-confirmation-frontend.md) §2）：

- Tool `riskLevel` 为 L2/L3，或 `isMutation === true`
- Plan 路径：`read → compose_write → present → write_confirmation_gate`

**工作流额外逻辑：**

1. `EventScenario.approverUserIds` **非空** → 创建 `WorkflowWriteApproval`，`WorkflowRun.status = awaiting_write_approval`。
2. `approverUserIds` **为空** → 配置校验失败（创建场景时 API 拒绝）；自动化场景 **必须** 指定审核人。
3. `executionMode = headless_draft` → 在 `present` 后结束，**不** 创建待办、不执行 write。
4. `executionMode = headless_auto` → 仅当全部待写 Tool 为 L1 且场景 `autoApprove=true` 时跳过待办（Phase 2；MVP 不开放）。

### 7.2 审核策略

| `writeApprovalPolicy` | 行为 |
|---------------------|------|
| `any_approver`（默认） | **任一** 指定审核人确认 → 执行写入；任一审核人取消 → 整单取消 |
| `all_approvers`（二期） | 记录每人确认；全员确认后执行；任一人取消则作废 |

MVP 仅实现 `any_approver`。

### 7.3 待办内容与权限

| 字段 | 列表展示 | 详情 |
|------|----------|------|
| `title` | 主标题 | 如「差评自动回复 · review #43595」 |
| `scenarioName` | 场景名 | |
| `skillName` | Skill | |
| `entityType` / `entityId` | 业务实体 | 可跳转宿主页 |
| `summaryMarkdown` | 草稿摘要 | present 用户层 Markdown（截断） |
| `expireAt` | 剩余时间 | |
| `status` | 待处理 / 已确认 / 已取消 / 已过期 | |

**权限：** 当前登录 `userId` ∈ `approverUserIds` 才可操作；否则 `403`。

**不暴露：** 完整 `toolCalls.arguments`、内部 Tool 名（与聊天写确认一致，防参数泄露）。详情页可提供「查看会话」跳转（有权限的审核人可读 Session 内已展示的草稿 blocks）。

### 7.4 确认 / 取消执行

单条与批量共用同一套服务端逻辑：

```text
审核人 POST confirm
  → 校验：status=pending、未过期、userId ∈ approverUserIds
  → 加载 Redis PendingWriteConfirmation（workflowWriteApprovalId）
  → AgentEngine.resumeAfterWriteConfirm({ userId: actedByUserId, sessionId, ... })
  → 更新 WorkflowWriteApproval.status = confirmed
  → 更新 WorkflowRun → running → success（worker 结束后）
  → 可选 outbound webhook

审核人 POST cancel
  → 清除 Redis pending
  → approval.status = cancelled，WorkflowRun.status = cancelled
  → 可选通知原 Session / outbound
```

确认执行身份：**实际操作审核人** `actedByUserId` 写入审计字段；HTTP Tool 仍用 Session 绑定的 integration 凭证（与聊天 confirmWrite 相同）。

### 7.5 与聊天写确认的并存

| 来源 | 用户操作入口 | SSE |
|------|--------------|-----|
| `chat` | 会话内弹窗 `confirmWrite` / `cancelWrite` | `confirmation_required` |
| `workflow` | **待办列表** 确认/取消 | 可选推送给审核人关联 Session；**不强制** |

同一 Session 同时最多一个 pending write（现有约束）；工作流待办与聊天门闩 **互斥**，后触发者返回 `WRITE_CONFIRMATION_CONFLICT`。

---

## 8. Host Tool 与工作流

| executionMode | host_tool 步 |
|---------------|--------------|
| `notify_approvers` | 无在线浏览器 → 标记 skipped，记入 `outputSummary.warnings` |
| 用户打开嵌入页后 | 可选手动「继续执行」补跑 host 步（Phase 2） |

Plan 填框类 Skill 若强依赖 `ON_PLAN_STEP` Host Tool，自动化场景应优先 `headless_draft` 或拆成「服务端写 + 人工填框」两步场景。

---

## 9. C 端 API — 写入审核待办列表

鉴权：`Authorization: Bearer <appUserJwt>` + `X-App-Dsn`（与 [app-client-auth-frontend.md](./app-client-auth-frontend.md) 一致）。

### 9.1 分页列表

```http
GET /workflow-write-approvals?status=pending&page=1&pageSize=20
```

| Query | 说明 |
|-------|------|
| `status` | `pending` \| `confirmed` \| `cancelled` \| `expired`（默认 `pending`） |
| `scenarioId` | 可选，按场景筛选 |
| `entityType` / `entityId` | 可选 |

**服务端过滤：** 仅返回 `approverUserIds` 包含当前 `userId` 的记录。

响应项（`WorkflowWriteApprovalListItem`）：

```typescript
type WorkflowWriteApprovalListItem = {
  id: number;
  workflowRunId: number;
  status: WorkflowWriteApprovalStatus;
  title: string;
  scenarioName: string;
  skillName: string | null;
  entityType: string | null;
  entityId: string | null;
  summaryMarkdown: string | null;  // 列表可截断 200 字
  expireAt: string;
  createdAt: string;
  sessionId: string;               // 跳转会话 / 宿主页用
  primaryRunId: number;
};
```

### 9.2 详情

```http
GET /workflow-write-approvals/:id
```

返回列表字段 + 完整 `summaryMarkdown` + `turnId` + 关联 `eventRecord` 摘要（无敏感 payload）。

### 9.3 单条确认 / 取消

```http
POST /workflow-write-approvals/:id/confirm
POST /workflow-write-approvals/:id/cancel
```

Body 可选：

```json
{ "comment": "已核对回复语气" }
```

响应：`{ approval, workflowRun }`；确认后异步续跑，列表轮询或 WebSocket 刷新状态。

### 9.4 批量确认 / 取消（前端核心）

```http
POST /workflow-write-approvals/batch
```

```json
{
  "action": "confirm",
  "items": [
    { "id": 101 },
    { "id": 102 },
    { "id": 103 }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `action` | `confirm` \| `cancel` |
| `items` | 最多 **50** 条/次 |
| `items[].id` | `WorkflowWriteApproval.id` |
| `items[].comment` | 可选 |

响应（部分成功模型）：

```json
{
  "action": "confirm",
  "total": 3,
  "succeeded": [
    { "id": 101, "workflowRunId": 55, "status": "confirmed" }
  ],
  "failed": [
    { "id": 102, "code": "APPROVAL_EXPIRED", "message": "已过期" },
    { "id": 103, "code": "FORBIDDEN", "message": "无审核权限" }
  ]
}
```

**服务端行为：**

- 逐条校验权限与状态；**每条独立事务**（一条失败不影响其他成功项）。
- 确认项按队列顺序调用 `resumeAfterWriteConfirm`（避免同 Session 并发写冲突）。
- 同一 `sessionId` 的多条若互斥，后者返回 `WRITE_CONFIRMATION_CONFLICT`。

### 9.5 待办数量角标（可选）

```http
GET /workflow-write-approvals/pending-count
→ { "count": 12 }
```

---

## 10. B 端管理 API

前缀 `/admin`（`Authorization: Bearer <adminJwt>`）。

### 10.1 Webhook 与场景

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/app-client/:id/webhook-endpoints` | 创建入站端点 |
| GET | `/app-client/:id/webhook-endpoints` | 分页列表 |
| POST | `/app-client/:id/event-scenarios` | 创建场景（**必填** `approverUserIds`） |
| PATCH | `/event-scenario/:id` | 更新场景 / 审核人 |
| POST | `/event-scenario/:id/test` | 干跑：匹配 + 渲染模板，不执行 |
| POST | `/event-scenario/:id/run` | 手动触发 |

创建场景请求体节选：

```json
{
  "name": "1-star review auto reply",
  "eventType": "review.created",
  "filterJson": { "==": [{ "var": "data.rating" }, 1] },
  "agentId": 1,
  "skillId": 15,
  "executionMode": "notify_approvers",
  "approverUserIds": [1001, 1002, 1003],
  "writeApprovalPolicy": "any_approver",
  "approvalExpireMinutes": 1440,
  "contextMapping": { "...": "..." }
}
```

`approverUserIds`：App 内 **业务用户** ID 多选（B 端用户选择器）；保存前校验用户属于该 `appClientId` 且 `ACTIVE`。

### 10.2 运行与审计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/workflow-runs` | 执行历史（分页） |
| GET | `/workflow-runs/:id` | 含 AgentRun、approvals 时间线 |
| GET | `/event-records/:id` | 原始事件 |
| GET | `/workflow-write-approvals` | 管理端全量待办（可按 appClient / 场景筛） |

---

## 11. 前端 — 写入审核列表（C 端）

### 11.1 页面结构

```text
写入待办 (/approvals 或嵌入宿主「任务中心」)
├── 筛选栏：状态 | 场景 | 实体类型 | 过期时间
├── 表格（可多选）
│   ├── checkbox
│   ├── 标题 / 场景 / 实体
│   ├── 草稿摘要（折叠）
│   ├── 过期倒计时
│   └── 单条操作：确认 | 取消 | 查看详情
└── 底栏批量：已选 N 条 → [批量确认] [批量取消]
```

### 11.2 交互要点

| 项 | 建议 |
|----|------|
| 默认视图 | `status=pending`，按 `expireAt` 升序 |
| 多选 | 跨页选择时仅对 **当前已加载且仍 pending** 的 id 生效；提交前二次确认弹窗 |
| 批量确认 | 展示条数 + 「将执行 N 次数据写入操作」；失败项 Toast + 列表刷新 |
| 单条详情 | 展示 `summaryMarkdown`（Markdown 渲染）；按钮跳转 `sessionId` 对应会话查看完整上下文 |
| 角标 | 轮询 `pending-count` 或 SSE 订阅（二期） |
| 过期 | 行置灰，不可选；`status=expired` |

### 11.3 与聊天写确认 UI 的关系

- 自动化产生的工作流待办：**以列表为主入口**。
- 若审核人恰好打开对应 Session SSE，仍可收到 `confirmation_required`（可选，Phase 2）；**列表操作与 SSE 确认二选一**，以先到达的服务端结果为准。

---

## 12. 出站通知（可选）

`EventScenario.outboundWebhook`：

```json
{
  "url": "https://biz.example.com/hooks/workflow",
  "secret": "...",
  "events": [
    "workflow.awaiting_approval",
    "workflow.approval_confirmed",
    "workflow.approval_cancelled",
    "workflow.success",
    "workflow.failed"
  ]
}
```

HMAC 签名 + 指数退避重试；投递日志表审计。

---

## 13. 端到端示例

**场景：** 亚马逊 1 星差评 → 自动起草回复 → 运营审核后提交。

```text
1. Amazon → POST /webhooks/pms/amazon-events
2. 匹配 EventScenario「1-star review auto reply」
3. WorkflowRun pending → running
4. AgentEngine.run(skillId=15, workflow: read → compose → present)
5. write_confirmation_gate
   ├── Redis pending（source=workflow）
   ├── WorkflowWriteApproval（approverUserIds: [1001,1002,1003]）
   └── WorkflowRun → awaiting_write_approval
6. 审核人 1002 打开「写入待办」列表，勾选 3 条 → 批量确认
7. 服务端逐条 resumeAfterWriteConfirm → worker 写 HTTP → confirm summarize
8. WorkflowRun → success；outbound 通知 ERP
```

---

## 14. 分期实施

> **队列：** 与 Phase 1 **同一 PR 交付**，不提前单独立项；聊天路径暂不迁队列。详见 [workflow-task-queue.md](./workflow-task-queue.md) §0。

### Phase 1 — MVP（建议 PR-A 一体交付）

- [ ] `EventScenario` / `EventRecord` / `WorkflowRun`（含 `approverUserIds` 必填）
- [ ] `WorkflowWriteApproval` + 扩展 `PendingWriteConfirmationSnapshot`
- [ ] C 端：写入待办列表 + 单条/批量 confirm/cancel（批量可先 API 内串行）
- [ ] B 端场景配置 + **`POST /admin/event-scenario/:id/run` 手动触发**（先于 Webhook 联调）
- [ ] `WebhookEndpoint` + `POST /webhooks/:dsn/:key` → **workflow-run 队列** → Worker → `AgentEngine.run`（见 [workflow-task-queue.md](./workflow-task-queue.md)）
- [ ] `executionMode = notify_approvers` + `headless_draft` only

### Phase 2

- [ ] Outbound webhook
- [ ] `headless_auto`（L1 白名单）
- [ ] `all_approvers` 策略
- [ ] 场景测试 API、Event 重放
- [ ] 待办 SSE / 角标推送

### Phase 3

- [ ] Cron `schedule` 触发
- [ ] 同 entity debounce、场景级限流
- [ ] Host Tool 补跑
- [ ] 多实例时聊天迁 `agent-run` 队列（见 [workflow-task-queue.md](./workflow-task-queue.md) PR-C）

---

## 15. 风险与约束

| 风险 | 缓解 |
|------|------|
| 审核人为空 | 创建场景时 API 强制 `approverUserIds.length >= 1` |
| 批量确认同 Session 冲突 | 串行执行 + `WRITE_CONFIRMATION_CONFLICT` 明确报错 |
| 事件风暴 | 场景 `rateLimit`、队列并发上限、entity 级 debounce |
| 无审核人上线 | 待办过期 `expired` + 管理端告警 |
| 参数泄露 | 列表/详情不返回完整 tool arguments |

---

## 16. 代码接入点（实现参考）

| 位置 | 改动 |
|------|------|
| `src/modules/workflow/` | 新模块：Webhook、Scenario、Worker、Approval |
| `PendingWriteConfirmationSnapshot` | 增加 workflow / approver 字段 |
| `AgentEngine.run` / `resumeAfterWriteConfirm` | 接受 `triggerMeta` / `workflowWriteApprovalId` |
| `MessageService.runAgentPipeline` | 抽 `AgentRunLauncher` 供 Worker 复用 |
| `tools` 节点 gate | `source=workflow` 时写 `WorkflowWriteApproval` |
| `docs/write-confirmation-frontend.md` | 增加「工作流待办列表」交叉链接（实现后） |

---

## 17. 文档索引

| 文档 | 关系 |
|------|------|
| [write-confirmation-frontend.md](./write-confirmation-frontend.md) | 聊天内写确认、SSE 协议 |
| [skill-admin-frontend.md](./skill-admin-frontend.md) | Skill workflow 配置 |
| [plan-node.md](./plan-node.md) | Plan compose → present → write 路径 |
| [app-client-auth-frontend.md](./app-client-auth-frontend.md) | C 端待办 API 鉴权 |
