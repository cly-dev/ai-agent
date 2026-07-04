# C 端 Auto-Agent 对接文档

> **受众**：C 端宿主前端、Chat SDK / 会话 UI 接入方。  
> **目标**：前端不必强制选择 Agent；服务端会按用户权限、页面上下文和用户输入自动绑定合适 Agent。  
> **相关文档**：PageAgent LLM 代理见 [c-end-page-agent-llm-proxy.md](./c-end-page-agent-llm-proxy.md)。

---

## 1. 核心结论

Auto-Agent **不是单独接口**，而是集成在 Chat C 端接口里：

- 创建会话：`POST /chat`
- 发送消息：`POST /chat/:sessionId/messages`
- 查询会话详情：`GET /chat/:sessionId`
- 可选 Agent 列表：`GET /agent/client/available`

前端要启用 Auto-Agent：**创建会话或发送用户消息时不要传 `agentId`**。服务端会自动选择并把结果绑定到 `Session.agentId`。

---

## 2. 鉴权与响应约定

所有 C 端接口都不带 `/admin` 前缀。

```http
Authorization: Bearer <user_jwt>
X-App-Dsn: <dsn>
Content-Type: application/json
```

普通 JSON 成功响应有统一包络：

```json
{
  "status": 200,
  "message": "success",
  "data": {}
}
```

业务错误时 HTTP status 可能仍是 `200`，前端应读取外层 `status` 和 `data.code`。

---

## 3. 创建会话并自动选择 Agent

```http
POST /chat
Authorization: Bearer <user_jwt>
X-App-Dsn: <dsn>
```

### 请求体

推荐传 `pageContext`，它会参与自动选择，尤其是页面相关 HostTool 场景。

```json
{
  "role": "user",
  "content": "帮我分析当前订单并给出下一步建议",
  "pageContext": {
    "page": "order-detail",
    "routePath": "/orders/123",
    "routeParams": {
      "orderId": "123"
    },
    "entity": {
      "type": "order",
      "id": "123"
    },
    "metadata": {
      "tab": "overview"
    }
  }
}
```

如果前端要强制指定 Agent，可传 `agentId`：

```json
{
  "agentId": 12,
  "role": "user",
  "content": "用指定 Agent 处理这条消息"
}
```

### 响应

```json
{
  "status": 200,
  "message": "success",
  "data": {
    "sessionId": "4f4dcc3b5aa765d61d8327deb882cf99",
    "agent": {
      "id": 12,
      "source": "auto",
      "reason": "host page scope matched (order-detail); capability text matched (30)"
    }
  }
}
```

`agent.source` 说明：

| source | 含义 | 前端处理 |
|--------|------|----------|
| `requested` | 前端请求体显式传了可用 `agentId` | 展示“已选择指定 Agent” |
| `session` | 会话已经绑定 Agent，继续沿用 | 保持当前会话 Agent |
| `auto` | 服务端根据页面上下文和用户输入匹配成功 | 可展示“已自动选择 Agent” |
| `default` | 未形成明显匹配，使用后台配置的默认 Agent | 可展示默认 Agent |
| `fallback` | 无默认 Agent，使用第一个可用 Agent | 可弱提示“使用可用 Agent” |

---

## 4. 发送消息

```http
POST /chat/:sessionId/messages
Authorization: Bearer <user_jwt>
X-App-Dsn: <dsn>
```

### 请求体

已有会话通常不需要传 `agentId`。服务端会优先沿用会话已绑定的 Agent。

```json
{
  "role": "user",
  "content": "继续帮我检查这个订单有没有风险",
  "pageContext": {
    "page": "order-detail",
    "routePath": "/orders/123",
    "routeParams": {
      "orderId": "123"
    }
  }
}
```

如果会话还没有绑定 Agent，或者前端显式传入新的 `agentId`，服务端会重新确保会话 Agent：

```json
{
  "agentId": 15,
  "role": "user",
  "content": "切换到指定 Agent 处理"
}
```

### 响应

```json
{
  "status": 200,
  "message": "success",
  "data": {
    "id": 889,
    "sessionId": "4f4dcc3b5aa765d61d8327deb882cf99",
    "role": "user",
    "content": "继续帮我检查这个订单有没有风险",
    "runGeneration": 3
  }
}
```

`runGeneration` 用于前端同步当前会话运行代际。消息创建后，模型输出仍通过会话 SSE 获取。

---

## 5. 订阅会话 SSE

```http
GET /chat/:sessionId/stream
Authorization: Bearer <user_jwt>
X-App-Dsn: <dsn>
Accept: text/event-stream
```

事件类型沿用现有 Chat SSE：

| event | 说明 |
|-------|------|
| `think` | 思考 / 过程信息 |
| `message` | Assistant 文本或业务消息 |
| `complete` | 当前推送完成 |
| `error` | 推送失败 |

前端建议：

- 创建会话拿到 `sessionId` 后尽快订阅 SSE。
- 发送用户消息成功后，根据返回的 `runGeneration` 更新本地会话状态。
- 不要通过 Auto-Agent 返回值判断模型是否完成，完成状态以 SSE 为准。

---

## 6. 查询会话绑定的 Agent

```http
GET /chat/:sessionId
Authorization: Bearer <user_jwt>
X-App-Dsn: <dsn>
```

响应包含 `agentId`：

```json
{
  "status": 200,
  "message": "success",
  "data": {
    "sessionId": "4f4dcc3b5aa765d61d8327deb882cf99",
    "title": "帮我分析当前订单并",
    "agentId": 12,
    "createdAt": "2026-07-04T07:10:00.000Z",
    "messages": {
      "items": [],
      "total": 0,
      "page": 1,
      "pageSize": 20,
      "totalPages": 0
    }
  }
}
```

前端可用 `agentId` 做会话列表标识、会话详情顶部展示，或在刷新后恢复当前 Agent 展示。

---

## 7. 可选：展示用户可用 Agent 列表

如果 UI 需要提供“手动选择 Agent”的下拉，使用：

```http
GET /agent/client/available
Authorization: Bearer <user_jwt>
X-App-Dsn: <dsn>
```

响应：

```json
{
  "status": 200,
  "message": "success",
  "data": [
    {
      "id": 12,
      "name": "订单助手",
      "description": "处理订单查询、风险分析和售后建议"
    }
  ]
}
```

说明：

- 只返回当前用户角色权限内可用的 Agent。
- 如果前端传了不在可用列表内的 `agentId`，服务端会返回 `AGENT_NOT_AVAILABLE`。
- 如果只是启用 Auto-Agent，前端不需要先拉这个列表。

---

## 8. 自动选择规则

服务端选择优先级：

1. 请求体显式传入 `agentId`：校验可用后使用，`source=requested`。
2. 当前会话已有 `agentId`：继续使用，`source=session`。
3. 无显式 Agent 且会话未绑定：进入自动选择。

自动选择的候选范围：

- Agent 必须属于当前 `AppClient`。
- 当前用户必须在该 App 下有 `UserApp` 角色。
- 候选 Agent 的工具 / HostTool / Skill 会按用户角色权限和 Agent 限制过滤。
- 没有可用候选时返回 `NO_AVAILABLE_AGENT`。

自动打分因素：

| 因素 | 说明 |
|------|------|
| 页面匹配 | `pageContext.page` / 路由上下文解析出的 page scope 命中 Agent 的 HostTool page scope |
| 文本匹配 | 用户消息命中 Agent 名称、描述、Skill、Tool、HostTool 描述等能力文本 |
| 默认配置 | Agent config 中配置默认标识会获得兜底优先级 |

默认标识支持：

```json
{
  "isDefault": true
}
```

或：

```json
{
  "autoAgent": {
    "default": true
  }
}
```

---

## 9. 错误处理

### 无可用 Agent

```json
{
  "status": 400,
  "message": "当前应用未配置当前用户可用的 Agent，请联系管理员配置 Agent。",
  "data": {
    "code": "NO_AVAILABLE_AGENT",
    "message": "当前应用未配置当前用户可用的 Agent，请联系管理员配置 Agent。"
  }
}
```

前端建议：展示空态或联系管理员提示。

### 指定 Agent 不可用

```json
{
  "status": 400,
  "message": "agent 12 is not available for current user",
  "data": {
    "code": "AGENT_NOT_AVAILABLE",
    "message": "agent 12 is not available for current user"
  }
}
```

前端建议：清空本地选中的 `agentId`，重新拉 `GET /agent/client/available`，或让用户改用自动选择。

---

## 10. 前端接入 Checklist

- 创建新会话默认不传 `agentId`，让服务端自动选择。
- 尽量传 `pageContext`，尤其是页面型 Agent / HostTool 场景。
- 创建会话后保存返回的 `sessionId` 和 `agent.id`。
- 同一会话后续消息默认不传 `agentId`，避免无意切换 Agent。
- 如果 UI 支持手动选择，只允许选择 `GET /agent/client/available` 返回的 Agent。
- 发送消息后订阅或保持 `/chat/:sessionId/stream`，以 SSE 作为最终输出来源。
- 错误判断看外层 `status` 和 `data.code`，不要只看 HTTP status。
