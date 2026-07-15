# B 端大模型配置对接文档（LlmModelConfig）

> **受众**：B 端管理台、运维、联调。  
> **范围**：服务端全局启用的 Chat / Embedding 模型配置（`LlmModelConfig`），供 Agent、PageAction、PageAgent Proxy 等共用。  
> **代码**：`src/modules/llm-model-config/` · 表 `LlmModelConfig`（prisma）。

---

## 1. 总览

| 项 | 说明 |
|----|------|
| Base path | `/admin/llm-model-config` |
| 鉴权 | Bearer Admin Token；`AdminRoleGuard`（读至少 VIEWER，写至少 OPERATOR） |
| 活跃规则 | **同一 `kind` 同时仅一条 `enabled=true`**；新建/激活/把 enabled 置 true 会自动关掉同 kind 其它启用项 |
| 缓存 | 更新后服务端调用 `llmService.refreshConfigCache()`；多实例靠 Redis TTL + 主动 refresh |

前端 / 调用方**不要**在 C 端请求里传 provider key；上游地址与密钥只来自本表启用行。

---

## 2. 模型种类 `kind`

| kind | 用途 | 默认 provider |
|------|------|----------------|
| `chat` | 对话 / tool_call / PageAction 产参等 | `openai-compatible` |
| `api_embedding` | 远程 Embedding API | `openai-compatible-embeddings` |
| `transformers_embedding` | 本地 transformers.js | `transformers.js` |

运行时 Chat 取 **`kind=chat` 且 `enabled=true`** 的那一行。

---

## 3. API（注意方法）

| 方法 | Path | 说明 |
|------|------|------|
| `GET` | `/admin/llm-model-config` | 列出全部配置 |
| `GET` | `/admin/llm-model-config/kind/:kind` | 按 kind 列表（enabled 优先）；无数据 404 |
| `POST` | `/admin/llm-model-config` | **新建**一条 |
| `PATCH` | `/admin/llm-model-config/:id` | **按 id 更新**（部分字段） |
| `PATCH` | `/admin/llm-model-config/:id/activate` | 激活该条（同 kind 其它禁用） |
| `POST` | `/admin/llm-model-config/:id/test-connection` | 连通性探测（需 OPERATOR+） |
| `GET` | `/admin/llm-model-config/intent-recall` | 意图召回配置（同模块） |
| `PUT` | `/admin/llm-model-config/intent-recall` | 更新意图召回（**仅此用 PUT**） |

### 常见错误

```http
PUT /admin/llm-model-config          → 404（不存在该路由）
PATCH /admin/llm-model-config        → 404（必须带 :id）
PATCH /admin/llm-model-config/1      → 正确更新
```

先 `GET` 拿到 chat 配置的 `id`，再 `PATCH /admin/llm-model-config/{id}`。

---

## 4. 字段说明

### 4.1 表字段 / 请求体

| 字段 | 类型 | 必填（创建） | 说明 |
|------|------|------------|------|
| `kind` | enum | 是 | 见上表 |
| `model` | string | 是 | 上游模型名 / 路径，如 `/data/models/Qwen3-32B-AWQ` |
| `baseUrl` | string | 是 | 上游根地址，如 `http://172.30.30.153:8000` |
| `provider` | string | 否 | 默认按 kind |
| `apiKey` | string \| null | 否 | 可空；也可依赖环境变量 `OPENAI_API_KEY` 兜底 |
| `chatPath` | string | 否 | 默认 `/v1/chat/completions` |
| `parameters` | object | 否 | JSON；**窗口与 embedding 扩展参数见下** |
| `stream` | boolean | 否 | 默认 false（配置级默认；具体调用仍可覆盖） |
| `maxTokens` | int \| null | 否 | **输出**上限，不是上下文窗口 |
| `temperature` | number \| null | 否 | |
| `enabled` | boolean | 否 | 创建默认 true；置 true 会挤掉同 kind 其它启用项 |

`PATCH` 时全部字段可选，只传要改的。

### 4.2 `parameters`（Chat 重点）

服务端读窗口时按顺序取第一个有效正数：

1. `parameters.contextLength`（推荐）
2. `parameters.maxContextTokens`
3. `parameters.context_window`

| 键 | 含义 |
|----|------|
| `contextLength` | **模型上下文窗口（token）**，用于 prompt fit 预算与输出封顶 |
| `maxTokens`（也可在顶层列） | 输出侧参考；顶层 `maxTokens` 优先 |

**务必配置 `contextLength`。**  
未配置时：message 侧预算会退化成约等于 `maxTokens`（常见 ~2000），长 prompt（如大类目表）会被 fit **过度裁剪**。

Embedding（`transformers_embedding`）常用：

| 键 | 含义 |
|----|------|
| `localModelPath` | 本地模型路径 |
| `allowRemoteModels` | 是否允许远程拉模型 |

---

## 5. 推荐配置示例

### 5.1 查询当前 Chat

```http
GET /admin/llm-model-config/kind/chat
Authorization: Bearer <admin_token>
```

### 5.2 补上下文窗口（解决预算过小）

```http
PATCH /admin/llm-model-config/1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "parameters": {
    "contextLength": 32768
  },
  "maxTokens": 2000
}
```

说明：

- `contextLength`：按上游真实窗口填（如 8k / 16k / 32k）。
- `maxTokens`：单次**生成**上限；不要把整段 context（32768）填进 `maxTokens`。
- Chat / PageAction 走 `LlmService` 时会自动校正「`maxTokens` ≥ 窗口」的误配；**PageAgent 代理**同样会把请求里的 `max_tokens` 夹到校准后的输出上限，避免上游报 `maximum context length` / `0 input tokens`。
- `parameters` 为整对象更新语义时，若库里已有其它键，请先 GET 再合并后 PATCH，避免覆盖丢失。

### 5.3 新建一条 Chat 并启用

```http
POST /admin/llm-model-config
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "kind": "chat",
  "provider": "openai-compatible",
  "model": "/data/models/Qwen3-32B-AWQ",
  "baseUrl": "http://172.30.30.153:8000",
  "chatPath": "/v1/chat/completions",
  "parameters": {
    "contextLength": 32768
  },
  "stream": false,
  "maxTokens": 2000,
  "temperature": null,
  "enabled": true
}
```

### 5.4 切换启用模型

```http
PATCH /admin/llm-model-config/2/activate
Authorization: Bearer <admin_token>
```

### 5.5 连通性

```http
POST /admin/llm-model-config/1/test-connection
Authorization: Bearer <admin_token>
```

- Chat：最小 invoke  
- `api_embedding`：单次 embedding  
- `transformers_embedding`：本地加载探测  

---

## 6. Token 预算如何用到配置（联调验收）

拟合公式（概念）：

```
messageBudget ≈ contextLength - outputReserve(maxTokens) - 384
effectiveBudget ≈ floor(messageBudget × 0.92) - 384
```

| `contextLength` | `maxTokens`≈2000 时 message 预算量级 |
|-----------------|--------------------------------------|
| **未配置** | ≈ **2000**（极窄，长 context 必被砍） |
| 8192 | ≈ 5.7k |
| 16384 | ≈ 14k |
| 32768 | ≈ 30k |

验收：改完 `contextLength` 后重跑 PageAction / Chat，看 debug 里 fitted messages 是否还保留业务所需对照表；API 侧 `promptTokens` 应接近「真实输入」而非「消息裁到 1k + 巨型 tool enum」。

相关环境变量（可选覆盖安全边距，默认即可）：

| Env | 默认 | 含义 |
|-----|------|------|
| `PROMPT_BUDGET_ENABLED` | true | 是否做 prompt fit |
| `PROMPT_BUDGET_SAFETY_MARGIN_RATIO` | 0.08 | 安全余量 |
| `PROMPT_BUDGET_RESERVE_TOKENS` | 384 | fit 预留 |

HostTool 产参（PageAction tool_call）相关：

| Env | 默认 | 含义 |
|-----|------|------|
| `HOST_TOOL_CATALOG_ENUM_INJECT` | **关** | `1` 时将 context 目录 id 注入 tool schema `enum`；默认仅靠 prompt 对照 + flush 前 `sanitize` |

---

## 7. 管理台对接建议

1. 列表：`GET /admin/llm-model-config`，按 `kind` 分组展示。  
2. 编辑：**只用 `PATCH /:id`**，不要 `PUT` 集合路径。  
3. 表单分区：  
   - 连接：`baseUrl` / `chatPath` / `apiKey` / `model`  
   - 生成：`maxTokens` / `temperature` / `stream`  
   - 窗口：`parameters.contextLength`（必填提示）  
4. 保存后可调 `test-connection`；切换启用走 `activate`。  
5. `parameters` 编辑器用「读-改-写」合并，避免整对象覆盖。

---

## 8. 与其它模块边界

| 模块 | 关系 |
|------|------|
| Agent Chat / PageAction | 使用启用中的 `kind=chat` |
| PageAgent LLM Proxy | 同源 Chat 配置；审计不落完整 messages |
| Intent recall | 同 Controller 下 `intent-recall` 子资源，勿与模型 CRUD 混淆 |
| UserLlmModelConfig | 用户级覆盖表（另一模块）；全局默认仍以本表为准 |

---

## 9. 排障

| 现象 | 排查 |
|------|------|
| `PUT /admin/llm-model-config` → 404 | 改用 `PATCH /admin/llm-model-config/:id` |
| 改了配置不生效 | 是否打到正确 id；是否 `enabled`；看服务是否 refresh 缓存 / 多实例 |
| Prompt 被裁没 / fitted 只剩节选 | 检查 `parameters.contextLength` 是否配置 |
| `maxTokens` 被自动压到 2048 | 未配 `contextLength` 时大输出会被钳制；或 `maxTokens >= contextLength` 被纠正 |
| kind 列表 404 | 该 kind 尚无任何行，先 `POST` 创建 |

---

## 10. 参考代码

- Controller：`src/modules/llm-model-config/llm-model-config.controller.ts`
- DTO：`dto/upsert-llm-model-config.dto.ts` · `dto/update-llm-model-config.dto.ts`
- 窗口解析：`src/core/llm/llm.service.ts` → `resolveContextLength` / `getMessageTokenBudget`
- Schema：`prisma/schema.prisma` → `model LlmModelConfig`
