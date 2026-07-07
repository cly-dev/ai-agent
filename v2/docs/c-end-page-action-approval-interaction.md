# C 端审批：实体对照数据展示

> 审批详情/收件箱：`GET /approval/inbox`、`GET /approval/:id`  
> 响应字段：**`entityReference`**（参照） + **`writeDraft`**（拟提交）

---

## 1. 两个字段各显示什么

| 区域 | 字段 | 显示内容 |
|------|------|----------|
| **左侧 · 参照** | `entityReference` | 用户当时页上的数据 + 服务端读到的实体 |
| **右侧 · 拟提交** | `writeDraft.presentation` | AI 生成、待审批的正文预览 |
| **右侧 · 高级** | `writeDraft.arguments` | 实际要写接口的参数（可选折叠） |

---

## 2. `entityReference` 结构

```json
{
  "page": "review-detail",
  "routePath": "/reviews/43635",
  "entityType": "review",
  "entityId": "43635",
  "inlineRecords": [
    {
      "kind": "review",
      "record": { "content": "用户页面上的原文…", "id": "43635" }
    }
  ],
  "sources": [
    {
      "ref": "obs:fetch_data:read",
      "action": "fetch_data",
      "toolName": "get_review",
      "toolId": 12,
      "data": { "id": "43635", "title": "…", "body": "…" }
    }
  ]
}
```

### 怎么渲染

**页头锚点**（有则显示一行即可）：

```
{entityType} #{entityId} · {page}
```

**`inlineRecords`** — 页上内联正文（invoke 时 `pageContext.metadata` 里带 `content` 的项）：

- 标题：`kind`（或业务方映射成中文名）
- 正文：优先 `record.content`，其余字段按需展示

**`sources`** — Workflow 已执行的读接口结果：

| `action` | 怎么显示 |
|----------|----------|
| `fetch_data` | 标题用 `toolName`；正文用 `data` 格式化成 JSON 或按字段列表展示 |
| `load_page_context` | 一般是充足度摘要，可折叠 |

多条 `sources` 按 `ref` 排序，各一块卡片即可。

---

## 3. 推荐布局

```
┌─────────────────────┬─────────────────────┐
│ 参照（entityReference）│ 拟提交（writeDraft）   │
├─────────────────────┼─────────────────────┤
│ [锚点] review #43635 │ summaryText         │
│                     │ previewBlocks       │
│ ▼ 页上原文           │                     │
│   inlineRecords[0]  │                     │
│                     │                     │
│ ▼ 服务端读取         │                     │
│   get_review        │                     │
│   sources[0].data   │                     │
└─────────────────────┴─────────────────────┘
```

列表页不必全量渲染：显示 `entityType` + `entityId` + `summary` 即可，点进详情再拉 `GET /approval/:id`。

---

## 4. 注意

- 数据来自**挂起时快照**，不是审批时实时查库。
- 没有 `fetch_data` 节点时，`sources` 可能为空，只显示 `inlineRecords` + 锚点。
- `metadata` 里没有 `content` 的键不会出现在 `inlineRecords`。

---

## 5. 相关 API

```http
GET /approval/inbox?status=pending
GET /approval/:id
Authorization: Bearer <token>
x-app-dsn: <dsn>
```

通过/驳回见 `POST /approval/:id/confirm`、`POST /approval/:id/reject`；invoke 与 SSE 见 [c-end-page-action-integration.md](./c-end-page-action-integration.md)。
