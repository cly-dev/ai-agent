# 前端 Host Tool 数据模型

> Prisma：`HostPage` / `HostTool` / `AgentHostTool` / `SkillHostTool`  
> 迁移：`20260617140000_host_tool_tables`  
> 相关：[host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md)、[host-bridge-frontend.md](./host-bridge-frontend.md)

---

## 1. 设计原则：通用 + 页内，混合管理

| 类型 | `hostPageId` | 典型例子 | 管理 |
|------|--------------|----------|------|
| **通用工具** | `null` | `refreshEntity`（按 entity 刷新当前页） | App 建一条，全站复用 |
| **页内工具** | 指向 `HostPage` | `fillReplyDraft`（仅评论详情） | 挂在对应页面下 |

**HostPage** 仍是页面登记与路由对齐（`scope` ≡ `pageContext.page`）；**不必**每个页面都复制一条「刷新」工具。

```text
AppClient
  ├─ HostTool（通用）refreshEntity          hostPageId = null
  ├─ HostPage review-detail
  │    └─ HostTool fillReplyDraft           hostPageId = review-detail
  └─ HostPage order-list
       └─ HostTool openBulkEditModal         hostPageId = order-list
```

---

## 2. 与后端 Tool 的对照

| | **HTTP Tool** | **Host Tool** |
|--|---------------|---------------|
| 资产表 | `Tool` @ `AppClient` | `HostTool` @ `AppClient`（可选归属 `HostPage`） |
| 页面维度 | 无 | 通用工具跨页；页内工具绑定 `hostPageId` |
| Agent 白名单 | `AgentTool` | `AgentHostTool` |
| Skill 关联 | `SkillTool` | `SkillHostTool` |
| 执行 | agent-server HTTP | **浏览器 registry** |

`RoleHostTool` 在 schema 中保留，**暂不实现**（权限跟业务 API 走即可）。

---

## 3. 表说明

### 3.1 `HostPage` — 页面登记

| 字段 | 说明 |
|------|------|
| `scope` | 与 `pageContext.page` 一致，App 内唯一 |
| `label` / `routePattern` | 管理端展示；`routePattern` 不参与运行时解析 |

### 3.2 `HostTool` — 工具元数据

| 字段 | 说明 |
|------|------|
| `appClientId` | App 隔离 |
| `hostPageId` | **可选**。`null` = 通用；非空 = 仅该页 |
| `definitionKey` | App 内唯一，如 `refreshEntity`、`review-detail.fillReplyDraft` |
| `name` | App 内唯一，LLM / SSE 使用 |
| `description` | 给 LLM（B 档） |
| `argsSchema` | JSON Schema |
| `exposure` | `CATALOG` / `ON_COMPLETE` / `LLM` / `BOTH` |
| `argsTemplate` | 如 `{ "entityId": "$entity.id", "entityType": "$entity.type" }` |

**约束**：`@@unique([appClientId, definitionKey])`、`@@unique([appClientId, name])`

### 3.3 通用刷新工具约定

一条通用工具即可覆盖多页 mutation 完成后的同步：

```json
{
  "name": "refreshEntity",
  "hostPageId": null,
  "description": "mutation 成功后，根据当前页 entity 刷新页面数据",
  "argsSchema": {
    "type": "object",
    "properties": {
      "entityType": { "type": "string" },
      "entityId": { "type": "string" }
    },
    "required": ["entityId"]
  },
  "argsTemplate": {
    "entityType": "$entity.type",
    "entityId": "$entity.id"
  },
  "exposure": "ON_COMPLETE"
}
```

前端各页注册**同一个** `refreshEntity` handler，内部按 `entityType` + 自己的 query 做 refetch。

### 3.4 `AgentHostTool` / `SkillHostTool`

- **Agent**：白名单；通用工具绑一次，所有适用的页共享。
- **Skill**：场景绑定 + `trigger`（`ON_MUTATION_SUCCESS` 等）。

---

## 4. 运行时：哪些工具对当前页可见

```text
effectiveHostTools =
  HostTool WHERE appClientId = ? AND isActive
    AND (hostPageId IS NULL OR HostPage.scope = pageContext.page)
  ∩ AgentHostTool
  ∩ SkillHostTool（按 trigger）
  ∩ 浏览器已 register
```

| 工具类型 | 条件 |
|----------|------|
| 通用 | `hostPageId` 为空 + 有 `pageContext.page` |
| 页内 | `HostPage.scope === pageContext.page` |

---

## 5. 示例数据

```sql
-- 页面登记（管理用，工具不强制每页一条刷新）
INSERT INTO "HostPage" ("appClientId", "scope", "label", "updatedAt")
VALUES (1, 'review-detail', '评论详情', NOW());

-- 通用：全 App 一条刷新
INSERT INTO "HostTool" (
  "appClientId", "hostPageId", "definitionKey", "name", "description",
  "argsSchema", "exposure", "argsTemplate", "updatedAt"
) VALUES (
  1, NULL, 'refreshEntity', 'refreshEntity',
  'mutation 成功后按 entity 刷新当前嵌入页数据',
  '{"type":"object","properties":{"entityType":{"type":"string"},"entityId":{"type":"string"}},"required":["entityId"]}',
  'ON_COMPLETE',
  '{"entityType":"$entity.type","entityId":"$entity.id"}',
  NOW()
);

-- 页内：仅评论详情
INSERT INTO "HostTool" (
  "appClientId", "hostPageId", "definitionKey", "name", "description",
  "argsSchema", "exposure", "updatedAt"
) VALUES (
  1, 1, 'review-detail.fillReplyDraft', 'fillReplyDraft',
  '将回复草稿填入评论详情页回复框',
  '{"type":"object","properties":{"text":{"type":"string"}},"required":["text"]}',
  'LLM',
  NOW()
);
```

---

## 6. 前端 registry

```ts
// 通用：各页可复用同一实现
registerHostTool('refreshEntity', async ({ entityType, entityId }) => {
  await refetchByEntity(entityType, entityId); // 页内根据 type 分发
});

// 页内：只在 review-detail setup 里注册
registerPageHostTools('review-detail', {
  fillReplyDraft: { handler: ({ text }) => setDraft(text) },
});
```

DB 中通用工具 `hostPageId=null`；页内工具挂在 `HostPage` 下。**执行仍在浏览器**，DB 只描述元数据。

---

## 7. 实施顺序

1. ✅ 建表（`hostPageId` 可空）  
2. 管理端：App 通用工具 + 按页工具分栏  
3. Plan `hostEffect` + 可选 `hostTool` on completed  
4. LLM 注入（仅 `LLM` / `BOTH` 且页内/通用工具在 effective 集合内）

---

## 8. 相关文档

| 文档 | 内容 |
|------|------|
| [host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md) | pageContext、completed SSE |
