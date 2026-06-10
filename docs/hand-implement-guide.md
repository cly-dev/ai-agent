# Agent Server 手写实现指南

> 目的：帮你**脱离「只看 AI 生成的代码」**，按模块亲手实现一遍，真正理解系统结构与核心逻辑。  
> 用法：按 **Phase 顺序**逐步实现；每完成一 Phase，用文末 **自检清单** 验证；不必一次重写全部，可对照现有代码「关屏手写 → 对照修正」。

---

## 1. 系统是什么

这是一个 **企业内 Agent 编排服务**（NestJS + Postgres + Redis 可选）：

- **C 端**：员工/用户通过 `X-App-Dsn` + JWT 发消息，触发 Agent 自动回复（SSE 推送思考过程）
- **B 端 / Admin**：`/admin/*` 管理工具、Agent、用户、集成配置
- **核心能力**：Prompt 组装 → 意图召回缩小工具集 → LangGraph 循环（LLM ↔ Tool）→ 落库与指标

**你不是在写 ChatGPT 封装**，而是在写：**多租户 + 权限 + 工具 HTTP 代理 + 有状态会话 Agent**。

---

## 2. 架构分层（先建立 mental model）

```
┌─────────────────────────────────────────────────────────────┐
│  HTTP 层（modules/*/controller）                             │
│  chat / message / tool / agent / app-client / integration   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  编排层（core/agent-engine）★ 最核心                          │
│  SessionTurn → AgentRun → LangGraph(intent→llm→tools)       │
└─────┬──────────────┬──────────────┬─────────────────────────┘
      │              │              │
┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐  ┌──────────────┐
│ prompt    │  │ intent    │  │ tool-engine│  │ memory       │
│ 组装消息   │  │ 召回工具   │  │ HTTP 调工具 │  │ 会话/工作记忆 │
└─────┬─────┘  └───────────┘  └───────────┘  └──────────────┘
      │
┌─────▼─────┐
│ llm       │  OpenAI 兼容 chat + embedding
└───────────┘
      │
┌─────▼─────┐
│ prisma    │  Postgres
└───────────┘
```

### 目录职责速查

| 路径 | 职责 | 手写优先级 |
|------|------|-----------|
| `src/core/agent-engine/` | Agent 主循环、LangGraph、Run 落库 | ★★★ 必写 |
| `src/core/tool-engine/` | Tool → LangChain schema → HTTP 调用 | ★★★ 必写 |
| `src/core/prompt/` | 把 Agent/记忆/历史拼成 LLM messages | ★★★ 必写 |
| `src/core/intent/` | 类目/工具 Top-K 召回 | ★★☆ 建议写 |
| `src/core/llm/` | ChatOpenAI 封装、token 预算 | ★★☆ 建议写 |
| `src/core/memory/` | Redis 会话上下文、working memory | ★★☆ 建议写 |
| `src/modules/message/` | 用户消息 → 触发 agent | ★★★ 必写 |
| `src/modules/chat/` | 会话 CRUD、SSE | ★★☆ 建议写 |
| `src/modules/agent/` | Agent 配置 + **工具权限过滤** | ★★☆ 建议写 |
| `src/auth/` | JWT、DSN 解析 | ★☆☆ 可先读后用 |
| `src/modules/tool/` 等 CRUD | 标准 CRUD + 分页 | ★☆☆ 可后写 |

---

## 3. 核心数据模型（理解关系比记字段重要）

```
AppClient（租户）
  ├── Agent（systemPrompt, maxSteps, enableToolCall）
  ├── Tool（name, path, integrationId, toolCategoryId, riskLevel）
  ├── Integration（baseUrl, authMode, systemApiKey）
  └── Session
        ├── Message（user/assistant 持久化聊天记录）
        ├── SessionTurn（一轮 Q&A 汇总：userInput, finalOutput, metrics）
        └── AgentRun（单次 Agent 执行：steps, role, parentRunId 预留多 Agent）
```

### 权限链（工具谁能用）

```
User ──UserApp──► Role（allowToolLevel: L1/L2/L3）
                      │
                      └── RoleTool（toolId 白名单）
Agent ──AgentTool──► Tool
有效工具 = AgentTool ∩ RoleTool ∩ riskLevel ≤ allowToolLevel
```

**手写要点**：`AgentService.getAllowedTools()` 是安全边界，ToolEngine 执行时还要用 `allowedToolIds` 二次校验。

---

## 4. 两条 API 链路

### 4.1 C 端聊天（无 `/admin` 前缀）

```
POST /app-client/auth     → 外部账号换 JWT + 自动建档 User
POST /user/login          → 本地账号登录

Header: Authorization: Bearer <jwt>
Header: X-App-Dsn: <appClient.dsn>

POST /chat                → 创建 Session + 首条 user Message
POST /chat/:sessionId/message → 追加 user Message
GET  /chat/:sessionId/events  → SSE 订阅 think/result/complete/error
```

`main.ts` 里 `setGlobalPrefix('admin')` **排除了** `/chat`、`/user/login` 等路径。

Guard 链：`UserJwtAuthGuard` + `AppClientDsnGuard`（从 DSN 解析 `appClientId` 挂到 `req`）。

### 4.2 Admin 管理（`/admin` 前缀）

```
POST /admin/admin-user/login
其余 /admin/* → AdminPrefixJwtGuard（要求 JWT 含 adminRole）
```

---

## 5. 主链路：一条用户消息如何变成 Agent 回复

**这是整个系统最重要的一条线，建议你能白板画出来。**

```
① POST message (role=user)
      │
      ▼
② MessageService.create
      ├─ 写入 Message 表
      ├─ 更新 Redis SessionContext（或 DB 回写）
      └─ scheduleAgentRun（同 session 串行队列）
              │
              ▼
③ AgentEngineService.run
      ├─ 校验 Session / Agent
      ├─ getAllowedTools（权限过滤）
      ├─ 创建 SessionTurn + AgentRun（status=running）
      ├─ PromptComposer.compose → messages[]
      └─ runWithLangGraph(...)
              │
              ▼
④ LangGraph
      intent → llm → tools → llm → ... → END
              │
              ▼
⑤ finalizeRunAndTurn（metrics + steps + output）
      ├─ SessionGoaService.refreshFromAgentRun
      └─ SSE: result / think
              │
              ▼
⑥ MessageService.runAgentPipeline（续）
      ├─ create assistant Message
      ├─ 更新 SessionTurn.messageIdAssistant
      └─ SSE: complete
```

### 5.1 MessageService 串行队列（必懂）

```typescript
// 伪代码：同一 sessionId 的 agent run 必须排队
private chains = new Map<string, Promise<void>>();

scheduleAgentRun(sessionId, task) {
  const prev = chains.get(sessionId) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(task);
  chains.set(sessionId, next);
}
```

**为什么**：上一轮 assistant 还没入库时，下一轮 `PromptComposer` 会缺历史，导致上下文错乱。

---

## 6. Phase 手写顺序（推荐）

按依赖从底向上，每 Phase 可独立编译验证。

### Phase 0 — 基础设施（1–2 天）

| 任务 | 产出 |
|------|------|
| Nest + Prisma + Postgres 连通 | `PrismaService`, migrate |
| `load-env.ts` | 环境变量加载 |
| 全局 ValidationPipe、异常过滤器 | 与现有一致即可 |
| `LlmModelConfig` 单例读库 | `LlmService.refreshConfigCache` |

**自检**：能 `GET /docs`，DB 可连。

---

### Phase 1 — LLM 封装（1 天）

**文件**：`src/core/llm/llm.service.ts`

你要亲手实现的核心：

```typescript
// 1. 从 DB 读 active config，缓存 ChatOpenAI 实例
// 2. chat(messages) → 非流式，返回 text + tool_calls
// 3. streamChat（可选，SSE 打字机）
// 4. embedTexts（OpenAI /v1/embeddings，intent 用）
// 5. getMessageTokenBudget() = contextLength - outputReserve - buffer
// 6. trimMessagesToTokenBudget（从旧消息开始删）
```

**关键类型**（`llm.types.ts`）：

```typescript
type LlmChatMessage = { role: 'system'|'user'|'assistant'|'tool'; content: string; ... };
type LlmChatResult = { text: string; toolCalls: LlmToolCall[]; raw: AIMessage };
```

**手写练习**：不接 Agent，写个临时 script 调 `llmService.chat({ messages: [{ role:'user', content:'你好' }] })`。

---

### Phase 2 — Tool Engine（2 天）

**文件**：`src/core/tool-engine/tool-engine.service.ts`

#### 2.1 构建 LangChain Tool

```typescript
buildLangChainTools(definitions, ctx) {
  for (def of definitions) {
    if (!ctx.allowedToolIds.includes(def.id)) continue;
    tool(async (input) => executeByName(def.name, input, ctx), {
      name: def.name,
      description: def.description,
      schema: resolveToolJsonSchema(def.inputSchema, def.schema),
    });
  }
}
```

#### 2.2 执行 HTTP 工具（核心逻辑）

```
executeByName(toolName, input, allowedToolIds, userId):
  1. DB 查 Tool + Integration（必须在 allowedToolIds 内）
  2. 解析 OpenAPI parameters → path/query/header/body
  3. 根据 IntegrationAuthMode 选 token：
       USER_ONLY / USER_PREFERRED → UserIntegration.userApiKey
       SYSTEM_ONLY → integration.systemApiKey
  4. fetch(integration.baseUrl + tool.path, { method, headers, body })
  5. 超时 AbortController
  6. 返回 { name, output, latency }
```

**安全**：永远不信任 LLM 传的 toolName，必须过 `allowedToolIds` 白名单。

**手写练习**：注册一个 mock Integration（httpbin），写一个 Tool，单元测 `executeByName`。

---

### Phase 3 — Prompt Composer（1 天）

**文件**：`src/core/prompt/prompt-composer.service.ts`

消息组装顺序（**顺序有意义**）：

```
1. <agent_prompt>     ← Session.agentId → Agent.systemPrompt
2. <user_memory>      ← Redis/DB 用户长期记忆（可选）
3. <working_memory>   ← 当前会话任务状态摘要
4. <session_history>  ← 说明标签 + 可选 <session_history_summary> + 最近 N 条原文
5. user               ← latestUserMessage（若 history 末尾还没有）
```

**SessionContext**（Redis）结构：

```typescript
type SessionContextPayload = {
  sessionId: string;
  turns: SessionContextTurn[];  // 与 Message 同步
  workingMemory?: WorkingMemoryState;
  compressedHistorySummary?: string;   // 较早轮次 LLM 摘要
  compressedUpToMessageId?: number;    // 已纳入摘要的最后 messageId
  updatedAt: string;
};
```

**详见** `src/core/memory/context/session-history-compression.md`（多轮历史压缩）。

**手写练习**：给定 3 条历史 + workingMemory，手写 `compose()` 输出 messages 数组，数清楚几条 system、几条 user。

---

### Phase 4 — Intent 召回（1–2 天）

**文件**：`src/core/intent/category-intent-recall.service.ts`, `vector.util.ts`

**详见** `src/core/intent/intent.md`。

手写核心算法：

```typescript
// 类目召回
recallTopCategories(categories, userMessage):
  if mode == 'keyword':
    对每个 category 算 keywordRecallScore（分词命中率）
  else:
    embed userMessage + 各 category 文本
    cosineSimilarity 排序，取 Top-K，过滤 minScore

// 工具 bind 截断
recallTopToolsForBind(tools, userMessage, max=25):
  若 tools.length <= max → 全返回
  否则 Top-K 向量/关键词排序
```

**AgentEngine 侧协作**（在 intent 节点）：

```
1. isUserIntentClear（长度≥2 且含 Unicode 字母/数字）
2. recallTopCategories → matchedCategoryIds
3. filterToolsByIntent（按 toolCategoryId 过滤）
4. scopeToolsForMainLoop → 最多 bind AGENT_BIND_TOOLS_MAX 个
```

---

### Phase 5 — Agent Engine + LangGraph（3–5 天）★ 核心

**文件**：`src/core/agent-engine/agent-engine.service.ts`

#### 5.1 run() 入口伪代码

```typescript
async run({ userId, sessionId, input, userMessageId }) {
  session = 查 Session（必须属于 userId，必须有 agentId）
  agent = 查 Agent
  tools = agentService.getAllowedTools(agent.id, userId, appClientId)
  langChainTools = toolEngine.buildLangChainTools(tools, { userId, allowedToolIds })

  turn = prisma.sessionTurn.create({ userInput, status: running, ... })
  run  = prisma.agentRun.create({ turnId, role: primary, sequence: 1, ... })

  prompt = promptComposer.compose({ userId, sessionId, latestUserMessage: input })
  messages = trimMessagesToTokenBudget(prompt.messages, budget)

  try {
    state = await runWithLangGraph({ messages, tools, langChainTools, runId, ... })
    finalizeRunAndTurn({ turnId, runId, metrics, output, steps })
    workingMemory.refreshFromAgentRun(sessionId, { userInput, finalOutput, toolObservations })
    sessionHistoryCompression.maybeCompressAfterTurn(sessionId)
    return { runId, turnId, output, status: success }
  } catch (e) {
    finalizeRunAndTurn({ ..., status: failed, error })
    throw e
  }
}
```

#### 5.2 Graph 状态

```typescript
type AgentGraphState = {
  iteration: number;           // 每进 llm +1
  steps: AgentRunStep[];       // intent | llm | tool
  toolObservations: { name, output }[];
  pendingToolCalls: { name, arguments }[];
  finalOutput: string;
  status: AgentRunStatus;
  finished: boolean;
  scopedTools / scopedLangChainTools / scopedAllowedToolIds;
};
```

#### 5.3 三节点职责

**intent 节点**

```
- 若无工具或 enableToolCall=false → 跳过
- 意图不清 → finalOutput=澄清语, finished=true
- 否则召回 + 收窄 scopedTools
- 写 intent step 到 AgentRun.steps
```

**llm 节点**

```
- iteration++
- 组装 invokeMessages = promptMessages + toolObservations 摘要 + 决策提示
- bindTools(scopedLangChainTools)
- 调 llmService（记录 recordLlmUsage）
- 解析回复：
    有 tool_calls → pendingToolCalls，继续
    纯文本 → finalOutput，finished=true
- SSE emit think / result
```

**tools 节点**

```
- 并行 invokeLangChainTool（每个 call）
- 追加 tool step + toolObservations
- recordToolUsage
- 回到 llm（除非 iteration >= maxSteps）
```

#### 5.4 路由

```
START → intent
intent → (finished?) END : llm
llm    → (finished?) END : tools
tools  → (iteration >= maxSteps?) END : llm
```

**手写练习**（最小版）：先不写 intent，固定 2 个 tool，实现 `llm → tools → llm → END` 循环，打印 steps。

---

### Phase 6 — Message + Chat + SSE（1–2 天）

**MessageService**：Phase 5 的触发器（见第 5 节流程图）。

**ChatEventsService**：

```typescript
// 内存 Map<sessionId, ReplaySubject>，buffer 64 条
emit(sessionId, { event: 'think'|'result'|'complete'|'error', payload })
observeSession(sessionId) → Observable → Controller 转 SSE
```

**ChatController**：`@Sse()` 或手动 `text/event-stream`。

---

### Phase 7 — 记忆（1 天）

**SessionGoaService**：

```
每轮 Agent 成功后：
  从 run 投影 episode / artifact / activeTask
  写回 SessionGoaMemory（DB 权威）+ Redis goa:session:{id} 缓存
  对话 turns 仍在 SessionContextPayload（Redis）
```

**UserMemoryStore**：用户级长期偏好（结构类似，按 userId 存）。

---

### Phase 8 — 权限与多租户（1 天）

亲手理清：

1. `AppClientDsnGuard`：`X-App-Dsn` → `appClientId`
2. `getAllowedTools`：AgentTool ∩ RoleTool ∩ riskLevel
3. `UserIntegration`：按 userId + integrationId 存用户 API Key
4. `app-client/auth`：外部 SSO → upsert User by employeeId

---

### Phase 9 — CRUD 与可观测（按需）

- `SessionTurn` / `Tool` 分页列表（参考 `src/common/list-api.md`）
- `AgentRun.steps` + metrics 查询
- Admin 模块可最后用 codegen 生成

---

## 7. 核心接口契约（手写时对照）

### AgentEngineService.run

```typescript
input:  { userId, sessionId, input, userMessageId? }
output: { runId, turnId, output, status } | null  // null = 无 agentId
```

### PromptComposerService.compose

```typescript
input:  { userId, sessionId, latestUserMessage }
output: { messages: LlmChatMessage[] }
```

### CategoryIntentRecallService

```typescript
recallTopCategories(categories, userMessage, topK?)
  → { matches: [{ id, label, score, source }], source: 'vector'|'keyword' }

recallTopToolsForBind(tools, userMessage, max?)
  → { tools, bindCap?: { before, after, matches } }
```

### ToolEngineService.executeByName

```typescript
(toolName, input, allowedToolIds, userId)
  → { name, output, latency }
```

---

## 8. 环境变量（跑通 Agent 最少配置）

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...

# LLM（库表 LlmModelConfig 也可配）
# 意图召回 — 无 embedding 时：
AGENT_INTENT_RECALL_MODE=keyword
AGENT_BIND_TOOLS_MAX=25

# Redis（可选，无则 SessionContext 仅 DB）
REDIS_URL=redis://...

# Working memory
AGENT_WORKING_MEMORY_MODE=refresh  # 或 merge
```

---

## 9. 建议的手写训练法

### 方法 A：关屏重写（最有效）

1. 只打开本文档 + `prisma/schema.prisma`
2. 新建分支 `hand-write/phase-N`
3. 按 Phase 从零建文件，不看原实现
4. 编译通过后与原实现 diff，补遗漏

### 方法 B：单文件替换

保留 Nest 模块壳，逐个 Service 删掉方法体手写。

### 方法 C：调试驱动

在以下位置打断点 / 打日志，跟完一条真实请求：

```
MessageService.create
  → AgentEngineService.run
  → runWithLangGraph intent/llm/tools
  → ToolEngineService.executeByName
  → finalizeRunAndTurn
  → MessageService.runAgentPipeline
```

---

## 10. 自检清单

完成 Phase 5 后，你应该能**不看代码**回答：

- [ ] 用户发消息后，哪几个表会写入？顺序是什么？
- [ ] 工具权限在哪两层校验？
- [ ] intent 节点做了什么？为什么需要 bind 上限 25？
- [ ] llm 和 tools 节点之间 state 传什么？
- [ ] 为什么同 session 要串行 agent run？
- [ ] Prompt 里 working_memory 和 session_history 区别？
- [ ] SessionTurn 和 AgentRun 区别？多 Agent 怎么扩展？
- [ ] SSE 有哪几种 event？谁 emit、谁 consume？

完成全链路后：

- [ ] 发一条「查订单」类消息，能在 DB 看到 SessionTurn + AgentRun.steps
- [ ] 故意关掉 Integration，tool step 有 error 且 run status=failed
- [ ] keyword 模式下改 Tool description，召回结果会变化

---

## 11. 常见坑（AI 生成代码里容易忽略的）

| 坑 | 说明 |
|----|------|
| 历史重复 | compose 时 latestUserMessage 已在 history 末尾，勿重复 push |
| tool 白名单 | LLM 幻觉 tool 名，execute 必须查 allowedToolIds |
| token 爆炸 | compose 后必须 trimMessagesToTokenBudget |
| embedding 误配 | chat 模型不能当 AGENT_EMBEDDING_MODEL |
| 并发 session | 不同 session 可并行，同 session 必须串行 |
| CORS | chat/message 走 ChatPublicCorsMiddleware + main.ts 里 C 端路径 |
| admin 前缀 | Controller 路径与 globalPrefix exclude 要一致 |

---

## 12. 扩展阅读（模块内文档）

| 文档 | 内容 |
|------|------|
| `src/core/intent/intent.md` | 意图召回算法与环境变量 |
| `src/common/list-api.md` | 分页列表 API 规范 |
| `PRISMA.md` | 数据库与 migrate |
| `README.md` | 启动与部署 |

---

## 13. 多 Agent 预留（理解即可，暂不必手写）

当前只有 `role=primary` 的 AgentRun。扩展时：

```
SessionTurn
  ├── AgentRun(role=router, sequence=1)   拆任务
  ├── AgentRun(role=worker, sequence=2, parentRunId=1)
  └── AgentRun(role=reviewer, sequence=3)
```

Turn 级 metrics = `aggregateRunMetrics(childRuns)`。

---

*文档版本：与 SessionTurn + AgentRun metrics 实现同步。若 schema 变更，以 `prisma/schema.prisma` 为准。*
