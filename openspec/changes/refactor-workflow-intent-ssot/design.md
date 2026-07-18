## 上下文

已完成方向纠偏：配置面不再手搓旧 action。进一步明确：

- **Intent**：业务编排语言（运营 / B 端）
- **IR**：机器语言（Compiler 输出、Runtime 执行、研发排障）
- IR **必须少而稳定**；否则 Compiler 与平台化会同时痛苦
- 禁止 IR 重新长成「退款 / 客服 / SEO / 广告」业务 DSL

## 目标 / 非目标

**目标：**

1. 锁定 ≤30 的六类 IR 目录 + 统一节点协议。
2. Intent → IR 的映射规则清晰可测；业务垂直能力停在 Intent/Skill。
3. 淘汰伪节点（上下文加载、识图、线索判定、生成并推送一体包）。
4. Runtime Context 自动注入（pageContext / session / tenant），不占 IR。

**非目标（本阶段）：**

- 一次实现全部 Trigger/Parallel/Join/SubWorkflow executor
- 可视化「IR 业务画布」给运营
- 独立 Policy / Embedding 产品化上线（可先占类型位）

## 决策

### D0. 两层语言（最高优先级）

```text
Intent（业务）──compile──► IR（机器）──execute──► Runtime Context + effects
```

| 层 | 谁写 | 例子 |
|----|------|------|
| Intent | 配置 / Preset | `read` + `evidence.images`；`mutate`；`judge` |
| IR | 仅 Compiler / 研发调试 | `data_query` → `llm` → `condition` → `tool_call` → `message_send` |

**禁止**：在 IR 增加 `refund_*` / `seo_*` / `review_spam_*` 一类业务 type。

### D1. 统一 IR 节点协议

```typescript
type WorkflowIrNode = {
  id: string;
  type: WorkflowIrNodeType; // 六类词表内
  name?: string;
  input?: Record<string, unknown>;   // 声明读哪些 context/上游
  output?: Record<string, unknown>;  // 声明写出 keys（可选 schema）
  config: Record<string, unknown>;   // 节点静态配置
  retry?: { maxAttempts: number; backoffMs?: number };
  timeoutMs?: number;
};
```

执行：`execute(node, context) → { contextPatch, effects }`。

### D2. IR 六类目录（目标词表，≤30）

#### 1. Trigger（3）— 资产级启动；Chat/Page 入口可省略、由宿主触发

| type | 说明 |
|------|------|
| `event_trigger` | 领域事件 |
| `schedule_trigger` | cron |
| `webhook_trigger` | 外部 HTTP 调起 |

> 一期 Chat/PageAction：**不写 Trigger 节点**，由入口 runtime 直接 `init` IR body。

#### 2. Data（4）

| type | 说明 |
|------|------|
| `context_read` | 从 Runtime Context 投影字段（非业务；可选；多数路径可省略） |
| `data_query` | 经 Tool/API/ES 等读数（取代 fetch_data） |
| `data_transform` | 映射 / 清洗 |
| `merge` | 多路上游合并 |

#### 3. AI（5）

| type | 说明 |
|------|------|
| `llm` | 通用生成；`config.capabilities.vision?` 取代 summarize_images |
| `structured_output` | 结构化判定（取代 detect_clues 业务味） |
| `embedding` | 占位 |
| `retrieval` | 占位 |
| `rerank` | 占位 |

#### 4. Control（6 首期，上限 8）

| type | 一期 |
|------|------|
| `condition` | ✅ |
| `router` | ✅（多分支；接 structured_output） |
| `parallel` | ⏳ 延后 |
| `join` | ⏳ 延后 |
| `loop` | ⏳ 延后 |
| `delay` | ⏳ 延后 |

#### 5. Action（5）

| type | 说明 |
|------|------|
| `tool_call` | HTTP/业务 Tool 写或读（写操作用此） |
| `http_call` | 裸 HTTP（可选；无 Tool 封装时） |
| `host_effect` | 页内 HostTool 推送（原 generate_and_push 的「推」） |
| `message_send` | 邮件/短信/站内等通道（与 host 分离） |
| `human_task` | 人工；含确认/审批门（吸收 await_user_confirm / approval） |

> `database_write` 不单独上：统一走 `tool_call`，避免双通道。

#### 6. System（4 首期，上限 5）

| type | 说明 |
|------|------|
| `retry` | 可作装饰策略；首期也可挂在节点 `retry` 字段 |
| `catch_error` | ⏳ |
| `timeout` | 节点 `timeoutMs` 优先；独立节点 ⏳ |
| `sub_workflow` | ⏳ |
| （approval） | **并入 `human_task`**，不单列以免与 Action 重复 |

**首期可实现目标约 15–18 type；类型位 ≤30。**

### D3. 明确淘汰（不得再进入 IR type）

| 旧东西 | 处置 |
|--------|------|
| `load_page_context` | Runtime Context 自动注入 |
| `summarize_images` | `llm` + `capabilities.vision`（或 compile 展开仍是 `llm`） |
| `detect_clues` | `structured_output` + `router` |
| `generate_and_push` | `llm`（或 structured）+ `host_effect` / `message_send` |
| `present_mutation` | `llm`/`message_send` 展示草稿，或 `human_task` 携带 draft |
| 垂直业务节点 | Intent / Skill / Preset |

### D4. 旧 WorkflowActionKind → 新 IR（映射）

| 旧 IR action | 新 IR |
|--------------|-------|
| `fetch_data` | `data_query` |
| `summarize` | `llm` 或 `message_send`（仅输出通道时） |
| `compose_mutation` | `data_transform` + `structured_output` / `llm` |
| `write_data` | `tool_call` |
| `await_user_confirm` | `human_task` |
| `present_mutation` | `message_send` 或 `human_task` |
| `generate_and_push` | `llm` + `host_effect` |
| `detect_clues` | `structured_output` + `router` |
| `summarize_images` | `llm` (vision) |
| `load_page_context` | （无节点） |

### D5. Intent 映射示例

```text
Intent: operation=refund_process（Skill 预设，非 IR type）
  read(order) → judge → mutate → notify

Compiler → IR:
  data_query(order)
  → structured_output(reason)
  → router
  → human_task(confirm)?
  → tool_call(refund)
  → message_send(email)
```

日常四类 Intent operation（`read|judge|deliver|mutate`）仍可用；复杂域用 Preset/Skill 模板，**不要**把域名词写进 IR `type`。

### D6. 存储

- **Flow**（新）：`intent` SSOT + `ir` 编译快照；Skill / PageAction / Approval / PageActionRun 绑 `flowId`
- **Workflow**（归档）：legacy `nodes`；仅 migrate / 只读 Admin，**运行时不再加载**
- Admin 不可把 IR 当配置真源；研发可只读查看

### D7. 分期落地

| Phase | 内容 |
|-------|------|
| P0 | 类型契约 `workflow-ir.types.ts` + 目录文档；Intent 继续 |
| P1 | Compiler 改输出新 type；executor 适配层（旧名→新名别名可短暂） |
| P2 | 拆 `generate_and_push`；`structured_output`+`router` 替换 detect |
| P3 | Trigger / parallel 等按自动化需求再开（**本变更延后**） |
| P4 | 原生 IR executor：4.1c 双分发已落地；去 lower = 4.1f |

## 风险 / 权衡

- [词表一次改太多] → 先锁目录与映射，executor 分批  
- [Trigger 与现 Chat 入口重复] → Chat/Page 暂不强制 Trigger 节点  
- [host_effect vs message_send] → 明确页内 Host ≠ 消息通道  

## Open Questions

1. `context_read` 是否默认省略（推荐省略，特殊投影才生成）？  
2. `human_task` 是否覆盖 Chat writeGate + Approval approval 两种通道（推荐是，用 config.channel 区分）？  
3. IR 调试画布是否只读（推荐只读）？
