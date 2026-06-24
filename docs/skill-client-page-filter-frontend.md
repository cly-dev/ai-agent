# C 端 Skill 列表 · 按页面 `page` 过滤 · 前端变更说明

> **面向**：C 端 / omnix-chat SDK / 业务页内嵌 Chat  
> **版本**：agent-server 2026-06  
> **关联**：[Agent / Skill C 端 API](./agent-skill-client-api-frontend.md)、[页面上下文与 host_action](./host-page-context-host-action-frontend.md)、[会话预热 host_tool](./host-tool-prepare-frontend.md)

---

## 1. 变更摘要

| 项 | 变更前 | 变更后 |
|----|--------|--------|
| 接口 | `GET /agent/:agentId/skills/client` | **不变**（向后兼容） |
| Query | 仅 `name` / `capabilityKey` / `keyword` | 新增可选 **`page`** |
| 响应字段 | 固定 8 个字段 | 带 `?page=` 时每项多 **`pageMatched`** |
| 列表语义 | 返回用户在该 Agent 下全部可运行 Skill | 带 `page` 时 **按当前页 Host 能力收窄** + 保留纯 HTTP 通用 Skill |
| 破坏性 | — | **无**（不传 `page` 行为与旧版一致） |

**一句话**：业务页内嵌 Chat 时，Skill 选择器应带 `?page=`，取值与 `pageContext.page` 相同，使「可选能力」与「发消息 / 运行时自动选 Skill」对齐。

---

## 2. 为什么要改

```text
旧流程：评论详情页拉全量 Skill → 用户可能选到「订单分析」等无关能力
新流程：?page=comment-detail → 只展示评论页 Host Skill + 全站 HTTP Skill
```

与后端运行时一致：

| 机制 | 使用的 page 标识 |
|------|------------------|
| `POST .../messages` 的 `pageContext.page` | HostPage.scope |
| 会话预热 `POST /chat/:id/prepare` | 同上 |
| 运行时 `page_host_unique` 自动选 Skill | 当前页 scoped `host_tool` |
| **本接口 `?page=`** | **同上** |

---

## 3. API 契约

### 3.1 请求

```http
GET /agent/{agentId}/skills/client?page=comment-detail
Authorization: Bearer <token>
X-App-Dsn: <dsn>
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `page` | 否 | 页面 scope，**kebab-case**，与 `pageContext.page` / `HostPage.scope` 一致 |

其他 query（`name`、`keyword` 等）可与 `page` 组合使用。

### 3.2 响应

**200** — JSON 数组（结构不变，新增可选字段）。

```json
[
  {
    "id": 12,
    "name": "评论回复",
    "description": "为指定评论生成卖家回复",
    "capabilityKey": "review.reply",
    "riskLevel": "L2",
    "requiresWriteConfirmation": true,
    "toolIds": [],
    "hostToolIds": [12],
    "pageMatched": true
  },
  {
    "id": 8,
    "name": "经营分析",
    "description": "跨页面数据统计",
    "capabilityKey": "analytics.overview",
    "riskLevel": "L1",
    "requiresWriteConfirmation": false,
    "toolIds": [45, 46],
    "hostToolIds": [],
    "pageMatched": false
  }
]
```

| 字段 | 何时出现 | 说明 |
|------|----------|------|
| `pageMatched` | **仅**请求带 `?page=` | `true` = 该 Skill 的 `hostToolIds` 与当前页 scoped `host_tool` 有交集 |
| 其余字段 | 始终 | 见 [agent-skill-client-api-frontend.md §4.4](./agent-skill-client-api-frontend.md#44-响应) |

### 3.3 服务端过滤规则（便于理解 UI）

| Skill 类型 | `hostToolIds` | 带 `?page=` 时 |
|------------|---------------|----------------|
| 纯 Host | 非空 | 仅当命中当前页 host_tool |
| HTTP + Host | 非空 | 命中当前页 host_tool 时保留；未命中则 **不返回** |
| 纯 HTTP | 空 | **始终保留**（全站编排类能力） |

未传 `page`：不做上表过滤，与旧版相同。

---

## 4. 前端迁移步骤

### 4.1 抽取统一的 `page` 常量

**同一业务页**内，以下三处必须使用 **同一个字符串**：

```ts
/** 与路由、HostPage 登记、SDK registry 一致 */
export const PAGE_COMMENT_DETAIL = 'comment-detail';
```

| 调用点 | 用法 |
|--------|------|
| `setPageContext` | `{ page: PAGE_COMMENT_DETAIL, entity: { ... } }` |
| Skill 列表 | `GET .../skills/client?page=${PAGE_COMMENT_DETAIL}` |
| 会话预热（若使用） | `prepare({ pageContext: { page: PAGE_COMMENT_DETAIL } })` |

禁止在 Skill 接口使用 `routePath`、中文名或 camelCase 路由名；只用 **scope**。

### 4.2 改造 Skill 拉取时机

```text
变更前：
  进入 Agent → GET /skills/client（无 query）

变更后（页内 Chat）：
  进入业务页 / 路由 onEnter
    → setPageContext({ page, entity })
    → GET /skills/client?page={page}
  路由离开
    → 清空 pageContext（或 set 到新页）
    → 重新拉 Skill（新 page）或隐藏页内 Skill 选择器
```

### 4.3 默认选中 `skillId`（推荐）

```ts
function resolveDefaultSkillId(skills: SkillClientListItem[]): number | undefined {
  const pageBound = skills.filter((s) => s.pageMatched === true);
  if (pageBound.length === 1) {
    return pageBound[0].id;
  }
  return undefined;
}
```

| `pageBound.length` | 建议 |
|--------------------|------|
| `0` | 不预选；发消息可不传 `skillId` |
| `1` | 默认选中，与运行时 `page_host_unique` 一致 |
| `>1` | 展示列表；或高亮 `pageMatched` 项 |

服务端 **不强制** 默认 skill；以上为 UI 启发式。

### 4.4 TypeScript 类型更新

```ts
export type SkillClientListItem = {
  id: number;
  name: string;
  description: string | null;
  capabilityKey: string | null;
  riskLevel: 'L1' | 'L2' | 'L3';
  requiresWriteConfirmation: boolean;
  toolIds: number[];
  hostToolIds: number[];
  /** 仅 GET 带 ?page= 时存在 */
  pageMatched?: boolean;
};

export type QueryClientSkillByAgent = {
  page?: string;
  name?: string;
  capabilityKey?: string;
  keyword?: string;
};
```

### 4.5 SDK 封装示例

```ts
async function loadSkillsForCurrentPage(
  agentId: number,
  page: string | null | undefined,
): Promise<SkillClientListItem[]> {
  const params: QueryClientSkillByAgent = {};
  const scope = page?.trim();
  if (scope) {
    params.page = scope;
  }
  return clientGet<SkillClientListItem[]>(
    `/agent/${agentId}/skills/client`,
    params,
  );
}

// 业务页
const skills = await loadSkillsForCurrentPage(agentId, PAGE_COMMENT_DETAIL);
const skillId = resolveDefaultSkillId(skills);

// 全局浮层 Chat（无固定页）
const allSkills = await loadSkillsForCurrentPage(agentId, undefined);
```

---

## 5. 场景对照

| 场景 | 是否传 `page` | UI 建议 |
|------|---------------|---------|
| 评论 / 订单等详情页内嵌 Chat | **是** | Skill 卡片只展示接口返回项；可默认 `pageMatched` 唯一项 |
| 全站悬浮球 / 首页通用助手 | **否** | 全量 Skill 或隐藏选择器 |
| Tab 切换（同路由不同 tab） | **是**（若 tab 对应不同 scope） | 切 tab 时 `setPageContext` + 重新 `GET` |
| 用户手动切换 Skill | — | 以用户选择为准；发消息带 `skillId` |

---

## 6. 边界与空列表

| 情况 | 接口结果 | 前端处理 |
|------|----------|----------|
| `page` 未登记 / 无 host_tool | 仅纯 HTTP Skill；Host Skill 不出现 | 可隐藏「页内能力」分组 |
| 返回 `[]` | 无权限或无配置 Skill | 仍可发消息（不传 `skillId`）；空状态文案 |
| 传了 `page` 但忘了 `setPageContext` | 列表与运行时可能不一致 | **联调检查：两处 page 必须相同** |
| `pageMatched: false` 的 HTTP Skill | 通用能力，非本页 Host | 可单独分组为「通用助手」 |

---

## 7. 联调检查清单

- [ ] `page` 与 `pageContext.page` 使用同一常量，kebab-case
- [ ] 进入业务页：先 `setPageContext`，再 `GET .../skills/client?page=`
- [ ] 路由变化时重新拉 Skill 或清空已选 `skillId`
- [ ] 响应解析兼容无 `pageMatched`（未传 `page` 的旧调用）
- [ ] `pageMatched === true` 仅一项时，验证默认 `skillId` 发消息可成功
- [ ] 全局 Chat 不传 `page`，行为与升级前一致

---

## 8. 相关文档

| 文档 | 内容 |
|------|------|
| [agent-skill-client-api-frontend.md](./agent-skill-client-api-frontend.md) | C 端 Agent / Skill 完整 API |
| [host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md) | `pageContext` 字段与 `host_action` |
| [host-tool-prepare-frontend.md](./host-tool-prepare-frontend.md) | 按页预热 host_tool |
| [host-bridge-sdk-frontend.md](./host-bridge-sdk-frontend.md) | SDK 一站式对接 |

---

## 9. 服务端实现索引

| 能力 | 文件 |
|------|------|
| Query DTO | `src/modules/skill/dto/query-client-skill-by-agent.dto.ts` |
| 列表过滤 | `src/modules/skill/skill.service.ts` → `findClientListByAgentForUser` |
| 页内可见性 | `src/core/skill/skill-runnable.util.ts` → `skillIsVisibleOnClientPage` |
| 页 scoped host_tool | `src/core/runtime-cache/agent-host-tool-catalog.service.ts` → `resolveLlmHostTools` |
