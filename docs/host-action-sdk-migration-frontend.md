# C 端 SDK 迁移方案：去掉 `host_action.status`

> **面向**：omnix-chat SDK 维护方  
> **版本**：与 agent-server 2026-06 实现同步  
> **关联**：[host-bridge-sdk-frontend.md](./host-bridge-sdk-frontend.md)、[host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md)、[chat-sse-message-blocks-frontend.md](./chat-sse-message-blocks-frontend.md)

---

## 1. 变更摘要

| 项 | 旧协议 | 新协议 |
|----|--------|--------|
| 门闩字段 | `status: 'completed'` | **已删除** |
| 是否执行 | `status === 'completed'` 才处理 | `action === 'host_action'` 且 `hostTools.length > 0` |
| 场景区分 | 无（仅 mutation 完成） | `reason`: `plan_host_tool` / `agent_mutation_success` |
| Plan 对账 | 无 | 可选 `planStepId` |
| `hostTools` | 可选 | **必填**（服务端保证非空才推送） |

**核心语义变化**：`host_action` 不再是「mutation 已成功」的单一场景，而是 **「请浏览器执行这组 hostTools」** 的通用指令。mutation 成功只是其中一种触发来源（`reason: agent_mutation_success`）。

---

## 2. 新 Payload 契约

与 agent-server `HostActionSsePayload` 对齐：

```ts
export type HostActionHostToolInvocation = {
  name: string;
  args: Record<string, unknown>;
};

export type HostActionPayload = {
  action: 'host_action';
  scope?: string;
  entity?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  /** 必填：registry 逐项执行 */
  hostTools: HostActionHostToolInvocation[];
  /** Plan 步 id（mid-run 时有） */
  planStepId?: string;
  /** plan_host_tool | agent_mutation_success | Skill hostBridge.reason */
  reason?: string;
  runId?: number;
  turnId?: number;
};
```

### 2.1 `reason` 取值

| `reason` | 推送时机 | 典型 `hostTools` 来源 |
|----------|----------|----------------------|
| `plan_host_tool` | run **进行中**，Plan `host_tool` 步 | Decision LLM 产参 |
| `agent_mutation_success` | run **成功结束前**，HTTP mutation 已 SUCCESS | DB `argsTemplate` + `$entity.*` |
| 自定义字符串 | 同上，可被 Skill `config.hostBridge.reason` 覆盖 | 埋点用 |

同一次 run 可能 **先** `plan_host_tool` **再** `agent_mutation_success`；SDK 默认行为应对两者都执行 `hostTools`，业务可按 `reason` 追加逻辑。

### 2.2 示例

**Plan mid-run：**

```json
{
  "action": "host_action",
  "scope": "review-detail",
  "entity": { "type": "review", "id": "123" },
  "hostTools": [{ "name": "fillReplyDraft", "args": { "text": "感谢您的反馈…" } }],
  "planStepId": "ui_fill_draft",
  "reason": "plan_host_tool",
  "runId": 42,
  "turnId": 7
}
```

**Mutation 完成：**

```json
{
  "action": "host_action",
  "scope": "review-detail",
  "entity": { "type": "review", "id": "123" },
  "hostTools": [
    { "name": "refreshEntity", "args": { "entityType": "review", "entityId": "123" } }
  ],
  "reason": "agent_mutation_success",
  "runId": 42,
  "turnId": 7
}
```

### 2.3 废弃字段（勿再读取）

- `status`（含 `'completed'`、`'invoke'` 等历史值）
- `type`（如 `'refresh'`）
- `targets`

---

## 3. SDK 修改清单（按模块）

### 3.1 类型定义 `types/host-action.ts`

```diff
 export type HostActionPayload = {
   action: 'host_action';
-  status: 'completed';
   scope?: string;
   entity?: Record<string, unknown>;
   metadata?: Record<string, unknown>;
-  hostTools?: Array<{ name: string; args: Record<string, unknown> }>;
+  hostTools: Array<{ name: string; args: Record<string, unknown> }>;
+  planStepId?: string;
   reason?: string;
   runId?: number;
   turnId?: number;
 };
```

同步导出 `HostActionReason` 常量（可选，便于业务 switch）：

```ts
export const HOST_ACTION_REASON = {
  PLAN_HOST_TOOL: 'plan_host_tool',
  AGENT_MUTATION_SUCCESS: 'agent_mutation_success',
} as const;

export type HostActionReason =
  (typeof HOST_ACTION_REASON)[keyof typeof HOST_ACTION_REASON] | string;
```

---

### 3.2 SSE 解析层 `stream/host-action-parser.ts`

**职责**：从 `host_action` / `host-action` 事件解析 JSON，校验后交给分发器。

```ts
export function parseHostActionPayload(raw: unknown): HostActionPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  if (data.action !== 'host_action') return null;

  const hostTools = Array.isArray(data.hostTools) ? data.hostTools : [];
  if (hostTools.length === 0) return null;

  const scope = typeof data.scope === 'string' ? data.scope.trim() : '';
  if (!scope) return null;

  return {
    action: 'host_action',
    scope,
    entity: isRecord(data.entity) ? data.entity : undefined,
    metadata: isRecord(data.metadata) ? data.metadata : undefined,
    hostTools: hostTools.map(normalizeHostToolInvocation),
    planStepId: typeof data.planStepId === 'string' ? data.planStepId : undefined,
    reason: typeof data.reason === 'string' ? data.reason : undefined,
    runId: typeof data.runId === 'number' ? data.runId : undefined,
    turnId: typeof data.turnId === 'number' ? data.turnId : undefined,
  };
}
```

要点：

- **不再**读取或校验 `status`
- `hostTools` 为空或 `scope` 缺失 → 丢弃（与旧版 `status !== 'completed'` 丢弃等价，但语义更清晰）
- 保留对 `host-action` 事件名的兼容（连字符写法）

---

### 3.3 分发器 `host-bridge/dispatch-host-action.ts`

```diff
 export function dispatchHostAction(payload: HostActionPayload): void {
-  if (payload.action !== 'host_action' || payload.status !== 'completed') return;
+  if (payload.action !== 'host_action') return;
+  if (!payload.hostTools?.length) return;
   const scope = payload.scope?.trim();
   if (!scope) return;

   const handlers = hostActionRegistry.get(scope) ?? [];
   for (const handler of handlers) {
     void handler(payload);
   }
 }
```

若 SDK 内有 `emit('hostAction', payload)`，在 `dispatchHostAction` 校验通过后再 emit，避免业务收到无效 payload。

---

### 3.4 默认 Handler `host-bridge/default-host-action-handler.ts`

旧版可能在「无 `hostTools`」时走页面默认 invalidate；新协议下服务端 **有推送必有 `hostTools`**，默认 handler 可简化为：

```ts
export async function defaultHostActionHandler(
  action: HostActionPayload,
  ctx: { currentEntityId?: string; runHostTool: typeof runHostTool },
): Promise<void> {
  if (action.entity?.id && ctx.currentEntityId && action.entity.id !== ctx.currentEntityId) {
    return;
  }
  for (const tool of action.hostTools) {
    await ctx.runHostTool(action.scope!, tool.name, tool.args);
  }
}
```

业务若需在 `agent_mutation_success` 后额外 refetch，在 `useHostAction` 回调里按 `reason` 分支，**不要**写回 SDK 默认逻辑。

---

### 3.5 `useHostAction` / `onHostAction`

```diff
 export function useHostAction(
   scope: string,
   handler: (action: HostActionPayload) => void | Promise<void>,
 ): void {
   useEffect(() => {
     return chat.onHostAction(scope, async (action) => {
-      if (action.status !== 'completed') return;
       await handler(action);
     });
   }, [scope, handler]);
 }
```

内置 wrapper 若曾包一层 `status` 校验，删除即可；校验下沉到 `parseHostActionPayload` + `dispatchHostAction`。

---

### 3.6 去重（可选增强）

同 run 可能收到两次 `host_action`。若业务担心重复执行（如 `refreshEntity` 连刷两次），SDK 可提供可选去重：

```ts
type DedupeKey = `${number}:${string}:${string}`; // runId:reason:planStepId|_

function shouldDispatch(action: HostActionPayload, seen: Set<DedupeKey>): boolean {
  const key = `${action.runId ?? 0}:${action.reason ?? ''}:${action.planStepId ?? '_'}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}
```

- **默认**：不去重，两次都执行（与「指令列表」语义一致）
- **业务**：在 handler 内按 `reason` 自行决定

---

## 4. 业务侧迁移（嵌入 SDK 的页面代码）

### 4.1 必改

```diff
 useHostAction('review-detail', async (action) => {
-  if (action.status !== 'completed') return;
   if (action.entity?.id && action.entity.id !== reviewId) return;

-  if (action.hostTools?.length) {
-    for (const tool of action.hostTools) {
-      await runHostTool('review-detail', tool.name, tool.args);
-    }
-    return;
-  }
-  await refetchReview(reviewId);
+  for (const tool of action.hostTools) {
+    await instance.runHostTool('review-detail', tool.name, tool.args);
+  }
+  if (action.reason === 'agent_mutation_success') {
+    await refetchReview(reviewId);
+  }
 });
```

### 4.2 不必改

- `setPageContext` / `attachPageContext`
- `registerHostToolsWithSync` / `POST /host-tool/client/register`
- 写确认 `confirmWrite` / `cancelWrite` 流程

### 4.3 新增能力（可选接入）

| 场景 | 做法 |
|------|------|
| Plan 步填入草稿 | 注册 `exposure: 'LLM'` 工具；收到 `plan_host_tool` 时执行 |
| 写成功后刷新 | 注册 `exposure: 'ON_COMPLETE'` 工具；收到 `agent_mutation_success` 时执行 |
| 对账 | 日志里打 `planStepId` + `runId` |

---

## 5. 时序（mutation + Plan UI）

```text
用户发消息（带 pageContext）
  → think / message（流式）
  → [可选] host_action（reason=plan_host_tool）     ← run 进行中，填草稿等
  → confirmation_required + complete                ← 写门闩，尚无 mutation SUCCESS
用户 confirmWrite
  → message（续跑）
  → host_action（reason=agent_mutation_success）    ← HTTP 写成功
  → complete
```

| 阶段 | 是否 `host_action` |
|------|-------------------|
| 仅分析 / 只读 | 否（除非 Plan 含 `host_tool` 步） |
| 写确认门闩 | 否 |
| Plan `host_tool` 步 | 是（`plan_host_tool`） |
| 写 HTTP 成功 | 是（`agent_mutation_success`） |

---

## 6. 向后兼容（过渡期，可选）

若需同时对接旧 agent-server，可在 **解析层** 做一层适配（不建议长期保留）：

```ts
function normalizeLegacyHostAction(data: Record<string, unknown>): HostActionPayload | null {
  // 新协议：无 status，直接 parse
  const modern = parseHostActionPayload(data);
  if (modern) return modern;

  // 旧协议兜底（过渡期）
  if (data.status !== 'completed') return null;
  return parseHostActionPayload({ ...data, action: 'host_action' });
}
```

与新版 agent-server 联调通过后删除 `status` 分支。

---

## 7. 测试用例

### 7.1 单元测试

| 用例 | 输入 | 期望 |
|------|------|------|
| 合法 plan 推送 | `plan_host_tool` + `hostTools` | `dispatchHostAction` 调用 handler |
| 合法 completion 推送 | `agent_mutation_success` + `hostTools` | 同上 |
| 带 `status: completed` 的旧 payload | 无 `hostTools` 或仅有 status | **不** dispatch（或过渡期 adapter 处理） |
| 空 `hostTools` | `action: host_action` | 丢弃 |
| 无 `scope` | 有 `hostTools` | 丢弃 |
| entity 串页 | `entity.id` ≠ 当前页 | handler 内跳过（业务测） |

### 7.2 集成测试

1. **只读对话**：无 `host_action`
2. **mutation + ON_COMPLETE 工具**：confirm 后收到 `agent_mutation_success`，`runHostTool` 被调用
3. **Plan fillReplyDraft**：run 中途收到 `plan_host_tool`，草稿填入
4. **同 run 双推送**：先 `plan_host_tool` 再 `agent_mutation_success`，两次 `hostTools` 均执行
5. **无 pageContext**：不应收到 `host_action`（服务端不发）

---

## 8. SDK 发布检查清单

- [ ] 删除 `HostActionPayload.status` 类型字段
- [ ] `hostTools` 改为必填类型
- [ ] 新增 `planStepId?`、`reason` 文档与类型
- [ ] `parseHostActionPayload` 不依赖 `status`
- [ ] `dispatchHostAction` 门闩改为 `action` + `hostTools` + `scope`
- [ ] `useHostAction` / 内置 handler 移除 `status` 判断
- [ ] 导出 `HOST_ACTION_REASON` 常量（可选）
- [ ] CHANGELOG 标明 **BREAKING**：需升级 agent-server 至去掉 status 的版本
- [ ] 示例代码与 Storybook 同步更新

---

## 9. 相关文档

| 文档 | 内容 |
|------|------|
| [host-tool-stream-dsl-frontend.md](./host-tool-stream-dsl-frontend.md) | Host Tool 流式 DSL v1 |
| [host-bridge-sdk-frontend.md](./host-bridge-sdk-frontend.md) | SDK API 与全链路 |
| [host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md) | pageContext + SSE 协议细节 |
| [host-tool-client-register-frontend.md](./host-tool-client-register-frontend.md) | 工具注册与 `exposure` |
| [chat-sse-message-blocks-frontend.md](./chat-sse-message-blocks-frontend.md) | SSE 事件总览 |
| [write-confirmation-frontend.md](./write-confirmation-frontend.md) | 写确认时序 |

---

## 附录 A：`host_tool_invoke` observation

Plan 步执行 host tool 时，引擎会写入名为 `host_tool_invoke` 的 tool observation（供后续 LLM 轮次读取，**不是** SSE `host_action`）。

| 字段 | 说明 |
|------|------|
| `outcome` | `'dispatched'`（已下发 SSE）或 `'skipped'`（步被跳过） |
| `planStepId` | 关联的 Plan 步 id |
| `reason` | skip 时原因码（如 `no_host_tool_calls`、`unexpected_http_tool_calls`） |
| `attemptedTools` | skip 时曾尝试的 host tool 名 |
| `attemptedHttpTools` | skip 时误产的 HTTP tool 名 |

前端若解析 run steps / observation 做调试面板，需识别 `outcome` 字段（**BREAKING** 相对旧版无 envelope 的 observation）。

---

## 10. 一句话对照

| 旧思维 | 新思维 |
|--------|--------|
| `host_action` = mutation 成功了 | `host_action` = 请执行 `hostTools` |
| 先看 `status` | 先看 `hostTools` + `reason` |
| 没 `hostTools` 时自己做 refresh | 服务端有推送必有 `hostTools`；refresh 做成具名 Host Tool 或 handler 里按 `reason` 分支 |
