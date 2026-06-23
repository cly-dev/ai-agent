# 前端 Host Tool 数据模型

> Prisma：`HostPage` / `HostTool` / `AgentHostTool` / `SkillHostTool`  
> 迁移：`20260617140000_host_tool_tables`  
> **SDK 对接**：[host-bridge-sdk-frontend.md](./host-bridge-sdk-frontend.md)  
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

**C 端列表 / Plan 与运行时 fallback 的差异：**

| 场景 | C 端 `skills/client` / Plan | 运行时 `resolvePreferredHostToolIds` |
|------|----------------------------|-------------------------------------|
| Agent 已绑 Host Tool，Skill **已** `PUT host-tools` | ✅ 可见 / 可解析 | ✅ |
| 仅 Agent 白名单，Skill **未**绑 `SkillHostTool` | ❌ 不可见 | ⚠️ 可能 fallback 到 Agent 全量白名单（日志 warn） |

B 端配置 Host Tool 场景时，**务必**在 Skill 上执行 `PUT /skill/:id/host-tools`，不要只绑 Agent。

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

## 7. 管理端 API（`/admin` 前缀）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/host-page` | 创建页面登记 |
| GET | `/host-page/by-app-client/:appClientId` | 分页列表 |
| GET/PATCH/DELETE | `/host-page/:id` | 详情 / 更新 / 删除 |
| POST | `/host-tool` | 创建工具（`hostPageId` 空 = 通用） |
| GET | `/host-tool/by-app-client/:appClientId` | 分页列表（`?scope=` / `?genericOnly=true`） |
| GET/PATCH/DELETE | `/host-tool/:id` | 详情 / 更新 / 删除 |
| GET | `/agent/:agentId/app-client/:appClientId/host-tools` | Agent 可绑工具（含 `bound`） |
| POST/DELETE | `/agent/.../host-tools` | 绑定 / 解绑 |
| GET | `/skill/:skillId/host-tools` | Skill 关联列表 |
| PUT | `/skill/:skillId/host-tools` | 全量替换 Skill 关联 |

**Agent / Skill 详情内嵌**（前缀 `/admin`）：`GET /agent/:id` 返回 `hostTools` + `agentHostTools`；`GET /skill/:skillId` 返回 `hostTools` + `skillHostTools`。见 [host-tool-agent-skill-api-frontend.md](./host-tool-agent-skill-api-frontend.md)。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/host-tool/client/register` | 幂等注册元数据（首次入库） |
| GET | `/host-tool/client/catalog` | 查询目录 |

详见 [host-tool-client-register-frontend.md](./host-tool-client-register-frontend.md)、[host-tool-admin-frontend.md](./host-tool-admin-frontend.md)。

---

## 8. 实施顺序

1. ✅ 建表 + 管理 API + `host_action.hostTools`  
2. Plan `hostEffect`（从 SkillHostTool 种子化）  
3. LLM 注入（`LLM` / `BOTH`）

---

## 9. 相关文档

| 文档 | 内容 |
|------|------|
| [host-tool-admin-frontend.md](./host-tool-admin-frontend.md) | **B 端管理后台对接** |
| [host-tool-client-register-frontend.md](./host-tool-client-register-frontend.md) | **C 端注册 + SDK** |
| [host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md) | pageContext、completed SSE |
