# 宿主桥接：pageContext 与 host_action

与 omnix-chat SDK 对齐的入站页面上下文与出站宿主动作 SSE。

**前端 / SDK 对接（推荐入口）**：[host-bridge-sdk-frontend.md](./host-bridge-sdk-frontend.md)  
**协议细节**：[host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md)

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

`POST /chat/{sessionId}/prepare` 可选带 `pageContext.page` 做 **Host Tool 按页预热**，详见 [host-tool-prepare-frontend.md](./host-tool-prepare-frontend.md)。prepare 不替代发消息时的 pageContext。

## 出站：host_action SSE

mutation 工具 **HTTP 成功** 且 run `status=success` 时，在 `complete` **之前**推送（`hostTools` 非空）：

```
event: host_action
data: {"action":"host_action","scope":"review-detail","entity":{...},"hostTools":[{"name":"refreshEntity","args":{...}}],"reason":"agent_mutation_success","runId":42,"turnId":7}
```

Plan `host_tool` 步 mid-run 也会推送，`reason` 为 `plan_host_tool`，常带 `planStepId`。

**流式 DSL（v1，待实现）**：[host-tool-stream-dsl-frontend.md](./host-tool-stream-dsl-frontend.md)

| 条件 | 是否推送 |
|------|----------|
| 仅分析、无 mutation tool SUCCESS | 否 |
| 写确认门闩 `confirmation_required`（尚未执行写 HTTP） | 否 |
| 写确认续跑后 mutation SUCCESS | 是 |
| run 失败 | 否 |
| 无入站 `pageContext.page` | 否 |

**语义**：`host_action` 携带 `hostTools[]` 供浏览器执行；`reason: agent_mutation_success` 表示 mutation 已成功，**不是**刷新指令。具体 UI 由宿主 `registerHostAction(scope, handler)` 决定。

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

写确认通过并成功后，SDK 应收到 `host_action`（`reason: agent_mutation_success`），`scope` 为 `review-detail`。
