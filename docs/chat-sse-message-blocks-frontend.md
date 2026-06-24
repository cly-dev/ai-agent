# Chat SSE · Message Blocks 前端对接说明

> 版本：与 agent-server 当前实现同步（2026-06）  
> 适用接口：`GET /chat/:sessionId/stream`（`text/event-stream`）  
> **后端发布 / 落库全流程排查**：[assistant-message-publish-flow.md](./assistant-message-publish-flow.md)  
> 写操作确认（`confirmation_required` / `confirmWrite`）：见 [write-confirmation-frontend.md](./write-confirmation-frontend.md)  
> Run 步骤与 Turn 时间线（调试 primary/worker）：见 [agent-run-steps.md](./agent-run-steps.md)

---

## 1. 总览

用户发送消息后，前端应：

1. **先建立 SSE**（或保持长连接），订阅 `sessionId` 对应会话。
2. 监听 5 类事件：`think` | `message` | `host_action` | `complete` | `error`。
3. 助手回复以 **Message Blocks** 呈现；同一条助手消息在 UI 上对应一个「流式消息槽」，按 `runId` 聚合。
4. **本轮结束只看 `complete`**，不要等待 `action: final`（协议已废弃，服务端不再推送）。

```text
用户 POST /chat/:sessionId/messages
        │
        ▼
SSE think ─────────────► 思考区（全文覆盖，非增量）
SSE message (stream) ───► 正文：delta 追加 / full 占位或兜底全文
SSE message (patch) ───► 按 replaceId 替换 loading
SSE complete ───────────► 本轮结束，可落库对齐、关闭 loading
SSE host_action ────────► 宿主页面同步（mutation 成功后，在 complete 之前）
```

> **SDK 一站式对接**：[host-bridge-sdk-frontend.md](./host-bridge-sdk-frontend.md) · 页面上下文与 SSE 细节：[host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md) · 服务端摘要：[host-bridge-frontend.md](./host-bridge-frontend.md)

---

## 2. 连接与鉴权

| 项 | 说明 |
|----|------|
| URL | `GET /chat/{sessionId}/stream` |
| Headers | `Authorization: Bearer <JWT>`、`X-App-Dsn: <dsn>`（与发消息接口一致） |
| `sessionId` | 32 位 hex，大小写不敏感 |
| 编码 | 每条 SSE 的 `event` 为类型名，`data` 为 **JSON 字符串** |

```ts
const es = new EventSourcePolyfill(url, {
  headers: { Authorization: `Bearer ${token}`, 'X-App-Dsn': dsn },
});

es.addEventListener('think', (e) => onThink(JSON.parse(e.data)));
es.addEventListener('message', (e) => onMessage(JSON.parse(e.data)));
es.addEventListener('host_action', (e) => onHostAction(JSON.parse(e.data)));
es.addEventListener('complete', (e) => onComplete(JSON.parse(e.data)));
es.addEventListener('error', (e) => onError(JSON.parse(e.data)));
```

> 原生 `EventSource` 无法带自定义 Header，需 polyfill（如 `@microsoft/fetch-event-source`）或由网关注入 Cookie。

**重连**：服务端会重放最近若干条可重放的 `message`（最多 8 条）。**`confirmation_required` / `write_confirmation_cancelled` 不会进入重放缓冲**；若 Redis 中仍有 pending 写确认，连接 SSE 时会 **从 pending 存储重新下发一条** `confirmation_required`。同一会话请复用同一消息槽，按 `seq` 去重，避免重复渲染。

---

## 3. SSE 事件类型

### 3.1 `think`

```json
{ "content": "正在识别意图…\n正在调用工具：S02S001_1\n" }
```

| 字段 | 说明 |
|------|------|
| `content` | **当前 run 内思考全文**（每次覆盖展示，不要当 token 增量拼接） |

---

### 3.2 `message`（agent-run）

`data` 为扁平 JSON，核心字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `action` | `'stream' \| 'patch'` | 推送语义（见下节） |
| `runId` | `number` | 本轮 AgentRun，用于 UI 消息槽 |
| `turnId` | `number?` | 消息轮次（兜底 `stream full` 时可能出现） |
| `blocks` | `MessageBlock[]?` | `action=stream` 时携带 |
| `patches` | `MessageBlockPatch[]?` | 仅 `patch` 时携带 |
| `stream` | `{ mode, seq }?` | 流控与排序 |
| `code` | `string?` | 机器可读错误码（如 `TOOL_EMPTY_RESULT`） |

**`source: 'message'`**（用户消息 CRUD）与本文无关；若 `data` 含 `source: 'message'`，走消息列表刷新逻辑即可。  
用户发消息时 **不会** 再推 `message.created`。

---

### 3.3 `host_action`

在 `complete` **之前**推送。v0 为批量 `hostTools[]`；**v1 流式 DSL** 见 [host-tool-stream-dsl-frontend.md](./host-tool-stream-dsl-frontend.md)（`stream.mode` + `dsl.op`，末尾 `full` 权威快照）。

```json
{
  "action": "host_action",
  "scope": "review-detail",
  "entity": { "type": "review", "id": "123" },
  "hostTools": [{ "name": "refreshEntity", "args": { "entityId": "123", "entityType": "review" } }],
  "reason": "agent_mutation_success",
  "runId": 42,
  "turnId": 7
}
```

宿主通过 `registerHostAction(scope, handler)` 处理；执行 `hostTools` 后自行决定 UI 反应。详见 [host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md)。

---

### 3.4 `complete`

```json
{
  "source": "agent-run",
  "runId": 216,
  "turnId": 110,
  "status": "success"
}
```

表示本轮编排结束。**收到 `complete` 时 assistant 消息已落库**（`finishAgentRun` 在发 `complete` 之前从 `RunAssistantArtifact` 写入 `Message`，`content` 为 `{"blocks":[...]}`，与 summarize 定稿及 SSE 权威 `full` 一致）。UI 上应结束「输入中/流式中」状态，并可拉历史对齐。

若曾收到 `stream.mode: 'full'` 的权威 blocks，应以该条覆盖 delta 拼接结果；落库内容与该权威快照一致。

写确认暂停（primary `complete`）：落库 **present 草稿**（artifact `phase=draft`）；gate 仅 `confirmation_required` SSE。worker 终稿以 gate 时固化的 **confirmedPreviewSerialized** 为正文，追加执行状态块；SSE `stream.mode=full` 与落库一致（无 loading 占位）。

---

### 3.4 `error`

```json
{ "message": "处理你的请求时遇到问题…", "code": "LLM_TIMEOUT" }
```

展示错误态；不应再等待同 `runId` 的 `complete`。

---

### 3.5 写操作确认（`confirmation_required`）

写 Tool 执行前会暂停并请求用户确认。`message` 事件的 `data.action === 'confirmation_required'`，确认/取消通过 `POST /chat/:sessionId/messages` 的 `confirmWrite` / `cancelWrite` 完成。

完整流程、状态机与 TypeScript 类型见 **[write-confirmation-frontend.md](./write-confirmation-frontend.md)**。

---

## 4. `action` 语义（重点）

### 4.1 `stream` + `stream.mode: 'delta'`

**文本 token 增量**。每条 `blocks` 通常只含一个 `text` block，内容为 **片段**。

```json
{
  "action": "stream",
  "runId": 216,
  "blocks": [{ "type": "text", "content": "晚上好！请问", "format": "markdown" }],
  "stream": { "mode": "delta", "seq": 1 }
}
```

**前端处理**：找到 `runId` 对应槽位，将 `blocks[0].content` **追加**到当前文本 block（或合并为一条 `text` block）。

> **服务端约定（2026-06）**：summarize 阶段 **统一 prose 流式**（`stream.mode: delta` + 定稿 `full`）。`table` / `chart` 等结构化 block 由服务端 ruleBlocks 注入（`loading` → `patch`），LLM 只流式 Markdown 正文；**不会**把 `{"blocks":[...]}` 或代码围栏碎片当 `delta` 推送。无 LLM 流式的兜底路径（错误 fallback、纯规则块）会先 **回放** 正文 delta，再推权威 `full`。

---

### 4.2 `stream` + `stream.mode: 'full'`

**单条完整片段**（非累积全文），用于：

- `loading` 占位；
- 或未走 LLM token 流式时，由服务端将定稿正文 **回放为 delta** 后再推 `full`（与 LLM 流式体验一致）。

```json
{
  "action": "stream",
  "runId": 216,
  "blocks": [{ "type": "loading", "id": "blk-216-0", "hint": "表格加载中…" }],
  "stream": { "mode": "full", "seq": 1 }
}
```

**`loading` 处理**：在 blocks 列表末尾 **追加** 一条 `loading`，记下 `id`（如 `blk-216-0`），渲染骨架屏 / Spinner。

```json
{
  "action": "stream",
  "runId": 216,
  "blocks": [{ "type": "text", "content": "晚上好！请问有什么我可以帮您的吗？", "format": "markdown" }],
  "stream": { "mode": "full", "seq": 4 }
}
```

**一次性文本**：若本轮 **没有** 收到过 `delta`，将该 `text` 设为正文。若已有 `delta`，**以本条 `full` 的 blocks 为准覆盖**本轮槽位（与落库 `content` 一致），不要继续追加 delta。

---

### 4.3 `patch`

**按 id 替换** `loading` 占位，**不推送全量 blocks 列表**。

```json
{
  "action": "patch",
  "runId": 216,
  "patches": [
    {
      "replaceId": "blk-216-0",
      "block": {
        "type": "table",
        "title": "SEO列表",
        "columns": [{ "key": "id", "label": "ID" }],
        "data": [{ "id": "31052893" }]
      }
    }
  ],
  "stream": { "mode": "patch", "seq": 5 }
}
```

**前端处理**：

```ts
for (const { replaceId, block } of patches) {
  const i = blocks.findIndex(
    (b) => b.type === 'loading' && b.id === replaceId,
  );
  if (i >= 0) blocks[i] = block;
  else blocks.push(block); // 兜底：未找到占位则追加
}
```

### 4.4 定稿 `stream` + `mode: full`（权威快照）

**后端不变量**（2026-06）：用户可见 assistant 内容只经 `publishAssistantBlocks` 发布：

1. 先 `RunAssistantArtifact.commit`（落库同源）
2. 再从 artifact 推 **唯一权威** `stream.full`（`blocks` 与 `artifact.serialized` 字节级一致）
3. `finishAgentRun` 仅在权威 full 尚未推送时补推同内容（去重）

流式 `delta` 仅为过程预览；**落库与最后权威 full 始终以 artifact 为准**，不依赖前端 reconcile。

每条用户可见回复在 `complete` 前都会经历：

1. **若干 `stream.delta`**（LLM 实时 token；无 LLM 流时由服务端按 artifact 正文回放）
2. **一条权威 `stream.full`**（payload 来自 artifact，与落库 `Message.content` 一致）
3. 工具类回复可有 **`patch`** 替换 `loading` 占位

仅当本轮从未推过任何 `message` 时，run 收尾可能 **补发** delta+full（与 artifact 一致）。  
**`finishAgentRun` 在 `complete` 前始终再推一条权威 `stream.full`**（与 artifact / 落库 blocks 一致），用于对齐 delta/patch 拼接结果；前端应以 **最后一条** `stream.mode: full` 覆盖槽位。  
前端按 §4.2 处理；**不要**实现 `action: final`。

---

## 5. 推荐时序（前端状态机）

### 5.1 纯文本闲聊

```text
message stream delta seq=1  "晚上好"
message stream delta seq=2  "！请问"
message stream delta seq=3  "有什么…"
message stream full   seq=4  blocks=[...]   // 可选：与 delta 对齐的权威快照
complete
```

→ 只需维护 **一个** `text` block，按 `stream.mode: delta` 追加；若随后收到同 run 的 `stream.full`，用 full 覆盖 delta 拼接结果；然后等 `complete`。

所有 summarize 路径（闲聊、澄清、读/写工具结果、写确认恢复等）均为 **prose 流式**：服务端逐 token 推 **delta**，定稿时推权威 **full**（与落库一致）。前端应以 full 为准对齐。

### 5.2 工具结果 + 表格/图表

```text
message stream full   seq=1   blocks=[loading id=blk-216-0]
message stream delta  seq=2..n  Markdown 正文片段
message patch         seq=n+1  patches=[{ replaceId: blk-216-0, block: table }]
message stream full   seq=last  权威全文（text + table 等，与落库一致，覆盖 delta）
complete 前           seq=final  finishAgentRun 再推一条权威 full（与落库一致）
complete
```

→ `loading` 先占位，`patch` 替换为 table/chart；正文走 **delta** 流式；**`complete` 前最后一条 `stream.full` 为权威快照**。

### 5.3 处理顺序（伪代码）

```ts
type Slot = {
  runId: number;
  blocks: MessageBlock[];
  textBuffer: string; // 可选：仅用于 delta 拼接
  seenSeq: Set<number>;
};

function onAgentMessage(data: AgentMessagePayload, slot: Slot) {
  if (data.runId != null) slot.runId = data.runId;
  if (data.stream?.seq != null) {
    if (slot.seenSeq.has(data.stream.seq)) return;
    slot.seenSeq.add(data.stream.seq);
  }

  switch (data.action) {
    case 'stream':
      if (data.stream?.mode === 'delta') {
        appendTextDelta(slot, data.blocks);
      } else {
        applyStreamFull(slot, data.blocks);
      }
      break;
    case 'patch':
      applyPatches(slot, data.patches ?? []);
      break;
    default:
      break; // 忽略未知 action（含已废弃的 final）
  }
}

function onComplete(slot: Slot) {
  slot.streaming = false;
  // 可选：GET messages 与 slot.blocks 对齐
}
```

---

## 6. Message Block 类型

与后端 `message-blocks.types.ts` 一致。

| type | 用途 | 关键字段 |
|------|------|----------|
| `text` | 叙述、Markdown | `content`, `format?` |
| `loading` | SSE 占位 | `id`, `hint?` |
| `table` | 表格 | `columns[]`, `data[]` |
| `chart` | 图表 | `chartType`, `xAxis`, `series` |
| `metric` | KPI 卡片 | `items[]` |
| `list` | 列表 | `items[]`, `listType?` |
| `alert` | 提示/错误 | `severity`, `message` |
| `code` | 代码块 | `content`, `language?` |
| `quote` | 引用 | `content`, `source?` |
| `image` | 图片 | `url`, `alt?` |

**入库格式**（拉历史消息时）：`message.content` 为字符串，内容为：

```json
{"blocks":[{"type":"text","content":"……","format":"markdown"}]}
```

解析失败时可降级为纯文本展示。历史中 **不会** 包含 `loading` block。

---

## 7. 常见错误与规避

| 现象 | 原因 | 建议 |
|------|------|------|
| 同一段正文出现两次 | 既拼接了 `delta` 又应用了重复的 `stream.full` 全文 | 已有 delta 时忽略等价的 `stream.full`；以 `complete` 收束 |
| 表格闪一下又变空白 | `patch` 前未渲染 `loading`，或 `replaceId` 不匹配 | 严格用 `loading.id === replaceId` 替换 |
| 重连后重复一条 | 重放缓冲 + 本地未去重 | 用 `stream.seq` 或事件指纹去重 |
| 打开会话又弹写确认 | 旧版曾重放 `confirmation_required` | 已修复：仅 pending 存在时下发；确认后勿再弹 |
| 收不到用户消息 SSE | 产品已关闭 | 用户消息靠 POST 响应或拉列表 |
| `think` 内容乱序 | 误把 think 当增量 | think 始终 **覆盖** `content` |

---

## 8. TypeScript 类型（可复制）

```ts
export type MessageBlock =
  | { type: 'text'; content: string; format?: 'markdown' | 'plain' | 'html' }
  | { type: 'loading'; id: string; hint?: string }
  | {
      type: 'table';
      title?: string;
      columns: { key: string; label: string; align?: 'left' | 'center' | 'right' }[];
      data: Record<string, unknown>[];
    }
  | {
      type: 'chart';
      chartType: 'bar' | 'line' | 'pie';
      title?: string;
      xAxis: string[];
      series: { name: string; values: number[] }[];
    }
  | { type: 'metric'; items: { label: string; value: string; delta?: string; trend?: 'up' | 'down' | 'flat' }[] }
  | { type: 'alert'; severity: 'info' | 'warning' | 'error' | 'success'; title?: string; message: string }
  | { type: 'list'; title?: string; listType?: 'bullet' | 'ordered' | 'checklist'; items: { text: string; checked?: boolean }[] }
  | { type: 'code'; content: string; language?: string; filename?: string }
  | { type: 'quote'; content: string; source?: string; url?: string }
  | { type: 'image'; url: string; alt?: string; caption?: string; width?: string };

export type MessageBlockPatch = {
  replaceId: string;
  block: Exclude<MessageBlock, { type: 'loading' }>;
};

export type AgentMessageSsePayload = {
  action: 'stream' | 'patch';
  runId?: number;
  turnId?: number;
  blocks?: MessageBlock[];
  patches?: MessageBlockPatch[];
  code?: string;
  stream?: { mode: 'delta' | 'full' | 'patch'; seq: number };
};

export type CompleteSsePayload = {
  source: 'agent-run';
  runId: number;
  turnId?: number;
  status: string;
};

export type ThinkSsePayload = { content: string };
export type ErrorSsePayload = { message: string; code?: string };
```

---

## 9. 联调检查清单

- [ ] 发消息前或同时建立 SSE，且 Header 与 REST 一致  
- [ ] `think` 使用覆盖展示  
- [ ] `message` 按 `runId` 聚合单条助手消息  
- [ ] `delta` 只追加 text 片段  
- [ ] `loading` 与 `patch.replaceId` 成对处理  
- [ ] 不实现已废弃的 `action: final`；以 `complete` 结束本轮  
- [ ] `complete` 后结束 loading，可选拉历史对齐  
- [ ] `seq` 去重，兼容重连重放  
- [ ] 历史消息解析 `content` JSON 中的 `blocks`  
