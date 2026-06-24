# Agent / Skill · C 端权限列表 · 前端对接说明

> 版本：与 agent-server 当前实现同步（2026-06）  
> 相关接口：`GET /agent/client/available`、`GET /agent/:agentId/skills/client`  
> 另见：[Skill 数据模型](./skill-data-model.md)、[Chat SSE](./chat-sse-message-blocks-frontend.md)、[消息赞踩](./message-feedback-frontend.md)

---

## 1. 总览

C 端在「选 Agent → 选 Skill → 发消息」流程中，应使用 **按用户角色过滤** 的列表接口，而不是管理端全量列表。

```text
用户登录（JWT + x-app-dsn）
        │
        ▼
GET /agent/client/available
  UserApp.role → RoleTool ∩ AgentTool ∩ allowToolLevel
  至少有一个可用 Tool 的 Agent 才返回
        │
        ▼ 用户选定 agentId
GET /agent/:agentId/skills/client
  RoleSkill 白名单（若已配置）+ isActive
        │
        ▼
POST /chat（创建会话）→ POST /chat/:sessionId/messages
```

| 接口 | 用途 |
|------|------|
| `GET /agent/client/list` | App 下 **全部** Agent（**不做**角色/Tool 过滤） |
| **`GET /agent/client/available`** | 当前用户 **可用** Agent（角色 + Tool 交集） |
| **`GET /agent/:agentId/skills/client`** | 指定 Agent 下当前用户 **可见** Skill |

推荐：**Agent 选择器用 `client/available`**；进入某 Agent 后 **Skill 选择器用 `skills/client`**。

---

## 2. 鉴权（两接口相同）

| 项 | 说明 |
|----|------|
| Guard | `UserJwtAuthGuard` + `AppClientDsnGuard` |
| Header | `Authorization: Bearer <用户 JWT>` |
| Header | `X-App-Dsn: <接入方 DSN>`（常量名 `x-app-dsn`，大小写不敏感） |
| 用户身份 | 从 JWT 解析 `userId`，**无需**在 query/body 传 `userId` |
| App 上下文 | 从 `X-App-Dsn` 解析 `appClientId`，**无需**传 `appClientId` path |

### 2.1 请求示例

```http
GET /agent/client/available
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-App-Dsn: your-app-dsn
```

```http
GET /agent/3/skills/client?keyword=回复
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-App-Dsn: your-app-dsn
```

```http
GET /agent/3/skills/client?page=comment-detail
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-App-Dsn: your-app-dsn
```

### 2.2 fetch 封装示例

```ts
async function clientGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    }
  }
  const url = qs.size ? `${path}?${qs}` : path;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getUserToken()}`,
      'X-App-Dsn': getAppDsn(),
    },
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
```

---

## 3. `GET /agent/client/available`

### 3.1 说明

返回当前用户在当前 App 下 **至少拥有一个可用 Tool** 的 Agent 摘要。

**可用 Tool 判定（服务端）：**

```text
RoleTool（用户角色绑定的 Tool）
  ∩ AgentTool（Agent 绑定的 Tool）
  ∩ Tool.isActive = true
  ∩ Tool.riskLevel ≤ Role.allowToolLevel
```

- 用户未绑定 `UserApp` → 返回 `[]`
- 角色无 `RoleTool` → 返回 `[]`
- 交集为空 → 返回 `[]`（HTTP 200，非 404）

**无需任何 query 参数**，仅需 Header 中的用户 JWT 与 `X-App-Dsn`。

### 3.2 响应

**200** — JSON 数组，按 `id` 升序。

```json
[
  {
    "id": 3,
    "name": "评论助手",
    "description": "评论分析与回复"
  }
]
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | Agent ID，创建会话 / 发消息时使用 |
| `name` | string | 展示名 |
| `description` | string \| null | 副标题/说明 |

> 响应 **不含** Tool 列表；若需某 Agent 下用户可用 Tool 详情，使用管理端 `GET /agent/:id/allowed-tools?userId=` 或会话预热逻辑（内部接口）。

### 3.3 与 `GET /agent/client/list` 的区别

| | `client/list` | `client/available` |
|---|---------------|-------------------|
| 权限过滤 | 无 | 有（RoleTool + AgentTool + 风险等级） |
| 空列表含义 | App 未配置 Agent | 用户无 Tool 权限或交集为空 |
| 典型用途 | 管理/调试 | **C 端 Agent 选择器** |

---

## 4. `GET /agent/:agentId/skills/client`

### 4.1 说明

返回指定 Agent 下、当前用户 **可见** 的 Skill 摘要（**不含** `prompt`、`config`）。

**可见 Skill 判定（服务端，与 session prepare 一致）：**

```text
Skill.agentId = :agentId
  AND Skill.isActive = true
  AND (
    Role 未配置 RoleSkill → 该 Agent 下全部 active Skill
    OR Skill ∈ RoleSkill 白名单
  )
  AND 至少满足其一：
    - Skill HTTP Tool ∩ 用户允许 Tool 非空
    - SkillHostTool ∩ AgentHostTool 非空（HostTool.isActive）
  AND 可选 name / capabilityKey / keyword 客户端筛选
  AND 可选 page（页面 scope）按页过滤（见 §4.5）
```

**带 `page` 时的过滤（与运行时 `page_host_unique` 对齐）：**

```text
先按上文得到「用户可运行」Skill 全集
  → 若 query.page 非空：
      - 纯 HTTP Skill（hostToolIds 为空）→ 保留（全站编排类能力）
      - 含 Host Tool 的 Skill → 仅当 Skill.hostToolIds ∩ 当前页 scoped host_tool ≠ ∅
      - 响应每项附带 pageMatched（是否命中当前页 Host 绑定）
```

**Plan 自动选 Skill（intent 收窄 + 当前页 host_tool）** 使用 `listResolvableSkillsForScopedTools` + `skillIsResolvableInScope`：

| 输入 | 规则 |
|------|------|
| intent 收窄的 HTTP `scopedTools` | Skill 的 `skillToolIds` 与 intent 工具集有交集 → 可进 `availableSkillIds` |
| 当前页 `scopedHostToolIds` | 纯 Host / both 型：Skill 的 `hostToolIds` 与 page scope 有交集 → 可进候选 |
| 二者组合 | 开放对话未指定 `skillId` 时 **同时**消费上述两路（见 `skill.service.ts` 三路 DB 查询） |

**外层 Plan 自动选中**（`resolveAutoOuterPlanSkill`）：当前页 host 与 **唯一** 一个 Skill 绑定对应时，跳过外层 Plan LLM，直接 `kind=skill`（`outerSkillSelectMethod=page_host_unique`）。适用于纯 Host 与 both。

用户显式 `skillId` 走 `skillIsResolvableForRequested`（`outerSkillSelectMethod=requested`）。

- 用户未绑定 `UserApp` → `[]`
- `agentId` 不属于当前 DSN 对应 App → **404**
- Agent 存在但无可见 Skill → `[]`

### 4.2 Path 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `agentId` | number | 来自 `client/available` 或用户已选 Agent |

### 4.3 Query 参数（均可选）

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | string | **页面 scope**（与 `pageContext.page`、`HostPage.scope` 一致，kebab-case）。传入后按页过滤 Skill 列表；纯 HTTP Skill 仍返回 |
| `name` | string | Skill 名称（模糊，忽略大小写） |
| `capabilityKey` | string | 能力键（模糊） |
| `keyword` | string | 匹配 name / description / capabilityKey |

### 4.4 响应

**200** — JSON 数组（无分页），顺序与 DB 查询一致。

```json
[
  {
    "id": 12,
    "name": "评论回复",
    "description": "为指定评论生成卖家回复",
    "capabilityKey": "review.reply",
    "riskLevel": "L2",
    "requiresWriteConfirmation": true,
    "toolIds": [45, 46],
    "hostToolIds": [12],
    "pageMatched": true
  }
]
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | Skill ID（若产品层需要显式选择 Skill 时使用） |
| `name` | string | 展示名 |
| `description` | string \| null | 说明 |
| `capabilityKey` | string \| null | 能力键，便于与业务场景映射 |
| `riskLevel` | `L1` \| `L2` \| `L3` | 与 Tool 同枚举 |
| `requiresWriteConfirmation` | boolean | `L2`/`L3` 时为 true；UI 可提示「可能触发写确认」 |
| `toolIds` | number[] | 该 Skill 绑定的 HTTP Tool ID（与用户允许 Tool 有交集时非空） |
| `hostToolIds` | number[] | 该 Skill 绑定且落在 Agent Host Tool 白名单内的 Host Tool ID |
| `pageMatched` | boolean | **仅当请求带 `?page=` 时返回**：该 Skill 的 Host Tool 是否命中当前页 scope |

> **过滤规则**：与 `POST .../messages` 的 `skillId` 校验一致 — 角色可见 **且** 至少有一个可运行能力（HTTP Tool 交集 **或** Agent 白名单内的 SkillHostTool）。纯 Host Tool Skill（`toolIds: []`、`hostToolIds` 非空）会正常返回。

### 4.5 按页面过滤（`page`）

> **前端迁移专文**：[skill-client-page-filter-frontend.md](./skill-client-page-filter-frontend.md)（变更摘要、迁移步骤、检查清单）

**是否合理？** 推荐。业务页内嵌 Chat 时，用户应看到 **与当前页能力一致** 的 Skill；与发消息时的 `pageContext.page`、运行时 `resolveAutoOuterPlanSkill`（`page_host_unique`）使用同一套 `HostPage.scope`。

| 场景 | 请求 | 结果 |
|------|------|------|
| 评论详情页 | `?page=comment-detail` | 返回评论页 Host Skill + 通用 HTTP Skill |
| 首页 / 无页上下文 | 不传 `page` | 返回全部可运行 Skill |
| 页内无 host_tool 配置 | `?page=unknown-page` | 仅返回纯 HTTP Skill；`pageMatched` 均为 false 或字段不出现 |

**`page` 取值**：与 [页面上下文对接](./host-page-context-host-action-frontend.md) 中 `pageContext.page` **完全一致**（kebab-case，全站稳定）。

```ts
// 路由进入评论详情
const page = 'comment-detail';
chat.setPageContext({ page, entity: { type: 'comment', id: commentId } });

// Skill 选择器与 pageContext 对齐
const skills = await clientGet<SkillClientListItem[]>(
  `/agent/${agentId}/skills/client`,
  { page },
);
```

**默认选中建议（前端启发式，非服务端强制）：**

```ts
const pageBound = skills.filter((s) => s.pageMatched);
if (pageBound.length === 1) {
  defaultSkillId = pageBound[0].id; // 对齐运行时 page_host_unique
} else if (pageBound.length > 1) {
  // 展示列表让用户选；或不传 skillId 交给 Plan/turnRoute
}
```

---

## 5. 推荐前端流程

### 5.1 Agent 选择页

```text
1. GET /agent/client/available
2. 若 [] → 展示「当前账号无可用助手，请联系管理员配置角色与工具权限」
3. 用户点击某项 → 记录 agentId → 进入 Skill 列表或直接进入对话（无 Skill 时）
```

可选：按业务能力 Tab 切换时，在前端对返回列表做本地筛选（服务端不再提供 Tool query）。

### 5.2 Skill 选择 / 能力入口

```text
1. 从当前路由解析 page scope（与 setPageContext 一致）
2. GET /agent/{agentId}/skills/client?page={page}
3. 若 [] → 仍可进入对话（不传 skillId，由 turnRoute/Plan 决策）
4. 若 pageMatched=true 仅一项 → 可默认选中该 Skill
5. 若多项 → 展示能力卡片；requiresWriteConfirmation=true 可加角标
```

无固定业务页时（如全局浮层 Chat）可省略 `page`，拉全量列表。

### 5.3 创建会话与发送消息

选定 `agentId` 后：

1. **创建会话**：`POST /chat`（首条消息可带 `skillId`，与发消息字段一致）
2. **发送用户消息**：`POST /chat/:sessionId/messages`（续聊同样可带 `skillId`）

用户预选 Skill 时，在发消息 body 中携带 `skillId`（来自 `GET /agent/:agentId/skills/client` 返回的 `id`）。

**引擎行为对比：**

| | 未传 `skillId` | 传了 `skillId` |
|---|----------------|----------------|
| 发消息前校验 | — | 角色可见 + **HTTP Tool 交集或 Agent 白名单内 SkillHostTool**（不合法直接 400） |
| 图入口 | `intent` → `turnRoute` → `plan` | 同左（仍经 intent/turnRoute；scopedTools 预绑 Skill） |
| scopedTools | intent 类目收窄 + bind | 预加载 Skill 绑定 Tool |
| 外层 Plan | 契约 + LLM / page_host | 显式 Skill 步 |
| session resume | 可续跑（显式 skillId 时跳过 resume gate） | 不续跑 |

```json
{
  "role": "user",
  "content": "帮我分析最近一周的评价",
  "agentId": 1,
  "skillId": 42
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `role` | 是 | 固定 `"user"` |
| `content` | 是 | 用户输入 |
| `agentId` | 否 | 覆盖会话默认 Agent |
| `skillId` | 否 | 指定 Skill；不传则由 Plan 自动选择 |

`skillId` 与 `confirmWrite` / `cancelWrite` 互斥：写确认续跑时不应传 `skillId`。

---

## 6. 错误与边界

| HTTP | 场景 | 前端建议 |
|------|------|----------|
| 401 | JWT 无效/过期 | 跳转登录 |
| 401 | 缺少 `X-App-Dsn` | 检查 DSN 配置 |
| 404 | `skills/client` 的 agentId 不属于当前 App | 刷新 Agent 列表 |
| 400 | `POST .../messages` 的 `skillId` 不可运行 | 刷新 Skill 列表后重选；读响应 `message`（中文）与 `data.code` |
| 200 + `[]` | 无权限或无数据 | 空状态文案，区分「未配置」与「无权限」见下 |

**`skillId` 400 响应示例**（经全局异常过滤器，HTTP 状态仍为 200 包装）：

```json
{
  "status": 400,
  "message": "所选技能暂无可用工具，请联系管理员检查技能与权限配置。",
  "data": {
    "message": "所选技能暂无可用工具，请联系管理员检查技能与权限配置。",
    "code": "SKILL_TOOLS_EMPTY"
  }
}
```

`data.code` 取值：`SKILL_NOT_VISIBLE` | `SKILL_TOOLS_EMPTY`（发消息前校验；运行时另可能有 `SKILL_NOT_IN_SCOPE` / `SKILL_EXPAND_FAILED`）。

**空列表区分（仅客户端启发式）：**

| 接口 | 建议 |
|------|------|
| `client/available` 为空 | 先调 `client/list`：若 list 非空而 available 为空 → **权限问题**；若 list 也为空 → **未配置 Agent** |
| `skills/client` 为空 | Agent 可能未配置 Skill、RoleSkill 白名单未包含、或 Skill 既无 HTTP Tool 交集也无 Agent 白名单内 SkillHostTool → 仍可进入对话（不传 skillId） |

---

## 7. TypeScript 类型（可复制）

```ts
export type AgentClientListItem = {
  id: number;
  name: string;
  description: string | null;
};

export type ToolLevel = 'L1' | 'L2' | 'L3';

export type SkillClientListItem = {
  id: number;
  name: string;
  description: string | null;
  capabilityKey: string | null;
  riskLevel: ToolLevel;
  requiresWriteConfirmation: boolean;
  toolIds: number[];
  hostToolIds: number[];
  /** 仅当 GET 带 ?page= 时存在 */
  pageMatched?: boolean;
};

/** GET /agent/:agentId/skills/client query */
export type QueryClientSkillByAgent = {
  page?: string;
  name?: string;
  capabilityKey?: string;
  keyword?: string;
};

/** POST /chat/:sessionId/messages body（C 端发消息） */
export type SaveMessageBody = {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  agentId?: number;
  skillId?: number;
  turnId?: number;
  confirmWrite?: boolean;
  cancelWrite?: boolean;
};
```

---

## 8. 联调检查清单

- [ ] 请求带 `Authorization` + `X-App-Dsn`
- [ ] Agent 选择器使用 `client/available`，不用 `client/list`（除非管理/debug）
- [ ] `agentId` 来自 available 列表，避免 404
- [ ] 空列表有空状态，不当作接口错误
- [ ] `requiresWriteConfirmation` 仅作 UI 提示；实际写确认仍走 SSE `confirmation_required`
- [ ] 业务页内 Skill 列表带 `?page=`，与 `pageContext.page` 一致
- [ ] `pageMatched===true` 唯一时考虑默认 skillId
- [ ] 不在 C 端展示 `prompt` / `config`（本接口不返回）

---

## 9. 服务端实现索引

| 能力 | 文件 |
|------|------|
| Agent available | `src/modules/agent/agent.controller.ts` → `findClientAvailableAgentsForUser` |
| 角色 Tool 权限 | `src/modules/agent/util/agent-client-access.util.ts` |
| Skill client 列表 | `src/modules/skill/skill.controller.ts` → `findClientListByAgentForUser` |
| 运行时 Skill 解析 | `src/core/skill/skill.service.ts` → `listResolvableSkillsForScopedTools` / `resolveSkillsForOuterPlan` / `getRunnableSkillDetailById` |
| 可运行判定 | `src/core/skill/skill-runnable.util.ts` → `skillIsRunnableForUser` / `skillIsVisibleOnClientPage` / `skillMatchesPageHostTools` |
| 外层自动选 Skill | `src/core/agent-engine/engine/main/outer-plan-skill-resolve.util.ts` → `resolveAutoOuterPlanSkill` |
| Plan 候选查询 | `src/core/skill/skill.service.ts` → `listResolvableSkillsForScopedTools` |
