# 消息赞踩 · B 端管理后台对接说明

> 版本：与 agent-server 当前实现同步（2026-06）  
> C 端提交能力：[message-feedback-frontend.md](./message-feedback-frontend.md)  
> 相关模块：`MessageFeedback` 表、`/admin/message-feedback/*`

---

## 1. 总览

C 端用户对 **assistant 消息** 点赞/点踩；点踩须填原因。B 端提供 **只读** 查询与汇总，用于质量运营、问题样本回溯。

```text
管理员登录 POST /admin/admin-user/login
        │
        ▼
选择 AppClient（appClientId）
        │
        ├─► GET /admin/message-feedback/by-app-client/:id/summary?days=7
        │         看板：赞踩量、满意度、点踩标签分布、按 Agent 分布
        │
        ├─► GET /admin/message-feedback/by-app-client/:id
        │         反馈列表（筛选 / 分页）
        │
        ├─► GET .../by-session/:sessionId   （会话详情页 Tab）
        │
        └─► GET .../:feedbackId             单条详情 / 抽屉
```

| 能力 | B 端 | C 端 |
|------|------|------|
| 提交赞踩 | ❌ | ✅ `PUT /chat/.../feedback` |
| 查询列表 / 汇总 | ✅ | 仅查自己的 |
| 删除反馈 | ❌（一期） | ✅ `DELETE` 取消自己的评 |

**路由前缀**：全局 `setGlobalPrefix('admin')` → 实际路径 `/admin/message-feedback/...`  
**Swagger**：`http://localhost:3030/docs`（tag：`message-feedback`）

---

## 2. 鉴权

| 项 | 说明 |
|----|------|
| Guard | `AdminPrefixJwtGuard`（JWT payload 须含 `adminRole`） |
| Header | `Authorization: Bearer <管理员 JWT>` |
| 登录 | `POST /admin/admin-user/login`（不走 admin 守卫） |
| App 隔离 | 所有列表/汇总按 **path 中的 `appClientId`** 过滤 |

### 2.1 响应包装

与 C 端相同，成功经 `ReqInterceptor`：

```json
{
  "status": 200,
  "message": "success",
  "data": { }
}
```

错误经 `HttpExceptionFilter`（HTTP 常为 200，`status` 字段为 4xx）。

### 2.2 fetch 示例

```ts
async function adminGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const res = await fetch(`/admin${path}${qs}`, {
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });
  const body = await res.json();
  if (body.status !== 200) {
    throw new Error(body.message ?? 'request failed');
  }
  return body.data;
}
```

---

## 3. `GET /admin/message-feedback/by-app-client/:appClientId/down-reason-tags`

点踩标签字典（与 C 端 `GET /chat/feedback/down-reason-tags` **key/label 一致**）。列表页展示 `reasonTagLabels`、筛选项、图表图例均用此接口或前端缓存。

**无需** `appClientId` 业务校验即可返回相同字典（path 保留与其他接口一致）。

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

---

## 4. `GET /admin/message-feedback/by-app-client/:appClientId/summary`

### 4.1 说明

运维/质量看板核心指标，默认统计 **近 7 天**（`createdAt` 窗口）。

### 4.2 Query

| 参数 | 默认 | 说明 |
|------|------|------|
| `days` | `7` | 统计天数，正整数 |

```http
GET /admin/message-feedback/by-app-client/1/summary?days=30
```

### 4.3 响应 `data`

```json
{
  "windowDays": 7,
  "from": "2026-06-09T04:00:00.000Z",
  "to": "2026-06-16T04:00:00.000Z",
  "totals": {
    "feedback": 120,
    "up": 95,
    "down": 25,
    "upRate": 0.7916666666666666
  },
  "downReasonTagCounts": [
    { "key": "misunderstood", "label": "没理解我的需求", "count": 10 },
    { "key": "incomplete", "label": "回答不完整", "count": 8 }
  ],
  "downByAgent": [
    { "agentId": 1, "agentName": "评论助手", "downCount": 15 },
    { "agentId": 3, "agentName": "客服助手", "downCount": 10 }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `totals.upRate` | `up / feedback`；无反馈时为 `0` |
| `downReasonTagCounts` | 仅 **count > 0** 的标签；一条点踩可多标签，计数可大于 `down` |
| `downByAgent` | 按 `agentId` 快照聚合点踩数，降序 |

---

## 5. `GET /admin/message-feedback/by-app-client/:appClientId`

### 5.1 说明

分页查询本 App 下全部用户反馈，用于 **反馈列表页**。

### 5.2 Query

| 参数 | 说明 |
|------|------|
| `page` | 页码，默认 `1` |
| `pageSize` | 每页条数，默认 `20`，最大 `100` |
| `id` | 反馈主键 |
| `rating` | `up` \| `down` |
| `agentId` | 反馈快照中的 Agent |
| `userId` | 评价用户 |
| `sessionId` | 会话 |
| `messageId` | assistant 消息 |
| `turnId` | MessageTurn |
| `reasonTag` | 点踩标签 key（含该标签的记录） |
| `commentKeyword` | 补充说明模糊搜索 |
| `orderBy` | `id` \| `createdAt` \| `updatedAt`，默认 `id` |
| `order` | `asc` \| `desc`，默认 `desc` |

```http
GET /admin/message-feedback/by-app-client/1?rating=down&reasonTag=misunderstood&page=1&pageSize=20
```

### 5.3 响应 `data`（分页）

```json
{
  "items": [
    {
      "id": 9,
      "messageId": 42,
      "sessionId": "a1b2c3d4e5f6789012345678abcdef01",
      "userId": 1,
      "appClientId": 1,
      "turnId": 88,
      "agentId": 1,
      "agentName": "评论助手",
      "rating": "down",
      "reasonTags": ["misunderstood"],
      "reasonTagLabels": ["没理解我的需求"],
      "comment": "我想分析差评，它却在闲聊",
      "createdAt": "2026-06-16T03:00:00.000Z",
      "updatedAt": "2026-06-16T03:00:00.000Z",
      "message": {
        "id": 42,
        "role": "assistant",
        "contentPreview": "你好！我是评论助手…",
        "createdAt": "2026-06-16T02:59:00.000Z"
      },
      "user": {
        "id": 1,
        "username": "张三",
        "employeeId": "E001",
        "email": "zhang@example.com"
      },
      "session": {
        "id": "a1b2c3d4e5f6789012345678abcdef01",
        "title": "你好",
        "agentId": 1
      }
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 20,
  "totalPages": 2
}
```

| 字段 | 说明 |
|------|------|
| `message.contentPreview` | 正文前 280 字；完整内容需另查 Message / 会话详情 |
| `agentId` / `agentName` | 提交反馈时从 MessageTurn 快照；可能为 `null` |
| `reasonTagLabels` | 由 `reasonTags` + 标签字典解析 |

---

## 6. `GET /admin/message-feedback/by-app-client/:appClientId/by-session/:sessionId`

与 §5 相同分页结构，等价于自动带上 `sessionId` 筛选。用于 **会话详情页 · 用户反馈** Tab。

```http
GET /admin/message-feedback/by-app-client/1/by-session/a1b2…?rating=down
```

---

## 7. `GET /admin/message-feedback/by-app-client/:appClientId/:id`

单条反馈详情（字段与列表 `items[]` 元素相同）。

| HTTP | 场景 |
|------|------|
| 404 | `id` 不存在或不属于该 `appClientId` |

---

## 8. 推荐后台页面结构

### 8.1 质量看板（Quality / Feedback）

```text
┌─────────────────────────────────────────────────────────┐
│ 近 [7▾] 天                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐    │
│  │ 总反馈  │ │ 点赞    │ │ 点踩    │ │ 满意度 upRate│    │
│  │  120    │ │  95     │ │  25     │ │  79.2%       │    │
│  └─────────┘ └─────────┘ └─────────┘ └──────────────┘    │
│  点踩原因分布（柱状/饼图）← downReasonTagCounts            │
│  点踩 by Agent（表格）← downByAgent                       │
└─────────────────────────────────────────────────────────┘
```

数据源：`summary?days=`

### 8.2 反馈列表

| 列 | 字段 |
|----|------|
| 时间 | `createdAt` |
| 评价 | `rating` → 赞/踩 |
| 用户 | `user.username` / `employeeId` |
| Agent | `agentName` |
| 原因 | `reasonTagLabels` + `comment` 摘要 |
| 回复摘要 | `message.contentPreview` |
| 操作 | 查看详情、跳转会话 |

筛选器：`rating`、`agentId`、`reasonTag`（下拉来自 down-reason-tags）、`commentKeyword`、时间（前端本地或后续扩展服务端 `from`/`to`）。

### 8.3 详情抽屉

- 展示 §7 全量字段
- 链接：`sessionId` → 会话详情；`turnId` → MessageTurn 详情（`GET /admin/message-turn/:id`）；`messageId` → 会话消息上下文

### 8.4 与 C 端协同

```text
C 端用户点踩 → 写入 MessageFeedback
B 端列表/汇总只读展示，不在此修改用户评价
```

---

## 9. TypeScript 类型

```ts
export type ApiEnvelope<T> = {
  status: number;
  message: string;
  data: T;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type MessageFeedbackRating = 'up' | 'down';

export type MessageFeedbackDownReasonTag = {
  key: string;
  label: string;
};

export type MessageFeedbackAdminListItem = {
  id: number;
  messageId: number;
  sessionId: string;
  userId: number;
  appClientId: number;
  turnId: number | null;
  agentId: number | null;
  agentName: string | null;
  rating: MessageFeedbackRating;
  reasonTags: string[];
  reasonTagLabels: string[];
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  message: {
    id: number;
    role: string;
    contentPreview: string | null;
    createdAt: string;
  };
  user: {
    id: number;
    username: string;
    employeeId: string;
    email: string;
  };
  session: {
    id: string;
    title: string | null;
    agentId: number | null;
  };
};

export type MessageFeedbackAdminSummary = {
  windowDays: number;
  from: string;
  to: string;
  totals: {
    feedback: number;
    up: number;
    down: number;
    upRate: number;
  };
  downReasonTagCounts: Array<{
    key: string;
    label: string;
    count: number;
  }>;
  downByAgent: Array<{
    agentId: number;
    agentName: string;
    downCount: number;
  }>;
};

export type QueryMessageFeedbackAdmin = {
  page?: number;
  pageSize?: number;
  id?: number;
  rating?: MessageFeedbackRating;
  agentId?: number;
  userId?: number;
  sessionId?: string;
  messageId?: number;
  turnId?: number;
  reasonTag?: string;
  commentKeyword?: string;
  orderBy?: 'id' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
};
```

### 9.1 API 封装示例

```ts
const adminBase = '/admin/message-feedback/by-app-client';

export function fetchFeedbackSummary(appClientId: number, days = 7) {
  return adminGet<MessageFeedbackAdminSummary>(
    `${adminBase}/${appClientId}/summary`,
    { days: String(days) },
  );
}

export function fetchFeedbackPage(
  appClientId: number,
  query: QueryMessageFeedbackAdmin,
) {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== '') params[k] = String(v);
  }
  return adminGet<Paginated<MessageFeedbackAdminListItem>>(
    `${adminBase}/${appClientId}`,
    params,
  );
}

export function fetchFeedbackBySession(
  appClientId: number,
  sessionId: string,
  query?: QueryMessageFeedbackAdmin,
) {
  const params: Record<string, string> = {};
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') params[k] = String(v);
    }
  }
  return adminGet<Paginated<MessageFeedbackAdminListItem>>(
    `${adminBase}/${appClientId}/by-session/${sessionId}`,
    params,
  );
}

export function fetchFeedbackDetail(appClientId: number, id: number) {
  return adminGet<MessageFeedbackAdminListItem>(
    `${adminBase}/${appClientId}/${id}`,
  );
}
```

---

## 10. 数据模型（只读参考）

| 字段 | 来源 | 说明 |
|------|------|------|
| `messageId` | C 端评价目标 | assistant Message |
| `userId` | C 端 JWT | 评价人 |
| `turnId` | 写入时查 `MessageTurn.outputMessageId` | 关联一次 Agent 执行 |
| `agentId` | 同上 `primaryAgentId` | 快照，便于按 Agent 聚合 |
| `reasonTags` | C 端点踩 | JSON 字符串数组 |
| `comment` | C 端点踩 | 补充说明 |

**唯一约束**：`(messageId, userId)` — 每用户每消息一条。

---

## 11. 错误与边界

| status | 场景 |
|--------|------|
| 401 / 403 | 非管理员 JWT |
| 404 | `appClientId` 或反馈 `id` 不存在 |
| 200 + `items: []` | 筛选无结果 |

| 边界 | 说明 |
|------|------|
| `agentId` 为空 | 早期 turn 未关联或快照缺失；列表 `agentName` 为 null |
| 标签计数 | 多标签点踩会使 `downReasonTagCounts` 之和 > `totals.down` |
| 消息正文 | 列表仅 `contentPreview`；Block 结构需查会话/SSE 存档 |
| 管理端删改 | 一期不提供；用户可在 C 端 DELETE 取消 |

---

## 12. 检查清单

- [ ] 管理端请求统一带 **Admin JWT**，路径带 `/admin` 前缀
- [ ] 按当前选中 **AppClient** 传 `appClientId`
- [ ] 看板用 `summary`；列表用分页接口
- [ ] 点踩原因展示用 `reasonTagLabels`，筛选用 `reasonTag` key
- [ ] 会话详情页用 `by-session/:sessionId`
- [ ] 与 C 端文档交叉对照：[message-feedback-frontend.md](./message-feedback-frontend.md)

---

## 13. 二期扩展（未实现）

| 能力 | 说明 |
|------|------|
| 导出 CSV | 按筛选条件导出点踩样本 |
| `from` / `to` 时间筛选 | 列表 query 扩展 |
| 关联 Skill 快照 | 需在 C 端写入 `skillId` 后扩展 |
| 管理端备注 | 运营对反馈的处理状态 |
