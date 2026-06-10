# 写操作确认 · 前端对接说明

> 版本：与 agent-server 当前实现同步（2026-06）  
> 相关接口：`POST /chat/:sessionId/messages`、`GET /chat/:sessionId/stream`  
> 另见：[Chat SSE · Message Blocks](./chat-sse-message-blocks-frontend.md)

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

当本轮任务带有 **Plan**（`plan → tool → summarize` 等步骤）时，写确认插在 **tools 节点** 与 **resultCheck / summarize** 之间，而不是绕过 Plan。

典型 Plan：`write(tool) → summarize`

```text
plan 节点产出步骤
    │
    ▼
llm（当前步 objective = 写操作）→ 产出 tool_calls
    │
    ▼
tools 节点
    ├── 若同轮含读 + 写：先执行读 Tool，写入 observations / steps
    ├── 写 Tool 进入 pending（Redis），primary run 结束
    └── resumeContext 携带 taskPlan（含已推进的读步）
    │
    ▼
用户 confirmWrite
    │
    ▼
同步执行写 Tool → resolveTaskPlanAdvance（post_tools）
    ├── 下一步是 summarize → worker **跳过 skill/plan/llm**，直接 summarize
    └── 写已执行但 Plan 未结束 → worker 从 **resultCheck** 接续（带 taskPlan / observations）
    └── 写失败 → resultCheck 直接 summarize 报错，**不回 LLM 重试**
```

要点：

| 场景 | 行为 |
|------|------|
| 同轮 read + write | **读先执行**，写暂停确认；observations 已含读结果 |
| Plan 当前步为写 Tool | 确认执行写后按 Plan **推进到下一步** |
| 下一步为 summarize | 确认后 **跳过决策 LLM**，直接 summarize |
| 下一步仍为 tool | worker 从 resultCheck 续跑（极少见；回复类 Plan 通常为 write→summarize） |
| worker run steps | **仅记录**确认后新产生的 step（写 tool / result_check / summarize），不重复 primary 的 skill/plan |

Plan 推进规则与正常 tools 轮次一致，由 `resolveTaskPlanAdvance` 在 `post_tools` 阶段判定；写确认续跑时在 graph 外先执行写，再注入 `pendingSummaryObservation`（若应 summarize）。

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

> **同一时刻** 还可能收到一条 `action: stream` 的 message（`code` 同为 `WRITE_CONFIRMATION_REQUIRED`，`blocks` 含相同文案）。**以 `confirmation_required` 作为弹窗触发条件**；stream 仅作正文展示兜底。

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
3. 对 `taskPlan` 做 `post_tools` 推进；若下一步为 summarize，预置 `pendingSummaryObservation`
4. 从 LLM 节点续跑（`resumeFromLlm`）；若已预置 summarize observation，**跳过决策 LLM** 直接进入 summarize
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
5. **与消息列表**：确认前的 assistant 消息可能仅为提示文案；确认后续跑会产生 **新的 runId** 与完整回复，按 `runId` 分槽展示。

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
- [ ] Plan 写步确认后，若下一步为 summarize，worker run 直接出最终回复
- [ ] 确认/取消空 content 消息：`toolName` 为 `__confirm_write__` / `__cancel_write__`，无空白用户气泡
- [ ] 过期确认仅 `error`，无 `complete`

---

## 10. 服务端实现索引（供排查）

| 模块 | 路径 |
|------|------|
| 写确认拦截 | `src/core/agent-engine/engine/write-confirmation-gate.util.ts` |
| tools 节点暂停 | `src/core/agent-engine/engine/main/agent-lang-graph.runner.ts` |
| pending 存储 | `src/modules/chat/pending-write-confirmation.store.ts` |
| 确认续跑 | `src/core/agent-engine/engine/agent-engine.service.ts` → `resumeAfterWriteConfirm` |
| 发消息入口 | `src/modules/message/message.service.ts` → `runAgentPipeline` |
| SSE 序列化 | `src/modules/chat/chat-sse-payload.util.ts` |
| DTO | `src/modules/message/dto/save-message.dto.ts` |
