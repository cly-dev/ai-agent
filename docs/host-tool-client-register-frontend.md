# Host Tool · C 端注册与 SDK 对接

> 适用：嵌入 Chat 的业务前端 + omnix-chat SDK 维护方  
> **SDK 总览**：[host-bridge-sdk-frontend.md](./host-bridge-sdk-frontend.md)  
> B 端配置：[host-tool-admin-frontend.md](./host-tool-admin-frontend.md)  
> pageContext / SSE：[host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md)

---

## 1. 设计目标

**一处注册，两端一致：**

```text
业务代码 registerHostTool（本地 handler）
        ↓ 首次调用
POST /host-tool/client/register（服务端入库元数据）
        ↓ 后续同名跳过
B 端 / Agent 绑定 / host_action.hostTools 与前端 catalog 对齐
```

- **执行永远在浏览器**（refetch、填框等）。
- **服务端只存元数据**（name、description、argsSchema、exposure、argsTemplate）。
- **幂等**：同一 App 内 `name` 已存在 → **跳过，不更新**（避免覆盖运营在 B 端的修改）。

---

## 2. C 端 API

> **跨域**：与 `app-client/auth`、`chat` 等 C 端接口相同，走 `client-public-cors` 中间件（支持 `OPTIONS` 预检；允许 `Authorization`、`X-App-Dsn` 等头）。路径须为 **无 `/admin` 前缀** 的 `/host-tool/client/*`（见 `main.ts` globalPrefix exclude）。

### 2.1 幂等注册

```http
POST /host-tool/client/register
Authorization: Bearer <userAccessToken>
X-App-Dsn: <appDsn>
Content-Type: application/json
```

**通用工具批次（无 scope）：**

```json
{
  "tools": [
    {
      "name": "refreshEntity",
      "generic": true,
      "description": "mutation 成功后按 entity 刷新当前页数据",
      "argsSchema": {
        "type": "object",
        "properties": {
          "entityType": { "type": "string" },
          "entityId": { "type": "string" }
        },
        "required": ["entityId"]
      },
      "exposure": "ON_COMPLETE",
      "argsTemplate": {
        "entityType": "$entity.type",
        "entityId": "$entity.id"
      }
    }
  ]
}
```

**页内工具批次：**

```json
{
  "scope": "review-detail",
  "pageLabel": "评论详情",
  "routePattern": "/reviews/:id",
  "tools": [
    {
      "name": "fillReplyDraft",
      "description": "将回复草稿填入评论详情回复框",
      "argsSchema": {
        "type": "object",
        "properties": { "text": { "type": "string" } },
        "required": ["text"]
      },
      "exposure": "LLM"
    }
  ]
}
```

### 2.2 响应

```json
{
  "created": [
    {
      "name": "refreshEntity",
      "id": 1,
      "created": true,
      "tool": { "id": 1, "name": "refreshEntity", "pageScope": null, "...": "..." }
    }
  ],
  "skipped": [
    { "name": "fillReplyDraft", "id": 2, "reason": "already_exists" }
  ]
}
```

| 结果 | 含义 |
|------|------|
| `created` | 本次新写入 DB |
| `skipped` / `already_exists` | 同名已存在，未改库 |

### 2.3 查询目录（可选校验）

```http
GET /host-tool/client/catalog?scope=review-detail&agentId=1
```

发消息 / 收 `host_action` 前可用于对比本地 registry 与服务端目录。

---

## 3. 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `scope` | 页内批次建议填 | `pageContext.page`；自动 ensure `HostPage` |
| `pageLabel` / `routePattern` | 否 | 仅首次创建 HostPage 时使用 |
| `tools[].name` | 是 | App 内唯一；幂等键 |
| `tools[].generic` | 否 | `true` → 通用工具，忽略 scope |
| `tools[].description` | 是 | 给 LLM / B 端展示 |
| `tools[].argsSchema` | 是 | JSON Schema |
| `tools[].exposure` | 否 | 默认 `ON_COMPLETE` |
| `tools[].argsTemplate` | 否 | `$entity.id` 等占位符 |
| `tools[].definitionKey` | 否 | 默认 `name` 或 `{scope}.{name}` |

### argsTemplate 占位符

| 占位符 | 来源 |
|--------|------|
| `$entity.id` | `pageContext.entity.id` |
| `$entity.type` | `pageContext.entity.type` |
| `$entity.<field>` | entity 任意字段 |
| `$page` | `pageContext.page` |
| `$routePath` | `pageContext.routePath` |

---

## 4. SDK 包装函数（建议实现）

在 **omnix-chat** 提供高层 API，业务页只调一次。

### 4.1 类型

```ts
export type HostToolDefinition = {
  name: string;
  description: string;
  argsSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => void | Promise<void>;
  generic?: boolean;
  exposure?: 'CATALOG' | 'ON_COMPLETE' | 'LLM' | 'BOTH';
  argsTemplate?: Record<string, unknown>;
  definitionKey?: string;
};

export type RegisterHostToolsOptions = {
  /** pageContext.page；页内工具必填 */
  scope?: string;
  pageLabel?: string;
  routePattern?: string;
  tools: HostToolDefinition[];
  /** 是否同步服务端，默认 true */
  syncToServer?: boolean;
};
```

### 4.2 实现要点

```ts
const serverSyncedKeys = new Set<string>();

function syncKey(appClientId: number, name: string): string {
  return `${appClientId}:${name}`;
}

/**
 * 本地注册 + 可选首次同步服务端（按 name 幂等）。
 */
export async function registerHostToolsWithSync(
  chat: AgentChatClient,
  options: RegisterHostToolsOptions,
): Promise<void> {
  const { scope, tools, syncToServer = true } = options;

  // 1. 本地 registry（立即生效）
  for (const tool of tools) {
    chat.registerHostTool(scope ?? '*', tool.name, tool.handler);
  }

  if (!syncToServer) {
    return;
  }

  // 2. 仅同步「本进程尚未尝试过」的工具名
  const appClientId = chat.getAppClientId();
  const toSync = tools.filter(
    (t) => !serverSyncedKeys.has(syncKey(appClientId, t.name)),
  );
  if (toSync.length === 0) {
    return;
  }

  const res = await chat.http.post('/host-tool/client/register', {
    scope,
    pageLabel: options.pageLabel,
    routePattern: options.routePattern,
    tools: toSync.map(({ handler, ...meta }) => meta),
  });

  for (const item of [...res.created, ...res.skipped]) {
    serverSyncedKeys.add(syncKey(appClientId, item.name));
  }
}
```

**说明：**

- `serverSyncedKeys`：避免同页重复 POST；刷新页面后 Set 清空会再请求一次，服务端 `skipped` 即可。
- **不把 `handler` 上传**；服务端只收元数据。
- 若需「改 description 后强制更新服务端」，走 B 端 PATCH 或另开 `force` 参数（当前 **不自动覆盖**）。

### 4.3 业务页用法

```ts
import { registerHostToolsWithSync, useHostAction } from 'omnix-chat/react';

// App 启动或 layout：注册通用工具一次
await registerHostToolsWithSync(chat, {
  tools: [
    {
      name: 'refreshEntity',
      generic: true,
      description: 'mutation 成功后刷新实体数据',
      argsSchema: { /* ... */ },
      exposure: 'ON_COMPLETE',
      argsTemplate: { entityId: '$entity.id', entityType: '$entity.type' },
      handler: async ({ entityType, entityId }) => {
        await refetchByEntity(entityType, entityId);
      },
    },
  ],
});

// 详情页
useEffect(() => {
  void registerHostToolsWithSync(chat, {
    scope: 'review-detail',
    pageLabel: '评论详情',
    routePattern: location.pathname,
    tools: [
      {
        name: 'fillReplyDraft',
        description: '填入回复草稿',
        argsSchema: { /* ... */ },
        exposure: 'LLM',
        handler: ({ text }) => setDraft(String(text)),
      },
    ],
  });
}, [chat]);

useHostAction('review-detail', async (action) => {
  for (const tool of action.hostTools) {
    await chat.runHostTool(action.scope!, tool.name, tool.args);
  }
});
```

---

## 5. 与 B 端分工

| 步骤 | 谁做 |
|------|------|
| 工具元数据首次入库 | C 端 `register`（或 B 端手工建） |
| Agent 白名单 | **B 端** `AgentHostTool` |
| Skill 场景绑定 | **B 端** `SkillHostTool`（可选） |
| handler 实现 | **C 端** registry |
| 执行 `hostTools` | **C 端** `runHostTool` |

C 端 register **不会**自动绑 Agent；绑完后 `host_action` 才会带 `hostTools`。

---

## 6. 常见问题

**Q：register 后还是没有 `hostTools`？**  
检查 Agent 是否绑定、`exposure` 是否含 `ON_COMPLETE`、mutation 是否成功、是否有 `pageContext.page`。

**Q：改了 argsSchema 想同步服务端？**  
当前 register 跳过已存在记录；请用 B 端 `PATCH /admin/host-tool/:id` 或删了重建。

**Q：通用工具和页内工具 name 能重复吗？**  
不能；`name` 在 App 内全局唯一。

---

## 7. 相关文档

| 文档 | 内容 |
|------|------|
| [host-tool-admin-frontend.md](./host-tool-admin-frontend.md) | B 端管理 API |
| [host-tool-data-model.md](./host-tool-data-model.md) | 数据模型 |
