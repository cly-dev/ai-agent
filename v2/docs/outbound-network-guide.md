# 出站网络与连通性指南

> **受众**：B 端管理台、C 端 Chat 前端、后端联调、运维。  
> **定位**：外部连接治理（出站 HTTP）、B 端联通测试、C 端用户断连/失败提示的**唯一参考文档**。  
> **相关代码**：`src/core/outbound-http/`、`src/modules/connectivity/`、`src/core/agent-engine/engine/agent-run-user-messages.util.ts`

---

## 1. 总览

本服务对外部系统的依赖分为四类：

| 类型 | 典型用途 | 出站方式 | 用户可见失败？ |
|------|----------|----------|----------------|
| **PostgreSQL** | 业务数据、会话、配置 | Prisma 连接池 | 一般表现为整站 5xx |
| **Redis** | 会话队列、SSE 中继、缓存 | ioredis | 多实例 SSE 可能丢推送；一般不弹「Redis 断了」 |
| **LLM** | Chat、Embedding、意图向量 | LangChain / 统一 HTTP | **是**（SSE + 中文文案） |
| **Integration / Tool** | 业务 HTTP API | `OutboundHttpService` | **是**（SSE + 中文文案） |
| **AppClient 外部鉴权** | C 端账号校验 | `fetch` + 超时 | 登录失败提示（非 Chat SSE） |

**B 端「测试联通」**：运营在保存配置前/后主动探测，返回 `ok` / `durationMs` / `error`。  
**C 端「用户使用」**：运行中连接失败时，通过 **SSE 事件 + 中文 userHint** 告知终端用户，不暴露 URL、堆栈或密钥。

---

## 2. 统一出站 HTTP（OutboundHttpService）

### 2.1 设计原则

- 所有 Tool、Integration 探测、Embedding HTTP、PageAgent LLM 代理上游，经 `OutboundHttpService.fetchWithPolicy()` 发出。
- **Policy 显式传入**：超时、SSRF、可选 `AbortSignal`（与 run 取消合并）。
- **HTTP 层默认不重试**：Tool 业务层已有 `TOOL_INVOKE_MAX_RETRIES`；避免双重重试。
- **LangChain Chat**：`ChatOpenAI` 配置 `timeout` + `maxRetries: 0`，与 Tool 哲学一致。

### 2.2 错误分类

`OutboundHttpError.kind`：

| kind | 含义 | Tool 用户文案倾向 | LLM 用户文案倾向 |
|------|------|-------------------|------------------|
| `timeout` | 超过 `timeoutMs` | 「查询/写操作超时…」 | 「生成回复超时…」 |
| `abort` | 外部 signal 取消（含用户停止） | 视上下文 | 视上下文 |
| `network` | DNS、连接拒绝、重置等 | 「未能完成查询…」（泛化） | 「智能回复暂时不可用…」 |
| `ssrf` | 出站 URL 未通过安全校验 | 管理端配置问题 | — |

文案生成入口：`buildToolFailureUserMessage()` / `buildLlmFailureUserMessage()`（`agent-run-user-messages.util.ts`）。

### 2.3 调用点一览

| 模块 | label | SSRF |
|------|-------|------|
| `ToolEngineService` debug / invoke | `tool_debug` / `tool_invoke:{name}` | 是 |
| `IntegrationService` probe | `integration_probe` | 是 |
| `LlmService` embedding | `llm_embedding` | 否（配置 URL） |
| `PageAgentProxyService` | `page_agent_proxy` | 是 |
| AppClient 外部鉴权 | —（独立 `fetch` + 超时） | 否（客户内网场景） |

---

## 3. 环境变量

复制 `.env.example` 中出站相关项：

```bash
# LLM Chat（LangChain wall-clock 超时，默认 120s）
LLM_OUTBOUND_TIMEOUT_MS=120000

# Embedding HTTP（默认 30s）
LLM_EMBEDDING_TIMEOUT_MS=30000

# Tool 默认超时（单 tool 可在 DB 覆盖）
TOOL_DEFAULT_TIMEOUT_MS=10000

# B 端 Integration baseUrl 探测
INTEGRATION_PROBE_TIMEOUT_MS=10000

# PageAgent C 端 LLM 代理上游
PAGE_AGENT_PROXY_TIMEOUT_MS=60000

# AppClient 外部账号校验 HTTP
APP_CLIENT_AUTH_TIMEOUT_MS=15000

# Redis 连接（见 MEMORY 相关注释）
REDIS_URL=redis://localhost:6379
```

**调优建议**：

- 内网 LLM 推理慢：适当增大 `LLM_OUTBOUND_TIMEOUT_MS`，勿与 `max_steps` 混淆。
- 重查询 Tool：在 Tool 表配置 `timeout`（毫秒），会覆盖默认值。
- 生产多实例：**必须**配置 `REDIS_URL`，否则 SSE 无法跨实例中继。

---

## 4. B 端联通测试 API

全局前缀：`/admin`（见 `create-nest-app.util.ts`）。

### 4.1 基础设施批量检测（新增）

| 方法 | 路径 | 角色 | 说明 |
|------|------|------|------|
| `GET` | `/admin/connectivity/database` | VIEWER | `SELECT 1` |
| `GET` | `/admin/connectivity/redis` | VIEWER | `PING`；未配置时 `detail.configured=false` |
| `GET` | `/admin/connectivity/summary` | VIEWER | 仅 database + redis |
| `POST` | `/admin/connectivity/llm/chat` | OPERATOR | 当前启用的 Chat 配置最小 invoke |
| `POST` | `/admin/connectivity/llm/embedding` | OPERATOR | 当前启用的 Embedding 探测 |
| `POST` | `/admin/connectivity/batch` | OPERATOR | 批量；body 可选 `{ "targets": [...] }` |

**batch 默认 targets**：`database`、`redis`、`llm_chat`、`llm_embedding`。

**响应形状**（单项）：

```json
{
  "target": "llm_chat",
  "ok": true,
  "durationMs": 842,
  "detail": { "configId": 1, "provider": "openai-compatible", "model": "gpt-4", "probe": "chat" },
  "error": null
}
```

**batch 响应**：

```json
{
  "checkedAt": "2026-07-07T08:00:00.000Z",
  "checks": [ /* ConnectivityCheckResult[] */ ]
}
```

### 4.2 LLM 指定配置

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/admin/llm-model-config/:id/test-connection` | 按配置 id 探测；`chat` / `api_embedding` / `transformers_embedding` |

`LlmConnectionTestResult` 字段：`ok`、`configId`、`kind`、`probe`、`durationMs`、`error`。

### 4.3 Integration（原有）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/admin/integration/test-connection` | body：`{ baseUrl, apiKey? }`，保存前探测 |
| `POST` | `/admin/integration/:id/test-connection` | 已保存记录；body 可临时覆盖 |

响应：`{ reachable, url, method, statusCode?, durationMs, error? }`。

### 4.4 Tool HTTP（原有）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/admin/tool/:id/debug` | 带参数真实调用下游；返回 `ToolDebugResult` |

### 4.5 AppClient 外部鉴权（原有）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/admin/app-client/:id/auth/test` | body：`{ accountToken }` |

### 4.6 B 端联调顺序建议

1. `GET /admin/connectivity/summary` — 本机 DB + Redis  
2. `POST /admin/llm-model-config/:id/test-connection` — LLM  
3. `POST /admin/integration/test-connection` — 业务 baseUrl  
4. `POST /admin/tool/:id/debug` — 具体 API 路径 + 参数  
5. `POST /admin/connectivity/batch` — 发布前一键回归  

---

## 5. C 端：用户使用时的失败提示

### 5.1 两条 SSE 通道

```
外部连接失败
    ├─ 图内消化（llm / summarize 节点）→ SSE event: message（assistant blocks）
    └─ 整轮未捕获 / Launcher 兜底      → SSE event: error（+ 常跟 complete）
```

| SSE `event` | 何时 | 前端处理 |
|-------------|------|----------|
| `message` | 正常回复流；**含** tool/llm 图内错误说明 | 渲染 assistant 气泡 |
| `error` | 整轮失败、用户取消 | Toast / 错误条；读 `message`（已是中文） |
| `complete` | run 结束 | 关 loading；`status: cancelled` 等 |
| `think` | 思考过程 | 可选展示 |

**原则**：展示文案用 `message` / blocks 正文或 `error.message`；**不要**把 `code` 或内部 `error` 字段直接给用户看（`code` 仅用于 UI 分支）。

### 5.2 Machine Code 与文案对照

定义见 `AgentMachineCode`（`agent-run-user-messages.util.ts`）。

#### Tool 相关

| code | 典型触发 | 用户文案（摘要） |
|------|----------|------------------|
| `TOOL_TIMEOUT` | 出站超时、`AbortError` | 读：「查询超时…」；写：「写操作超时…」 |
| `TOOL_AUTH_FAILED` | 401/403、密钥未解析 | 「请确认已绑定正确的集成密钥…」 |
| `TOOL_DOWNSTREAM_ERROR` | HTTP 4xx/5xx、**网络断开**（`OutboundHttpError.kind=network`） | 带 HTTP 状态摘要，或「无法连接下游服务…」 |
| `TOOL_EMPTY_RESULT` | 其它 tool 失败 | 「未能完成查询…」 |

#### LLM 相关

| code | 典型触发 | 用户文案（摘要） |
|------|----------|------------------|
| `LLM_TIMEOUT` | 超时、网络断开、abort | 「生成回复超时…」/「无法连接智能服务…」 |
| `LLM_RATE_LIMIT` | 429 / quota | 「智能服务当前较繁忙，请稍后再试。」 |

#### 会话 / 写确认

| code | 用户文案（摘要） |
|------|------------------|
| `RUN_CANCELLED` | 「已停止生成。」 |
| `WRITE_CONFIRMATION_EXPIRED` | 「写操作确认已过期…」 |
| `WRITE_CONFIRMATION_REQUIRED` | 写确认门（`message` 非 error） |
| `NO_AGENT` | 「当前会话未绑定可用 Agent…」 |

完整字符串以实现代码为准；变更时请只改 `agent-run-user-messages.util.ts`。

### 5.3 分场景说明

#### Tool / Integration 断连

1. `ToolEngineService` 抛出错误或返回 HTTP 非 2xx  
2. 写入 `_agentToolError` observation（含 `userHint`、`code`）  
3. **读类 tool**：`summarize` 规则化输出，不经 LLM  
4. **写类 / mutate**：可能再经 LLM 润色，底层仍是 `userHint`  
5. 通过 SSE `message` 推送 `text` blocks  

#### LLM 断连 / 超时

1. `llm.node` catch → `buildLlmFailureUserMessage()`  
2. 写入 failed llm step → `pendingRespond` 直接回复用户  
3. 未捕获时 `AgentRunLauncher` → `emitRunError`  

#### 用户停止 / 新消息顶掉

```json
{ "event": "error", "message": "已停止生成。", "code": "RUN_CANCELLED" }
{ "event": "complete", "status": "cancelled", "reason": "cancelled|superseded" }
```

#### 浏览器 SSE 断开

- 服务端 run **可能仍在执行**；结果会落库。  
- 重连 SSE 时重放**最近 8 条**缓冲事件（`ChatEventsService.REPLAY_BUFFER`）。  
- 页面刷新：`GET /chat/:sessionId/run-state` 对齐 `generation`、active run、`pendingWriteGate`。  
- 长跑/慢 tool 断连过久：依赖**历史消息接口**补全，不一定收到 `error`。

---

## 6. C 端前端集成清单

### 6.1 SSE 订阅

```typescript
// 伪代码 — 以项目实际 Chat SSE 封装为准
es.onmessage = (raw) => {
  const evt = parseChatSse(raw);

  switch (evt.event) {
    case 'error':
      showErrorToast(evt.payload.message);
      if (evt.payload.code === 'RUN_CANCELLED') hideLoading();
      break;

    case 'message':
      if (evt.payload.source === 'agent-run') {
        renderAgentRunMessage(evt.payload); // 含 stream / blocks / 写确认
      }
      break;

    case 'complete':
      hideLoading();
      if (evt.payload.status === 'cancelled') { /* 已取消 */ }
      break;
  }
};
```

### 6.2 建议用 `code` 驱动的 UI

| code | 建议交互 |
|------|----------|
| `TOOL_AUTH_FAILED` | 引导用户绑定集成密钥 / 联系管理员 |
| `TOOL_TIMEOUT` / `LLM_TIMEOUT` | 「重试」按钮 |
| `LLM_RATE_LIMIT` | 延迟重试 |
| `RUN_CANCELLED` | 仅关 loading，不弹吓人错误 |
| `WRITE_CONFIRMATION_REQUIRED` | 展示写确认 UI（`writeDraft` 等） |

### 6.3 断线恢复

1. 打开会话 → 建立 SSE  
2. 调用 `run-state` 与当前 `generation` 比对  
3. 若 `activeRunId` 存在且 SSE 无新事件 → 轮询消息列表或提示「仍在处理中」  
4. 收到 `complete` / `error` 后停止轮询  

### 6.4 不要做的事

- 不要把 `ToolDebugResult.url`、下游 body 原文展示给 C 端用户  
- 不要用 B 端 `reachable: false` 的 `error` 字符串直接当 Chat 文案  
- 不要假设 `error` SSE 一定伴随 `status: failed` 的 complete（部分路径 `handleRunFailure` 会以 success 落库并展示错误正文）  

---

## 7. 运维与排障

### 7.1 日志检索

出站失败日志带 `label`，例如：

- `[tool_invoke:query_orders] request timed out after 10000ms url=...`
- `[integration_probe] ...`
- `[page_agent_proxy] ...`

### 7.2 常见问题

| 现象 | 可能原因 | 排查 |
|------|----------|------|
| B 端通、C 端超时 | Tool `timeout` 过短 / 用户查询更重 | 调 Tool timeout 或 `TOOL_DEFAULT_TIMEOUT_MS` |
| 仅生产偶发丢推送 | Redis 未配或 SSE 中继失败 | `GET /admin/connectivity/redis`；查 `CHAT SSE relay` 日志 |
| 用户见「查询超时」但 B 端 debug 成功 | 用户密钥 vs 系统密钥、参数不同 | 用该用户 `userIntegration` 复现 |
| 「生成回复超时」 | `LLM_OUTBOUND_TIMEOUT_MS` 过小 | B 端 `test-connection` + 调大超时 |
| 刷新后看不到结果 | SSE 缓冲仅 8 条 | 拉历史消息；考虑加长缓冲或 run-state 轮询 |

### 7.3 CLI 冒烟（非 HTTP）

```bash
pnpm run db:smoke          # Postgres + Redis
pnpm run memory:redis-smoke
```

---

## 8. 安全说明

- Tool / Integration 出站默认走 `assertOutboundUrlAllowed()`（防 SSRF）。  
- AppClient 外部鉴权 URL **不做** SSRF（客户内网账号服务场景）。  
- B 端探测与 debug 响应**不返回**完整 apiKey；Tool debug 对 headers 脱敏。  
- C 端文案层**不包含**内网 host、堆栈、原始 JSON body（除非业务刻意写入 userHint 的下游摘要）。  

---

## 9. 文档变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-07 | 初版：OutboundHttpService、Connectivity 模块、C 端 SSE 提示规范 |
