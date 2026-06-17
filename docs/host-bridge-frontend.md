# 宿主桥接：pageContext 与 host_action

与 omnix-chat SDK 对齐的入站页面上下文与出站宿主动作 SSE。

**前端对接（推荐从这里读）**：[host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md)  
SDK 类型与 Registry：agent-chat `docs/host-page-context-and-actions.md`

## 入站：pageContext

用户发消息时（`POST /chat` 或 `POST /chat/{sessionId}/messages`），请求体可携带：

| 字段 | 说明 |
|------|------|
| `pageContext` | **推荐**：嵌套对象 |
| `page`, `routePath`, `flowId`, `programName`, `entity`, `metadata` | 平铺兼容字段，与嵌套合并 |

服务端解析后：

1. 写入 `Message.pageContextJson`
2. 传入 `AgentRunInput.pageContext` → LangGraph `state.pageContext`
3. Prompt 注入 `<page_context>` system 段
4. Write normalize 时按 tool `businessFields` / schema 从 `entity` 补齐参数（须在 tool metadata 声明标识字段）
5. 写确认挂起时存入 `PendingWriteResumeContext.pageContext`（续跑后 host_action 镜像）

**会话回落**：新 `pageContext` 写入 `SessionGoaMemory.lastPageContext`；追问未带时自动回落（不写死 GOA `entities` 键名）。

`POST /chat/{sessionId}/prepare` **不**携带 pageContext（设计如此）。

## 出站：host_action SSE

mutation 工具 **HTTP 成功** 且 run `status=success` 时，在 `complete` **之前**推送：

```
event: host_action
data: {"action":"host_action","status":"completed","scope":"review-detail","entity":{...},"runId":42,"turnId":7,"reason":"agent_mutation_success"}
```

| 条件 | 是否推送 |
|------|----------|
| 仅分析、无 mutation tool SUCCESS | 否 |
| 写确认门闩 `confirmation_required`（尚未执行写 HTTP） | 否 |
| 写确认续跑后 mutation SUCCESS | 是 |
| run 失败 | 否 |
| 无入站 `pageContext.page` | 否 |

**语义**：`status: "completed"` 表示「本轮 mutation 已成功」，**不是**刷新指令。具体 UI 反应（refetch / toast / 忽略）由宿主 `registerHostAction(scope, handler)` 自行决定。

| 字段 | 来源 |
|------|------|
| `scope` | 镜像入站 `pageContext.page`（handler 路由） |
| `entity` | 镜像入站 `pageContext.entity`（防误处理校验） |
| `metadata` | 镜像入站 `pageContext.metadata`（透传） |
| `reason` | 默认 `agent_mutation_success`；可被 Skill `config.hostBridge.reason` 覆盖 |

Skill 可选配置（仅埋点，不驱动 UI）：

```json
{
  "config": {
    "deliverable": "mutation",
    "hostBridge": {
      "reason": "review_reply_submitted"
    }
  }
}
```

## 试点页面

```json
{
  "pageContext": {
    "page": "review-detail",
    "entity": { "type": "review", "id": "123" }
  }
}
```

写确认通过并成功后，SDK 应收到 `host_action`（`status: completed`），`scope` 为 `review-detail`。
