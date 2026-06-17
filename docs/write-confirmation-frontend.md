# 写操作确认 · 前端对接说明

> 版本：与 agent-server 当前实现同步（2026-06）  
> 相关接口：`POST /chat/:sessionId/messages`、`GET /chat/:sessionId/stream`、`GET /agent-run/:id`  
> 另见：[Chat SSE · Message Blocks](./chat-sse-message-blocks-frontend.md)、[Run 步骤与 Turn 时间线](./agent-run-steps.md)

---

## 1. 总览

当 Agent 决策要调用 **写操作类 Tool**（修改/删除数据等）时，服务端会 **暂停执行 HTTP**，将待执行的 tool calls 缓存到 Redis，并通过 SSE 请求用户确认。

前端需要：

1. 监听 SSE `message` 事件中的 `action: confirmation_required`
2. 展示确认弹窗（文案由服务端下发，**不暴露具体 Tool 名称与参数**）
3. 用户确认或取消时，再次 `POST /chat/:sessionId/messages`，携带 `confirmWrite` / `cancelWrite`

```text
用户发消息
    │
    ▼
Agent 决策 → 拟执行写 Tool
    │
    ▼
暂停 tools 节点 ──► Redis 缓存 pending（TTL 30min）
    │
    ├── 读 Tool（若有）已执行并写入 steps / observations
    ├── run step: write_confirmation_gate（status=awaiting_user）
    ├── SSE message: confirmation_required
    ├── SSE message: stream (code=WRITE_CONFIRMATION_REQUIRED，展示文案)
    └── SSE complete（primary run 结束，status=success）
    │
    ▼
用户点击「确认」或「取消」
    │
    ├── confirmWrite: true  → 执行写 Tool → 续跑 graph → 正常 SSE 流
    ├── cancelWrite: true   → 丢弃 pending → SSE write_confirmation_cancelled
    └── 新发普通消息       → 清除 pending，走新 run（旧确认失效）
```

### 1.1 与 Task Plan 的配合

当本轮任务带有 **Plan** 时，写确认插在 **tools 节点**（写 HTTP 执行前），而不是绕过 Plan。

**mutation 类（推荐路径）**：`read → compose_write → present → write → confirm`

```text
plan 节点（method=template 或 mutation_template_forced）
    │
    ▼
tools: read_detail
    ▼
llm: compose_write → plan_compose_write（无 HTTP）
    ▼
summarize: present → 用户层 Markdown + plan_draft_reply + pendingToolCalls
    ▼
tools → write_confirmation_gate（primary run 结束）
    ▼
用户 confirmWrite → worker 同步写 HTTP → confirm summarize
```

**无 Plan / 非 mutation 快路径**：`llm → tool_calls → tools → gate`

```text
llm（当前步 objective = 写操作）→ 产出 tool_calls
    ▼
tools 节点
    ├── 若同轮含读 + 写：先执行读 Tool
    ├── 写 Tool 进入 pending（Redis）
    └── resumeContext 携带 taskPlan
    ▼
用户 confirmWrite → worker 执行写 → resolveTaskPlanAdvance（post_tools）
```

要点：

| 场景 | 行为 |
|------|------|
| 同轮 read + write | **读先执行**，写暂停确认；observations 已含读结果 |
| Plan 当前步为写 Tool | 确认执行写后按 Plan **推进到下一步** |
| 下一步为 summarize（`confirm`） | worker **跳过决策 LLM**，直接 summarize 写结果 |
| 下一步仍为 tool | worker 从 resultCheck 续跑（极少见；回复类 Plan 通常为 write→summarize） |
| worker run steps | **仅记录**确认后新产生的 step（写 tool / result_check / summarize），从 step **1** 重新编号 |
| 写失败 | worker summarize **不调 LLM**，仅 alert + metric（与 SSE、落库一致） |
| 写成功 | LLM 生成补充说明；SSE 在 patch 后推送解析 blocks，**complete 前**再推权威 full |
| 整轮轨迹 | `GET /agent-run/:id` → `turnExecutionTimeline` 合并 primary + worker（见 [agent-run-steps.md](./agent-run-steps.md)） |

Plan 推进规则与正常 tools 轮次一致，由 `resolveTaskPlanAdvance` 在 `post_tools` 阶段判定；写确认续跑时在 graph 外先执行写，再注入 `pendingRespond`（若应 summarize）。

### 1.2 Plan compose → present 步（回复类任务）

评论回复等 **mutation** 类 Plan 现为四段式：

```text
read_detail(tool) → compose_write(tool/llm) → present(summarize) → write(tool) → confirm(summarize)
```

| 步 | 节点 | 产出 |
|----|------|------|
| `read_detail` | tools | 读 API observation |
| `compose_write` | llm（bind write tool） | **机器层**：`plan_compose_write` observation（tool + arguments），**不执行 HTTP** |
| `present` | summarize | **用户层**：基于 compose 参数展示 Markdown 草稿；双 gate → `plan_draft_reply` + `pendingToolCalls` |
| `write` | tools（或写确认快路径） | 执行写 API |
| `confirm` | summarize | 写结果说明 |

**compose_write 步**（llm 节点拦截，不进 tools）：

```text
llm（plan:compose_write）→ tool_calls
    ├─ 写入 observation：plan_compose_write
    ├─ Plan 推进 → present
    └─ pendingRespond → summarize（不执行 HTTP）
```

**present 步**（summarize 节点，只展示、不再生成机器层参数）：

```text
summarize（plan:present）
    ├─ 读取 plan_compose_write 作为机器层真值
    ├─ LLM 仅生成用户层 Markdown（prompt: agent.summarize_plan_present_from_compose）
    ├─ 若 compose 缺正文类字段 → 补轮 prose → runtime 注入 arguments
    ├─ 双 gate：用户层 + finalize(composed args) 均成功 → pendingWrite
    ├─ SSE message：phase=draft，仅推送用户层 Markdown
    ├─ observation：plan_draft_reply（draftReply + pendingWriteToolCall）
    └─ pendingToolCalls → tools → write_confirmation_gate
```

| 项 | 说明 |
|----|------|
| 顺序 | **先读 → 再产参 → 再展示 → 再确认 → 再写** |
| 用户可见 | 仅 **present** 步用户层 Markdown；禁止 observation JSON dump |
| 落库 | primary run 结束时入库 **present LLM 展示稿**（自然语言操作说明 + fenced 拟提交正文；不含 gate 弹窗文案） |
| present SSE | LLM 流式 delta → 定稿 full（与落库一致）；submit 执行真值始终来自 compose arguments |
| 机器层真值 | `plan_compose_write`；present 只引用/补正文，不重新 bindTools 产参 |
| 写确认快路径 | **双 gate** 成功 → `summarize → tools → confirmation_required` |
| 写步 fallback | present 未产出 pending 时，`write` 步 llm **复用** `plan_draft_reply` / `plan_compose_write`，不重新产参 |

实现：`task-plan.util.ts`、`task-plan-llm.util.ts`、`plan-compose-write.util.ts`、`plan-draft-summarize.util.ts`、`plan-draft-summarize-llm.util.ts`、`mutation-preview-before-gate.util.ts`、`write-tool-draft-injection.util.ts`。

**写步未完成前禁止 summarize**：若 Plan 队列中仍有 `write-*` tool 步，或 LLM 已产出待执行的写 `tool_calls`，`resultCheck` / `llm` 不会进入 summarize，而是继续 `llm → tools`；写确认仍在 **tools 节点**断开主 run（`confirmation_required`），不会用总结代替确认。

---

## 2. 何时触发写确认

服务端在 **tools 节点执行前** 拦截，满足以下任一条件的 Tool 需要确认：

| 条件 | 说明 |
|------|------|
| Tool `riskLevel` 为 **L2 / L3** | 中高风险写操作 |
| Tool `agentMetadata.isMutation === true` | 元数据标记为变更类操作 |

只读 Tool（L1 且非 mutation）**不会**进入确认流程，直接执行。

Skill 列表接口中的 `requiresWriteConfirmation` 字段可供管理端展示；**运行时以 Tool 元数据为准**。

---

## 3. SSE 事件

连接方式与鉴权同 [chat-sse-message-blocks-frontend.md](./chat-sse-message-blocks-frontend.md) §2。

### 3.1 需要确认（主信号）

`event: message`

```json
{
  "action": "confirmation_required",
  "runId": 65,
  "turnId": 42,
  "message": "即将执行可能修改数据的操作，请确认是否继续。",
  "code": "WRITE_CONFIRMATION_REQUIRED"
}
```

| 字段 | 说明 |
|------|------|
| `action` | 固定 `confirmation_required` |
| `runId` | 本轮 **primary** AgentRun ID（确认前已结束） |
| `turnId` | 当前消息轮次，确认后续跑仍属同一 turn |
| `message` | 弹窗/气泡展示文案（当前为固定中文，勿硬编码，以服务端为准） |
| `code` | 机器可读码 `WRITE_CONFIRMATION_REQUIRED` |

> **同一时刻** 还可能收到一条 `action: stream` 的 message（`blocks` 含草稿正文）。**以 `confirmation_required` 作为弹窗触发条件**；stream 用于展示待确认内容。

**SSE 重连 / 打开会话**：`confirmation_required` **不会**写入重放缓冲。用户已确认或取消后，重连 **不会**再收到该事件。若仍有未消费的 pending（Redis TTL 30 分钟），连接 `GET /chat/:sessionId/stream` 时会 **根据 pending 存储重新下发一条** `confirmation_required`（`runId` / `turnId` 与当时 gate 一致）。

### 3.2 primary run 结束

`event: complete`

```json
{
  "source": "agent-run",
  "runId": 65,
  "turnId": 42,
  "status": "success"
}
```

收到 `confirmation_required` 后的 `complete` **不表示整轮对话结束**，仅表示 **等待确认的第一段 run 已暂停**。此时应：

- 保持输入区可用（用于确认/取消）
- 展示确认 UI，**不要**关闭会话 loading 后当作最终回复（除非产品仅需展示提示文案）

### 3.3 用户取消

`event: message`

```json
{
  "action": "write_confirmation_cancelled",
  "runId": 65,
  "turnId": 42,
  "message": "已取消操作。",
  "code": "WRITE_CONFIRMATION_CANCELLED"
}
```

随后会收到 `event: complete`（`status: success`）。

### 3.4 确认后续跑

用户 `confirmWrite: true` 后：

1. 服务端先 **同步执行** 缓存的写 Tool（HTTP）
2. 创建同一 `turnId` 下的 **worker** AgentRun（`sequence > 1`）
3. 对 `taskPlan` 做 `post_tools` 推进；若下一步为 summarize，预置 `pendingRespond`
4. Graph **START → `resultCheck` 或 `summarize`**（`resumeFromWriteConfirm`；若已有 `pendingRespond` 则直达 summarize）
5. 后续 SSE 与正常对话一致：`think` → `message` stream/patch → `complete`
6. 新的 `runId` 与 primary run **不同**，应用新 `runId` 开消息槽

### 3.5 错误码

`event: error`

| code | 场景 |
|------|------|
| `WRITE_CONFIRMATION_EXPIRED` | 确认已过期（默认 **30 分钟**）、已被消费、或 session 不匹配 |
| `NO_AGENT` | 会话未绑定 Agent（与普通发消息相同） |

```json
{
  "message": "写操作确认已过期或不存在，请重新发起请求。",
  "code": "WRITE_CONFIRMATION_EXPIRED"
}
```

---

## 4. REST：确认 / 取消

**接口**：`POST /chat/:sessionId/messages`  
**Headers**：`Authorization`、`X-App-Dsn`（与发消息一致）

### 4.1 确认并执行

```json
{
  "role": "user",
  "content": "",
  "confirmWrite": true
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `role` | 是 | 固定 `user` |
| `content` | 否 | 可为空；落库时 `content` 为 `null`，`toolName` 为 `__confirm_write__`（便于历史区分，前端列表可隐藏或展示为「已确认」） |
| `confirmWrite` | 是 | `true` 表示确认执行缓存的写操作 |

行为：

- 消费 Redis 中的 pending 快照
- 执行写 Tool → 续跑 Agent
- 通过 SSE 推送后续结果

### 4.2 取消

```json
{
  "role": "user",
  "content": "",
  "cancelWrite": true
}
```

| 字段 | 说明 |
|------|------|
| `cancelWrite` | `true` 表示放弃本次写操作，不执行 Tool；落库 `toolName` 为 `__cancel_write__` |

若 **`confirmWrite` 与 `cancelWrite` 同时为 `true`**，以 **取消** 为准（仅 `cancelWrite` 生效）。

> **过期确认**：pending 不存在时 `resumeAfterWriteConfirm` 返回 `null`，**不会**再发 `complete`；仅 SSE `error`（`WRITE_CONFIRMATION_EXPIRED`）。前端勿在 confirm 请求后无条件等待 `complete`。

### 4.3 新发普通消息（隐式取消）

用户发送 **不含** `confirmWrite` / `cancelWrite` 的普通消息时：

- 服务端会 `clear` 该 session 下未确认的 pending
- 旧确认 **立即失效**，走全新 `run()`

前端应在用户输入新问题时，主动关闭确认弹窗。

---

## 5. 前端状态机建议

```text
                    ┌─────────────────┐
                    │   idle / chat   │
                    └────────┬────────┘
                             │ 用户发消息
                             ▼
                    ┌─────────────────┐
                    │    running      │◄──── SSE think / stream
                    └────────┬────────┘
                             │ confirmation_required
                             ▼
                    ┌─────────────────┐
                    │ await_confirm   │  记录 runId, turnId
                    └────────┬────────┘
              ┌──────────────┼──────────────┐
              │ confirm      │ cancel       │ 新发普通消息
              ▼              ▼              ▼
         ┌─────────┐   ┌──────────┐   ┌─────────┐
         │ running │   │ cancelled │   │  idle   │
         │ worker  │   └──────────┘   └─────────┘
         └────┬────┘
              │ complete
              ▼
         ┌─────────┐
         │  idle   │
         └─────────┘
```

**本地状态建议保存**（服务端不单独提供查询 pending 的 API）：

| 字段 | 用途 |
|------|------|
| `awaitingWriteConfirmation` | 是否展示确认 UI |
| `pendingRunId` | `confirmation_required.runId` |
| `pendingTurnId` | `confirmation_required.turnId` |
| `confirmationMessage` | 弹窗文案 |

---

## 6. UI 建议

1. **弹窗内容**：展示 `message` 文案；**不要**向用户展示 Tool 名、参数 JSON（服务端刻意不返回）。
2. **按钮**：「确认执行」「取消」；取消调用 `cancelWrite: true`。
3. **防重复提交**：确认请求发出后禁用按钮，直到收到 `complete` 或 `error`。
4. **过期提示**：收到 `WRITE_CONFIRMATION_EXPIRED` 时关闭弹窗并 Toast，引导用户重新描述需求。
5. **与消息列表**：primary `complete` 落库 **present 草稿**（与 SSE 权威 `full` 一致）；gate 文案 **仅** `confirmation_required` SSE，不入 artifact/DB。用户确认后 worker 在同一条 turn 消息上发布终稿：**primary 快照草稿** + 写执行产生的结构化状态块（metric 等，来自 payload/observation 规则化）；无快照时走 LLM summarize。取消则在同条消息末尾 **追加**「已取消操作。」
6. **调试轨迹**：排查 step 顺序时用 `turnExecutionTimeline`，勿只看 primary run 的 `steps`。

---

## 7. 时序示例

### 7.1 确认成功

```text
T0  POST { role:user, content:"帮我下架这个 SKU" }
T1  SSE think ...
T2  SSE message { action: confirmation_required, runId:100, turnId:50, ... }
T3  SSE message { action:stream, code:WRITE_CONFIRMATION_REQUIRED, runId:100, ... }
T4  SSE complete { runId:100, turnId:50, status:success }

    [用户点击确认]

T5  POST { role:user, content:"", confirmWrite:true }
T6  SSE think ...
T7  SSE message { action:stream, runId:101, ... }   // worker run
T8  SSE complete { runId:101, turnId:50, status:success }
```

### 7.2 取消

```text
T5  POST { role:user, content:"", cancelWrite:true }
T6  SSE message { action: write_confirmation_cancelled, ... }
T7  SSE complete { status:success }
```

---

## 8. TypeScript 类型（可复制）

```ts
export type WriteConfirmationRequiredPayload = {
  action: 'confirmation_required';
  runId: number;
  turnId?: number;
  message: string;
  code: 'WRITE_CONFIRMATION_REQUIRED';
};

export type WriteConfirmationCancelledPayload = {
  action: 'write_confirmation_cancelled';
  runId?: number;
  turnId?: number;
  message: string;
  code: 'WRITE_CONFIRMATION_CANCELLED';
};

export type ConfirmWriteMessageDto = {
  role: 'user';
  content?: string;
  confirmWrite: true;
  cancelWrite?: false;
};

export type CancelWriteMessageDto = {
  role: 'user';
  content?: string;
  cancelWrite: true;
  confirmWrite?: false;
};
```

**SSE 分发示例**：

```ts
function onMessage(data: Record<string, unknown>) {
  if (data.action === 'confirmation_required') {
    showWriteConfirmDialog({
      runId: data.runId as number,
      turnId: data.turnId as number | undefined,
      message: data.message as string,
    });
    return;
  }
  if (data.action === 'write_confirmation_cancelled') {
    hideWriteConfirmDialog();
    appendSystemHint(data.message as string);
    return;
  }
  // ... 其余 stream / patch 逻辑见 chat-sse-message-blocks-frontend.md
}

async function onConfirmWrite(sessionId: string) {
  await postMessage(sessionId, {
    role: 'user',
    content: '',
    confirmWrite: true,
  });
}

async function onCancelWrite(sessionId: string) {
  await postMessage(sessionId, {
    role: 'user',
    content: '',
    cancelWrite: true,
  });
}
```

---

## 9. 联调检查清单

- [ ] SSE 已连接且能收到 `confirmation_required`
- [ ] 收到确认事件后展示弹窗，且 primary run 的 `complete` 不当作最终业务结果
- [ ] `confirmWrite: true` 后收到 **新 runId** 的 stream 与 `complete`
- [ ] `cancelWrite: true` 后收到 `write_confirmation_cancelled` + `complete`
- [ ] 确认等待期间发新普通消息，旧确认不再可点（或提示已失效）
- [ ] 30 分钟后再确认，收到 `WRITE_CONFIRMATION_EXPIRED`
- [ ] `confirmWrite` 与 `cancelWrite` 同时为 true 时仅取消
- [ ] 未向用户展示 Tool 名称与 arguments（服务端不返回）
- [ ] 同轮 read+write 时，确认前 SSE think 已出现读 Tool 完成
- [ ] Plan present 步：primary run 在 gate 前已有 `summarize`（name=`plan:present`）且 SSE 展示 Markdown 草稿（`phase=draft`）
- [ ] gate 前无预览时：primary run 被阻断（`pendingToolCalls` 清空），不出现无预览的 `confirmation_required`
- [ ] Plan 写步确认后，若下一步为 summarize，worker run 直接出最终回复
- [ ] `GET /agent-run/:primaryRunId` 的 `turnExecutionTimeline` 含 gate + worker steps
- [ ] primary run steps 末尾为 `write_confirmation_gate`，且 run `status=success`
- [ ] 确认/取消空 content 消息：`toolName` 为 `__confirm_write__` / `__cancel_write__`，无空白用户气泡
- [ ] 过期确认仅 `error`，无 `complete`

---

## 10. 服务端实现索引（供排查）

| 模块 | 路径 |
|------|------|
| Plan mutation 模板 / 合规 | `src/core/agent-engine/engine/main/task-plan.util.ts` |
| 外层/内层 Plan 解析 | `src/core/agent-engine/engine/main/task-plan-llm.util.ts` |
| compose_write 拦截 | `src/core/agent-engine/engine/main/plan-compose-write.util.ts` |
| Plan present / 双 gate | `src/core/agent-engine/engine/main/plan-draft-summarize.util.ts` |
| Present 展示 LLM | `src/core/agent-engine/engine/main/plan-draft-summarize-llm.util.ts` |
| Gate 前预览校验 | `src/core/agent-engine/engine/mutation-preview-before-gate.util.ts` |
| Write body 注入 / 校验 | `src/core/tool-engine/write-tool-draft-injection.util.ts` |
| plan_draft_reply observation | `src/core/agent-engine/engine/main/plan-draft-reply.util.ts` |
| 写确认拦截 | `src/core/agent-engine/engine/write-confirmation-gate.util.ts` |
| tools 节点暂停 | `src/core/agent-engine/engine/main/agent-lang-graph.runner.ts` |
| step 编号 / timeline | `src/core/agent-engine/engine/main/agent-run-steps.util.ts` |
| pending 存储 | `src/modules/chat/pending-write-confirmation.store.ts` |
| 确认续跑 | `src/core/agent-engine/engine/agent-engine.service.ts` → `resumeAfterWriteConfirm` |
| 发消息入口 | `src/modules/message/message.service.ts` → `runAgentPipeline` |
| SSE 序列化 | `src/modules/chat/chat-sse-payload.util.ts` |
| DTO | `src/modules/message/dto/save-message.dto.ts` |
