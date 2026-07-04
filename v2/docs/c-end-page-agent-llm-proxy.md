# C 端 PageAgent LLM 代理接口对接文档

> **受众**：C 端宿主前端、PageAgent SDK 接入方。  
> **目标**：浏览器内 PageAgent 通过服务端代理访问大模型，不在前端配置模型、不暴露 provider key。  
> **B 端审计**：见 [b-end-page-agent-llm-proxy-audit.md](./b-end-page-agent-llm-proxy-audit.md)。

---

## 1. 接口概览

| 项 | 说明 |
|----|------|
| Method | `POST` |
| Path | `/page-agent/compatible-mode/v1/chat/completions` |
| Global Prefix | **无 `/admin`** |
| 鉴权 | `Authorization: Bearer <user_jwt>` + `X-App-Dsn: <dsn>` |
| 响应类型 | OpenAI-compatible JSON |
| 模型来源 | 服务端 DB `LlmModelConfig(kind=chat, enabled=true)` |
| 超时 | 服务端环境变量 `PAGE_AGENT_PROXY_TIMEOUT_MS`，默认 `60000` ms |

前端可以把 SDK 固定配置为：

```ts
const pageAgentLlm = {
  baseURL: `${baseUrl}/page-agent/compatible-mode/v1`,
  model: 'page-agent',
  // customFetch 自动注入 Authorization / X-App-Dsn
};
```

实际调用路径为：

```http
POST /page-agent/compatible-mode/v1/chat/completions
Authorization: Bearer <user_jwt>
X-App-Dsn: <dsn>
Content-Type: application/json
Accept: application/json
```

---

## 2. 请求体

请求体兼容 OpenAI `chat/completions`。前端传入的 `model` 仅作为占位和审计参考，服务端会覆盖为 DB 中启用的模型。

```json
{
  "model": "page-agent",
  "messages": [
    {
      "role": "system",
      "content": "You are a browser page agent."
    },
    {
      "role": "user",
      "content": "帮我完成当前页面操作"
    }
  ],
  "tools": [],
  "tool_choice": "required",
  "stream": false
}
```

### 服务端强制行为

- `model`：强制覆盖为 `LlmModelConfig(kind=chat)` 的 `model`。
- `stream`：C 端默认为 `false`；当前服务端实际会覆盖为 `false`，即使前端传 `true`。
- `stream_options`：非流式场景不需要，服务端可忽略前端传入的 `stream_options`。
- `temperature` / `max_tokens`：前端未传时，服务端使用 DB 配置中的 `temperature` / `maxTokens` 作为默认值。
- `apiKey` / `baseUrl` / `provider`：前端不可传，也不会被服务端信任；真实配置只来自 DB。

---

## 3. 成功响应

成功响应不走普通 JSON 包络，服务端直接透传上游 OpenAI-compatible ChatCompletion JSON。

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```

示例：

```json
{
  "id": "chatcmpl_xxx",
  "object": "chat.completion",
  "model": "qwen-plus",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": []
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 1200,
    "completion_tokens": 80,
    "total_tokens": 1280
  }
}
```

前端处理建议：

- 按普通 JSON 处理响应，`page-agent@1.11.0` 会直接调用 `response.json()`。
- 不要依赖服务端追加自定义事件；服务端只做代理和审计。
- 如果上游 provider 返回 `usage`，B 端审计会记录 token；没有返回时 token 字段为 `null`。

---

## 4. 错误响应

### 4.1 服务端前置错误

例如缺少 JWT、DSN、请求体无 `messages`、DB 未配置启用模型、上游连接超时等，响应为 OpenAI-compatible error 结构，HTTP 状态码是真实错误码。

```json
{
  "error": {
    "message": "page-agent proxy upstream timeout",
    "type": "server_error",
    "code": 408
  }
}
```

常见错误：

| HTTP | 场景 |
|------|------|
| `400` | 请求体不是对象或 `messages` 不是数组 |
| `401` | 用户 JWT 无效 |
| `403` | DSN 无效或 AppClient 不可用 |
| `404` | 没有启用的 `LlmModelConfig(kind=chat)` |
| `408` | 上游请求超过 `PAGE_AGENT_PROXY_TIMEOUT_MS` |
| `502` | 上游请求失败或客户端连接提前关闭 |

### 4.2 上游 provider 错误

如果请求已经到达上游，服务端会尽量透传上游 HTTP status、`content-type` 和响应 body。前端应兼容上游返回的 OpenAI error JSON。

---

## 5. 审计与隐私

每次调用都会写入一条轻量审计记录：

- `appClientId`
- `userId`
- `modelConfigId`
- `requestedModel`
- `provider`
- `providerModel`
- `status`
- `upstreamStatus`
- `durationMs`
- `promptTokens` / `completionTokens` / `totalTokens`
- `requestMeta`

服务端**不会保存完整 `messages`**，避免页面 DOM、业务文本或用户隐私进入审计表。`requestMeta` 只包含 `messageCount`、`toolCount`、`toolChoice`、`bodyKeys` 等摘要信息。

---

## 6. 接入 Checklist

- C 端请求路径不要带 `/admin`。
- 每次请求必须带 `Authorization: Bearer <user_jwt>`。
- 每次请求必须带 `X-App-Dsn`。
- SDK 可固定传 `model: "page-agent"`，无需知道真实模型名。
- SDK 侧按 JSON 响应处理，即使业务传了 `stream: true` 也会被服务端覆盖为 `false`。
- 不要在前端保存或传递 provider key。
