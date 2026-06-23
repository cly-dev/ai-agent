# Host Tool · Agent / Skill API 对接指南

> 适用：B 端管理后台（Agent / Skill 配置页）  
> 绑定写接口：[host-tool-admin-frontend.md](./host-tool-admin-frontend.md)  
> C 端执行：[host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md)

---

## 1. 变更摘要

Agent / Skill 接口与 HTTP Tool 对称，内嵌 Host Tool 绑定；**列表与详情载荷分离**，避免列表拖入完整 `argsSchema`。

| 接口 | Host Tool 字段 |
|------|----------------|
| `GET /admin/agent/:id`（详情） | `hostTools`、`agentHostTools`、`hostToolCount` |
| `GET /admin/agent`（列表） | `hostToolCount`；`hostTools` / `agentHostTools` 为 `[]` |
| `GET /admin/skill/:skillId`（详情） | `hostTools`、`skillHostTools`、`hostToolCount` |
| Skill 分页列表 | `hostToolCount`；`hostTools` / `skillHostTools` 为 `[]` |
| `POST/DELETE .../host-tools` | `hostTools`、`agentHostTools`（`items` = `hostTools` 别名） |
| `GET/PUT /admin/skill/:skillId/host-tools` | `hostTools`、`skillHostTools` |

---

## 2. Agent

### 2.1 详情

```http
GET /admin/agent/:id
Authorization: Bearer <adminJwt>
```

```json
{
  "id": 3,
  "name": "评论助手",
  "tools": [],
  "agentTools": [],
  "hostToolCount": 1,
  "hostTools": [
    {
      "id": 12,
      "name": "fillReplyDraft",
      "exposure": "LLM",
      "pageScope": "review-detail",
      "argsSchema": { "type": "object" },
      "isActive": true
    }
  ],
  "agentHostTools": [
    {
      "id": 5,
      "agentId": 3,
      "hostToolId": 12,
      "hostTool": { "id": 12, "name": "fillReplyDraft" }
    }
  ]
}
```

### 2.2 列表

```http
GET /admin/agent
```

列表项含 `hostToolCount`，**不含** Host Tool 详情：

```json
{
  "id": 3,
  "name": "评论助手",
  "hostToolCount": 2,
  "hostTools": [],
  "agentHostTools": []
}
```

前端：列表用 `hostToolCount` 展示角标；进入详情页再读完整 `agentHostTools`。

| 字段 | 详情 | 列表 |
|------|------|------|
| `hostToolCount` | `agentHostTools.length` | `_count.agentHostTools` |
| `hostTools` | 完整扁平列表 | `[]` |
| `agentHostTools` | 完整中间表 | `[]` |

---

## 3. Skill

### 3.1 详情

```http
GET /admin/skill/:skillId
```

```json
{
  "id": 8,
  "toolCount": 3,
  "hostToolCount": 1,
  "skillHostTools": [
    {
      "id": 2,
      "skillId": 8,
      "hostToolId": 12,
      "trigger": "ON_PLAN_STEP",
      "priority": 0,
      "isRequired": true,
      "skillArgsTemplate": { "text": "$draft.text" },
      "hostTool": {
        "id": 12,
        "name": "fillReplyDraft",
        "exposure": "LLM",
        "pageScope": "review-detail"
      }
    }
  ],
  "hostTools": [{ "id": 12, "name": "fillReplyDraft" }]
}
```

### 3.2 列表（分页）

`hostToolCount` 有值；`skillHostTools` / `hostTools` 为空数组。与 `toolCount` 用法相同。

### 3.3 `skillHostTools` 字段

| 字段 | 说明 |
|------|------|
| `trigger` | `ON_MUTATION_SUCCESS` / `LLM_SCOPED` / `ON_PLAN_STEP` |
| `priority` | 越小越优先 |
| `isRequired` | **运行时生效**：Plan `host_tool` 步未 dispatch 该工具时**不推进** plan，直至重试耗尽 |
| `skillArgsTemplate` | 覆盖 `HostTool.argsTemplate` |
| `hostTool` | 嵌套工具元数据 |

**`trigger` 必配**：Plan 填框类须 `ON_PLAN_STEP` 或 `LLM_SCOPED`；mutation 完成后刷新须 `ON_MUTATION_SUCCESS`。漏配 trigger 会导致该场景解析不到工具。

---

## 4. 绑定写接口

### 4.1 Agent

```http
POST /admin/agent/:agentId/app-client/:appClientId/host-tools
{ "hostToolIds": [12] }
```

响应：`hostTools` + `agentHostTools`；`items` 兼容别名。

### 4.2 Skill 全量替换

```http
PUT /admin/skill/:skillId/host-tools
{
  "tools": [
    {
      "hostToolId": 12,
      "trigger": "ON_PLAN_STEP",
      "priority": 0,
      "isRequired": true,
      "argsTemplate": { "text": "$draft.text" }
    }
  ]
}
```

传 `"tools": []` 表示 **显式清空** Skill 级 Host Tool（见下文 Fallback）。

---

## 5. 运行时解析与 Fallback

```text
register → HostTool → AgentHostTool（必配）
  → SkillHostTool（推荐，带 trigger）
  → pageContext.page ∩ scope
  → Plan LLM / host_action
```

| 场景 | `exposure` | `trigger` |
|------|------------|-----------|
| Plan `host_tool` | `LLM` / `BOTH` | `LLM_SCOPED` / `ON_PLAN_STEP` |
| Mutation 完成 | `ON_COMPLETE` / `BOTH` | `ON_MUTATION_SUCCESS` |

### 5.1 Fallback 规则（服务端）

| Skill `SkillHostTool` 状态 | 行为 |
|----------------------------|------|
| **无任何行**（从未配置） | 回退到 `AgentHostTool` 白名单（warn 日志） |
| **有行，但无当前 trigger** | **不回退**，该场景 `preferredIds = []` |
| **`PUT` 传 `tools: []`** | 视为已配置但为空，**不回退** |

> 若希望某 Skill 在 Plan 场景禁用 Host Tool，配置其他 trigger 的行但不配 `ON_PLAN_STEP`/`LLM_SCOPED`，或 `PUT` 空列表。

### 5.2 `isRequired` 行为

- B 端 `isRequired: true` 且工具在当前 plan 步 `hostToolNames` 内
- LLM 未产出对应 `host_tool` call → **不 advance plan**，写入 `required_host_tool_missed` observation，继续重试直至 `plan_tool_step_exhausted`
- `isRequired: false`（默认）时，缺失 call 仍按原逻辑 skip 并推进

### 5.3 常见 0 工具

1. 未绑 `AgentHostTool`
2. Skill 已配 Host Tool 但 **trigger 不匹配**当前场景
3. `pageContext.page` 为空或与 `pageScope` 不一致
4. `exposure` 与场景不匹配
5. `hostTool.isActive === false`

---

## 6. 前端 UI 建议

### 6.1 Agent

- 列表：展示 `hostToolCount` 徽章
- 详情 / 编辑：`agent.hostTools` 或专用 `GET .../host-tools?bound`
- 保存：`POST/DELETE .../host-tools`

### 6.2 Skill

- 列表：`hostToolCount`
- 详情：`skill.skillHostTools`（含 trigger / isRequired）
- 编辑：仅可选所属 Agent 已白名单的工具
- 保存：`PUT /admin/skill/:skillId/host-tools`
- **按场景分 Tab 配置 trigger**，避免默认 `ON_MUTATION_SUCCESS` 误配

### 6.3 TypeScript 类型（示例）

```typescript
type HostToolSummary = {
  id: number;
  name: string;
  exposure: string;
  pageScope: string | null;
  isActive: boolean;
};

type AgentDetail = {
  hostToolCount: number;
  hostTools: HostToolSummary[];
  agentHostTools: Array<{
    id: number;
    hostToolId: number;
    hostTool: HostToolSummary;
  }>;
};

type AgentListItem = AgentDetail & {
  hostTools: [];
  agentHostTools: [];
};

type SkillHostToolBinding = {
  hostToolId: number;
  trigger: 'ON_MUTATION_SUCCESS' | 'LLM_SCOPED' | 'ON_PLAN_STEP';
  priority: number;
  isRequired: boolean;
  skillArgsTemplate: Record<string, unknown> | null;
  hostTool: HostToolSummary;
};

type SkillDetail = {
  toolCount: number;
  hostToolCount: number;
  skillHostTools: SkillHostToolBinding[];
  hostTools: HostToolSummary[];
};
```

---

## 7. 迁移说明

| 旧做法 | 新做法 |
|--------|--------|
| 列表接口读 `hostTools` | 列表只信 `hostToolCount`，详情再拉 `hostTools` |
| 未配 Skill 即无工具 | 未配任何行时 fallback Agent；配了行则按 trigger 精确匹配 |
| `isRequired` 仅展示 | 已接入 Plan 步强制语义 |
| 绑定响应 `items` | 优先 `hostTools` + `*HostTools` |

---

## 8. 相关文档

- [host-tool-admin-frontend.md](./host-tool-admin-frontend.md)
- [host-tool-data-model.md](./host-tool-data-model.md)
- [host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md)
