# 消息赞踩 · C 端前端对接说明

> 版本：与 agent-server 当前实现同步（2026-06）  
> 相关接口：见下文 §3–§7  
> 另见：[Chat SSE / Message Blocks](./chat-sse-message-blocks-frontend.md)、[Agent / Skill C 端](./agent-skill-client-api-frontend.md)

---

## 1. 总览

对 **assistant** 消息的点赞/点踩反馈；**无通用评论区**。用户点踩时须填写原因（预设标签和/或补充说明）。

```text
进入会话（已有 sessionId + assistant messageId）
        │
        ├─► GET /chat/feedback/down-reason-tags     （点踩弹窗选项，可缓存）
        │
        ├─► GET /chat/:sessionId/messages/feedbacks?messageIds=…
        │         恢复当前页每条 assistant 气泡的赞踩状态
        │
        └─► 用户操作
              ├─ 点赞 → PUT …/messages/:messageId/feedback  { rating: "up" }
              ├─ 点踩 → 弹窗选原因 → PUT …  { rating: "down", reasonTags?, comment? }
              ├─ 改评 → 同上 PUT（幂等 upsert）
              └─ 取消 → DELETE …/messages/:messageId/feedback
```

| 能力 | 说明 |
|------|------|
| 可评消息 | 仅 `role === "assistant"` 且属于当前 `sessionId` |
| 粒度 | 每用户 × 每消息 **一条** 反馈记录 |
| 点踩校验 | 至少 `reasonTags` 或 `comment` 其一非空；含 `other` 标签时 `comment` 必填 |
| 点赞 | 仅 `{ rating: "up" }`，不可带原因字段 |

**路由前缀**：C 端接口在 `/chat/*`，**无** `/admin` 前缀（与发消息一致）。本地默认后端 `http://localhost:3030`；Vite 开发时需代理 `/chat`。

---

## 2. 鉴权与响应包装

### 2.1 鉴权（与 Chat / Message 相同）

| 项 | 说明 |
|----|------|
| Guard | `UserJwtAuthGuard` + `AppClientDsnGuard` |
| Header | `Authorization: Bearer <用户 JWT>` |
| Header | `X-App-Dsn: <接入方 DSN>` |
| 用户身份 | 从 JWT 解析 `userId`，无需在 body 传 `userId` |

### 2.2 成功响应包装

经 `ReqInterceptor`，HTTP 状态码一般为 **200**，body：

```json
{
  "status": 200,
  "message": "success",
  "data": { }
}
```

业务数据在 **`data`** 字段。

### 2.3 错误响应包装

经 `HttpExceptionFilter`，HTTP 状态码仍为 **200**，body：

```json
{
  "status": 400,
  "message": "点踩须至少选择一个原因标签或填写补充说明",
  "data": {
    "statusCode": 400,
    "message": "点踩须至少选择一个原因标签或填写补充说明",
    "error": "Bad Request"
  }
}
```

前端应以 **`status !== 200`** 或解析 `message` 判断失败，不要仅依赖 `response.ok`（若代理未改状态码）。

| status | 典型场景 |
|--------|----------|
| 401 | JWT 无效 / 缺少 `X-App-Dsn` |
| 404 | 消息不存在、非 assistant、session 不属于当前用户 |
| 400 | 点踩未填原因、非法 tag、点赞带了原因、`other` 未填 comment |

---

## 3. `GET /chat/feedback/down-reason-tags`

### 3.1 说明

返回点踩弹窗用的 **固定标签列表**。key 用于提交 `reasonTags`，label 用于展示。

可在应用启动或首次点踩时拉取并 **内存缓存**（变更频率低）。

### 3.2 请求

```http
GET /chat/feedback/down-reason-tags
Authorization: Bearer <token>
X-App-Dsn: <dsn>
```

### 3.3 响应 `data`

```json
{
  "items": [
    { "key": "factual_error", "label": "事实错误或胡编" },
    { "key": "misunderstood", "label": "没理解我的需求" },
    { "key": "incomplete", "label": "回答不完整" },
    { "key": "wrong_tool", "label": "工具或数据用错了" },
    { "key": "format_bad", "label": "格式难读或展示有问题" },
    { "key": "other", "label": "其他" }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `items[].key` | string | 提交点踩时写入 `reasonTags[]` |
| `items[].label` | string | UI 展示文案 |

---

## 4. `PUT /chat/:sessionId/messages/:messageId/feedback`

### 4.1 说明

对单条 assistant 消息 **点赞或点踩**（幂等 upsert）。已存在则更新；可从赞改踩或反之。

### 4.2 Path 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `sessionId` | string | 32 位 hex 会话 ID |
| `messageId` | number | assistant 消息的数据库 `id`（非 turnId） |

### 4.3 Body

| 字段 | 必填 | 说明 |
|------|------|------|
| `rating` | 是 | `"up"` \| `"down"` |
| `reasonTags` | 点踩时二选一 | 字符串数组，值为 §3 的 `key`；最多 8 个 |
| `comment` | 点踩时二选一 | 补充说明，最长 2000 字；选 `other` 时 **必填** |

**点踩校验（服务端，前端应同步禁用提交）：**

```text
rating === "down" 时：
  (reasonTags.length >= 1) OR (comment 去空白后非空)
  且若 reasonTags 含 "other" → comment 必填
rating === "up" 时：
  不得传 reasonTags / comment
```

### 4.4 请求示例

**点赞：**

```http
PUT /chat/a1b2c3…/messages/42/feedback
Content-Type: application/json

{ "rating": "up" }
```

**点踩（标签 + 补充）：**

```json
{
  "rating": "down",
  "reasonTags": ["incomplete", "format_bad"],
  "comment": "表格列对不齐"
}
```

**点踩（仅标签）：**

```json
{
  "rating": "down",
  "reasonTags": ["misunderstood"]
}
```

**点踩（其他 + 说明）：**

```json
{
  "rating": "down",
  "reasonTags": ["other"],
  "comment": "一直重复上一轮的内容"
}
```

### 4.5 响应 `data` — `MessageFeedbackView`

```json
{
  "messageId": 42,
  "rating": "down",
  "reasonTags": ["incomplete"],
  "comment": null,
  "createdAt": "2026-06-16T03:00:00.000Z",
  "updatedAt": "2026-06-16T03:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `messageId` | number | 与 path 一致 |
| `rating` | `"up"` \| `"down"` | 当前评价值 |
| `reasonTags` | string[] | 点赞时恒为 `[]` |
| `comment` | string \| null | 点赞时为 `null` |
| `createdAt` | string | ISO 8601 |
| `updatedAt` | string | ISO 8601 |

---

## 5. `GET /chat/:sessionId/messages/:messageId/feedback`

查询 **当前用户** 对单条消息的反馈。

- 有记录：`data` 为 `MessageFeedbackView`
- 无记录：`data` 为 `null`（不是 404）

```http
GET /chat/{sessionId}/messages/42/feedback
```

---

## 6. `GET /chat/:sessionId/messages/feedbacks`

### 6.1 说明

批量查询当前用户在本会话内、指定消息 ID 上的反馈。**进入会话或翻页后**，对当前可见的 assistant 消息 ID 批量拉取，用于恢复 UI 状态。

> 路由 `feedbacks` 为静态段，不会与 `:messageId` 冲突。

### 6.2 Query

| 参数 | 必填 | 说明 |
|------|------|------|
| `messageIds` | 是 | 逗号分隔，如 `12,15,18`；最多 **100** 个 |

```http
GET /chat/{sessionId}/messages/feedbacks?messageIds=12,15,18
```

### 6.3 响应 `data`

```json
{
  "items": [
    {
      "messageId": 12,
      "rating": "up",
      "reasonTags": [],
      "comment": null,
      "createdAt": "2026-06-16T02:00:00.000Z",
      "updatedAt": "2026-06-16T02:00:00.000Z"
    },
    {
      "messageId": 15,
      "rating": "down",
      "reasonTags": ["wrong_tool"],
      "comment": "查的是 A 商品却返回 B",
      "createdAt": "2026-06-16T02:05:00.000Z",
      "updatedAt": "2026-06-16T02:05:00.000Z"
    }
  ]
}
```

- 仅返回 **已有反馈** 的消息；未评过的 id **不出现在** `items` 中
- 前端可 `Map<messageId, MessageFeedbackView>` 合并到消息列表

---

## 7. `DELETE /chat/:sessionId/messages/:messageId/feedback`

取消当前用户对该消息的赞踩（删除记录）。

```http
DELETE /chat/{sessionId}/messages/42/feedback
```

成功时 `data` 通常为 `null`（无 body 实体）；前端将对应气泡状态置为「未评价」。

再次点赞/点踩仍走 `PUT`。

---

## 8. 推荐前端流程

### 8.1 会话页初始化

```text
1. GET /chat/:sessionId（或已有消息列表）→ 收集 role=assistant 的 message.id
2. 若 ids 非空 → GET .../messages/feedbacks?messageIds=...
3. 合并到消息 state：message.feedback?: MessageFeedbackView
```

### 8.2 assistant 气泡 UI

```text
┌─────────────────────────────────────┐
│  （assistant 正文 / message blocks）   │
│  [👍] [👎]   ← 仅 assistant 展示     │
└─────────────────────────────────────┘
```

| 状态 | UI |
|------|-----|
| 未评 | 两图标默认色 |
| 已赞 | 高亮 👍 |
| 已踩 | 高亮 👎 |

### 8.3 点赞

```text
点击 👍 → PUT { rating: "up" } → 乐观更新 UI → 失败则回滚并 toast
```

若当前已赞，可 **DELETE** 或再次 PUT down（产品二选一；推荐 DELETE 表示取消）。

### 8.4 点踩（必弹原因）

```text
点击 👎
  → 打开 Modal / Drawer
  → 多选 Checkbox（数据来自 down-reason-tags）
  → 多行输入 comment（placeholder：补充说明，选「其他」时必填）
  → 校验通过才可提交
  → PUT { rating: "down", reasonTags, comment }
```

**前端校验（与后端一致）：**

```ts
function canSubmitDownFeedback(input: {
  reasonTagKeys: string[];
  comment: string;
}): boolean {
  const tags = input.reasonTagKeys;
  const text = input.comment.trim();
  if (tags.length === 0 && !text) return false;
  if (tags.includes('other') && !text) return false;
  return true;
}
```

### 8.5 与 SSE 的关系

- 新 assistant 消息经 SSE `message` / `complete` 落入列表后，初始 **无** feedback
- 用户评过后仅更新本地 state + 服务端 PUT，**无** feedback 专用 SSE 事件
- 多 Tab 同时操作：以最后一次 PUT 为准（每用户一条记录）

### 8.6 `messageId` 从哪来

| 来源 | 说明 |
|------|------|
| `GET /chat/:sessionId` 分页消息 | 每条 `Message.id` |
| `POST /chat` / `POST .../messages` 响应 | 用户消息 id；assistant 需等 SSE 或轮询会话详情 |
| SSE `complete` payload | 若含 `outputMessageId` / message 对象则用其 `id` |

**仅对 assistant 消息的 `id` 调用反馈 API。**

---

## 9. TypeScript 类型与 API 封装

```ts
/** 与后端 ReqInterceptor 一致 */
export type ApiEnvelope<T> = {
  status: number;
  message: string;
  data: T;
};

export type MessageFeedbackRating = 'up' | 'down';

export type MessageFeedbackDownReasonTag = {
  key: string;
  label: string;
};

export type MessageFeedbackView = {
  messageId: number;
  rating: MessageFeedbackRating;
  reasonTags: string[];
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertMessageFeedbackBody =
  | { rating: 'up' }
  | {
      rating: 'down';
      reasonTags?: string[];
      comment?: string;
    };

export type MessageFeedbackBatchData = {
  items: MessageFeedbackView[];
};

export type DownReasonTagsData = {
  items: MessageFeedbackDownReasonTag[];
};

function chatHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getUserToken()}`,
    'X-App-Dsn': getAppDsn(),
    'Content-Type': 'application/json',
  };
}

async function chatJson<T>(input: {
  method: string;
  path: string;
  body?: unknown;
}): Promise<T> {
  const res = await fetch(input.path, {
    method: input.method,
    headers: chatHeaders(),
    body: input.body !== undefined ? JSON.stringify(input.body) : undefined,
  });
  const envelope = (await res.json()) as ApiEnvelope<T>;
  if (envelope.status !== 200) {
    throw new Error(envelope.message || 'request failed');
  }
  return envelope.data;
}

/** 点踩标签（可缓存） */
export function fetchDownReasonTags(): Promise<DownReasonTagsData> {
  return chatJson({ method: 'GET', path: '/chat/feedback/down-reason-tags' });
}

/** 批量拉取本会话赞踩状态 */
export function fetchMessageFeedbacks(
  sessionId: string,
  messageIds: number[],
): Promise<MessageFeedbackBatchData> {
  if (messageIds.length === 0) return Promise.resolve({ items: [] });
  const qs = new URLSearchParams({
    messageIds: messageIds.join(','),
  });
  return chatJson({
    method: 'GET',
    path: `/chat/${sessionId}/messages/feedbacks?${qs}`,
  });
}

export function upsertMessageFeedback(
  sessionId: string,
  messageId: number,
  body: UpsertMessageFeedbackBody,
): Promise<MessageFeedbackView> {
  return chatJson({
    method: 'PUT',
    path: `/chat/${sessionId}/messages/${messageId}/feedback`,
    body,
  });
}

export function removeMessageFeedback(
  sessionId: string,
  messageId: number,
): Promise<null> {
  return chatJson({
    method: 'DELETE',
    path: `/chat/${sessionId}/messages/${messageId}/feedback`,
  });
}

/** 合并批量结果到 Map */
export function feedbackMapFromBatch(
  data: MessageFeedbackBatchData,
): Map<number, MessageFeedbackView> {
  return new Map(data.items.map((row) => [row.messageId, row]));
}
```

### 9.1 Vite 代理示例

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/chat': { target: 'http://localhost:3030', changeOrigin: true },
    },
  },
});
```

---

## 10. 错误文案参考（400）

| message（节选） | 前端处理 |
|-----------------|----------|
| 点踩须至少选择一个原因标签或填写补充说明 | 弹窗内提示，勿关闭 |
| 选择「其他」原因时须填写补充说明 | 聚焦 comment 输入框 |
| 点赞不需要填写原因，请移除 reasonTags 与 comment | 不应出现（仅 up 请求） |
| invalid down reason tag: xxx | 刷新标签缓存后重试 |
| invalid messageId: … | 检查 query 拼接 |

---

## 11. 与管理端区别

| | C 端（本文） | 管理端 |
|---|-------------|--------|
| 前缀 | `/chat/*` | `/admin/*` |
| JWT | 用户 JWT | Admin JWT |
| 能力 | 提交/查询/删除 **自己的** 反馈 | 列表/汇总/详情（只读） |

管理端完整对接说明：[message-feedback-admin-frontend.md](./message-feedback-admin-frontend.md)

---

## 12. 检查清单

- [ ] 仅 `assistant` 消息展示赞踩入口
- [ ] 点踩必弹窗，未填原因禁用提交
- [ ] 选 `other` 时 comment 必填
- [ ] 进会话批量 `feedbacks` 恢复状态
- [ ] 请求带 `Authorization` + `X-App-Dsn`
- [ ] 解析 `ApiEnvelope.status`，非 200 走错误提示
- [ ] `messageId` 使用数据库 Message.id，非前端临时 key
