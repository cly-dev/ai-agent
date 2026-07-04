# B 端 PageAgent LLM 代理审计对接文档

> **受众**：B 端管理台前端、运维看板、实施排障人员。  
> **目标**：查询 C 端 PageAgent LLM 代理调用记录，定位模型、用户、状态、耗时和 token 用量。  
> **C 端调用**：见 [c-end-page-agent-llm-proxy.md](./c-end-page-agent-llm-proxy.md)。

---

## 1. 基础约定

| 项 | 说明 |
|----|------|
| B 端前缀 | `/admin` |
| 鉴权 | `Authorization: Bearer <admin_token>` |
| 响应包络 | 普通 JSON 会被包装为 `{ status, message, data }` |
| 分页 | `page` 从 1 开始，`pageSize` 最大 100 |
| 数据来源 | `PageAgentLlmProxyAudit` |

成功响应统一为：

```json
{
  "status": 200,
  "message": "success",
  "data": {}
}
```

业务失败时 HTTP status 可能仍是 `200`，前端应读取外层 `status` 和 `message`。

---

## 2. 分页查询审计列表

```http
GET /admin/page-agent/llm-proxy-audit/by-app-client/:appClientId
Authorization: Bearer <admin_token>
```

### Query 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认 `1` |
| `pageSize` | number | 否 | 每页条数，默认 `20`，最大 `100` |
| `userId` | number | 否 | 按 C 端用户过滤 |
| `status` | string | 否 | `running` / `success` / `failed` |
| `modelConfigId` | number | 否 | 按 LLM 配置 ID 过滤 |
| `upstreamStatus` | number | 否 | 按上游 HTTP 状态码过滤，如 `200`、`429`、`500` |

示例：

```http
GET /admin/page-agent/llm-proxy-audit/by-app-client/2?page=1&pageSize=20&status=failed
Authorization: Bearer <admin_token>
```

### 响应

```json
{
  "status": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 101,
        "appClientId": 2,
        "appClientName": "Demo App",
        "userId": 8,
        "username": "alice",
        "userEmail": "alice@example.com",
        "modelConfigId": 3,
        "requestedModel": "page-agent",
        "provider": "openai-compatible",
        "providerModel": "qwen-plus",
        "status": "success",
        "upstreamStatus": 200,
        "durationMs": 2350,
        "promptTokens": 1200,
        "completionTokens": 80,
        "totalTokens": 1280,
        "createdAt": "2026-07-04T03:10:00.000Z",
        "finishedAt": "2026-07-04T03:10:02.350Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

## 3. 查询审计详情

```http
GET /admin/page-agent/llm-proxy-audit/by-app-client/:appClientId/:id
Authorization: Bearer <admin_token>
```

示例：

```http
GET /admin/page-agent/llm-proxy-audit/by-app-client/2/101
Authorization: Bearer <admin_token>
```

### 响应

详情在列表字段基础上增加 `requestMeta` 和 `errorMessage`。

```json
{
  "status": 200,
  "message": "success",
  "data": {
    "id": 101,
    "appClientId": 2,
    "appClientName": "Demo App",
    "userId": 8,
    "username": "alice",
    "userEmail": "alice@example.com",
    "modelConfigId": 3,
    "requestedModel": "page-agent",
    "provider": "openai-compatible",
    "providerModel": "qwen-plus",
    "status": "success",
    "upstreamStatus": 200,
    "durationMs": 2350,
    "promptTokens": 1200,
    "completionTokens": 80,
    "totalTokens": 1280,
    "requestMeta": {
      "bodyKeys": ["model", "messages", "tools", "tool_choice", "stream"],
      "messageCount": 2,
      "toolCount": 5,
      "requestedStream": false,
      "forcedStream": false,
      "requestedModel": "page-agent",
      "toolChoice": "required",
      "hasStreamOptions": false
    },
    "errorMessage": null,
    "createdAt": "2026-07-04T03:10:00.000Z",
    "finishedAt": "2026-07-04T03:10:02.350Z"
  }
}
```

---

## 4. 字段说明

| 字段 | 说明 |
|------|------|
| `requestedModel` | C 端请求体中的 `model`，通常是 `page-agent`；仅用于追踪，不代表真实调用模型 |
| `provider` | DB `LlmModelConfig.provider` |
| `providerModel` | 实际上游模型；初始来自 DB，若非流式响应携带 `model` 会更新为上游返回值 |
| `status` | 审计状态：`running`、`success`、`failed` |
| `upstreamStatus` | 上游 provider HTTP status；请求未到达上游时可能为 `null` |
| `durationMs` | 从创建审计到流结束或失败的耗时 |
| `promptTokens` | 上游 `usage.prompt_tokens` / `input_tokens` |
| `completionTokens` | 上游 `usage.completion_tokens` / `output_tokens` |
| `totalTokens` | 上游 `usage.total_tokens`，或由 prompt + completion 估算 |
| `requestMeta` | 请求摘要，不包含完整 `messages` |
| `errorMessage` | 失败摘要；上游非 2xx 时会记录错误预览或 `upstream <status>` |

---

## 5. 状态展示建议

| status | UI 建议 |
|--------|---------|
| `running` | 展示为“进行中”；如果持续时间异常长，可提示检查服务端或上游连接 |
| `success` | 展示耗时、模型、token |
| `failed` | 高亮 `upstreamStatus` 和 `errorMessage`，支持按状态筛选 |

排障优先级：

1. `upstreamStatus=401/403`：检查 DB 中 LLM API Key 或 provider 权限。
2. `upstreamStatus=429`：上游限流，结合时间范围和用户维度排查。
3. `upstreamStatus=5xx`：上游服务异常。
4. `upstreamStatus=null` 且 `status=failed`：请求未到达上游，优先看超时、网络、DB 配置是否缺失。

---

## 6. 隐私边界

审计表不保存完整 `messages`，因此 B 端不能还原页面 DOM、用户完整输入或工具参数全文。`requestMeta` 只用于排障统计，例如消息数量、工具数量、请求字段名和实际 `stream` 值。

如需临时排查完整 prompt，应通过单独 debug 开关和脱敏策略处理，不应在该审计接口中展示完整正文。
