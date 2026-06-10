# 评论回复 Skill · 模板样例

> 与「评论分析 skill」配对使用，通过 **capabilityKey / description** 在 L0 向量召回中拉开差距。  
> 创建前请确认 Tool 已绑定到 Agent，且 `agentMetadata.decisionRole` 正确（见文末）。

---

## 1. 与分析 Skill 的分工

| 维度 | 评论分析 skill | 评论回复 skill（本模板） |
|------|----------------|--------------------------|
| capabilityKey | `review-analyze` | `review-reply` |
| 用户意图 | 分析、统计、差评原因、数据洞察 | 识别评论、**撰写/提交回复**、remark |
| 工作流 | 先列表取数 → 再 content 分析 | 读详情 → 写回复/remark |
| 典型 query | 「分析一下 reviewId…」「差评原因」 | 「根据评论内容**回复**」「帮我回这条评论」 |
| 绑定工具 | 列表（+ 可选详情） | **详情 + 备注/回复（写）** |
| deliverable | `analysis` | `mutation`（含写确认） |
| riskLevel | 通常 L1 | **L2/L3**（含写 Tool） |

建议同时将现有分析 skill 的 `capabilityKey` 从 `review` 改为 `review-analyze`，并收紧描述（见 §6）。

---

## 2. 创建 Skill（POST）

**`POST /agent/:agentId/app-client/:appClientId/skills`**

将 `toolId` 换成你环境中真实的 ID（须已出现在该 Agent 的 `AgentTool` 中）。

### 2.1 最小创建（推荐，无需 `config`）

管理端若尚未支持 `config` 字段，**只填下列字段即可**。Plan 节点会根据 Skill 命中后 gated 的工具角色自动推断：

- gated 同时含 `read-detail` + `write-single`（或 `write-batch` 等写 role）→ 规则 Plan：`read-detail → write → summarize`
- 无需在 Skill 上配置 `config.workflow`

```json
{
  "name": "评论回复skill",
  "capabilityKey": "review-reply",
  "description": "根据 reviewId 或评论标识获取单条评论详情，理解评论 content 后撰写卖家回复，并通过备注/回复接口提交。适用于「回复评论」「回评」「remark」类请求；不负责批量评论数据分析或差评统计报告。",
  "riskLevel": "L2",
  "isActive": true,
  "prompt": "你是卖家评论回复助手。仅在用户需要「回复/回评/remark」已存在的评论时遵循本技能。\n\n## 目标\n1. 用 read-detail 按 user 提供的 reviewId（或等价标识）拉取完整评论与 content。\n2. 基于 observations 中的评论正文，生成专业、礼貌、可执行的卖家回复文案。\n3. 当 user_intent 要求提交或明确同意发布时，调用 write/remark 类工具提交；未要求提交时，先在回复中给出草稿，勿擅自调用写接口。\n\n## 工具纪律\n- 第一步只读：未拿到评论 content 前不要调用写工具。\n- 写工具会触发用户确认；勿在一次 tool_calls 中混入无关读工具与写工具（读先、写后）。\n- 提交参数须来自 observations 或 user_intent，禁止编造 reviewId。\n\n## 回复风格\n- 语种与用户评论一致（中文/英文）。\n- 针对具体问题回应；无法核实的事实不要承诺。\n- 若评论为空或详情接口失败，说明原因并给出可操作建议，勿伪造回复内容。",
  "tools": [
    { "toolId": 0, "isRequired": true },
    { "toolId": 0, "isRequired": true }
  ]
}
```

**必填运行时条件（与 `config` 无关）：**

| 项 | 要求 |
|----|------|
| SkillTool | 同时绑定 **详情读** + **备注写** 两个 Tool |
| Tool `agentMetadata.decisionRole` | 分别为 `read-detail`、`write-single`（或等价写 role） |
| `riskLevel` | 建议 `L2`（含写操作，触发写确认） |
| `prompt` | 写明读先写后、写需用户确认 |

### 2.2 可选：`config` 显式 Plan（高级）

后端 API / DB 支持可选 JSON 字段 `config`（`Skill.config`），用于覆盖默认步序。管理端未接入时可省略。

```json
{
  "config": {
    "deliverable": "mutation",
    "workflow": {
      "steps": [
        {
          "id": "fetch_review",
          "phase": "gather",
          "kind": "tool",
          "toolRole": "read-detail",
          "objective": "Call read-detail once with reviewId (or identifiers) from user_intent. Load full review content before drafting a reply.",
          "stopWhen": "observation_non_empty"
        },
        {
          "id": "submit_reply",
          "phase": "mutate",
          "kind": "tool",
          "toolRole": "write-single",
          "objective": "When user_intent requires submission, call the remark/write tool with reply body derived from review content in observations. Do not call write until read-detail succeeded.",
          "stopWhen": "observation_non_empty"
        },
        {
          "id": "confirm_outcome",
          "phase": "answer",
          "kind": "summarize",
          "objective": "Tell the user whether the reply was drafted or submitted, citing observations. If only drafted, present the reply text clearly.",
          "stopWhen": "always"
        }
      ]
    }
  }
}
```

优先级：`config.workflow`（若存在且合法）> 规则模板（read+write 自动推断）> Plan LLM。

### 工具 ID 对照（示例名，以你库中为准）

| 建议 role | 示例 Tool 名 | 示例 path |
|-----------|--------------|-----------|
| `read-detail` | `S02S1102` | `/seller/review/detail/{reviewId}` |
| `write-single` | `S02S1116` | `/seller/review/remark` |

创建时把上面两个 `toolId: 0` 分别换成 `S02S1102`、`S02S1116` 在库里的数字 ID。  
若创建接口已带 `tools`，可省略后续 PUT；否则：

**`PUT /skill/:skillId/tools`**

```json
{
  "tools": [
    { "toolId": 1102, "isRequired": true },
    { "toolId": 1116, "isRequired": true }
  ]
}
```

---

## 3. Plan 顺序（避免「拉完数据就结束」）

| 顺序 | 结果 |
|------|------|
| ✅ `read-detail` → `write` → `summarize` | 先拿评论，再提交回复，最后汇总 |
| ⚠️ `read-detail` → `summarize` → `write` | 中间会先出草稿再继续写（已支持续跑，但体验割裂） |
| ❌ 仅绑列表工具 + 分析 skill | Plan 常为 `list → summarize`，**无法回复** |

务必绑定 **详情 + remark**，并在 `config.workflow` 中把 **summarize 放在最后**（见 §2 JSON）。

---

## 4. 仅草稿、不自动提交（可选变体）

若希望默认只生成回复文案、由用户二次确认后再发消息触发写操作，可去掉 workflow 中的 `submit_reply` 步，改用 `deliverable: "detail"`：

```json
{
  "deliverable": "detail",
  "workflow": {
    "steps": [
      {
        "id": "fetch_review",
        "phase": "gather",
        "kind": "tool",
        "toolRole": "read-detail",
        "objective": "Load review by reviewId from user_intent.",
        "stopWhen": "observation_non_empty"
      },
      {
        "id": "draft_reply",
        "phase": "answer",
        "kind": "summarize",
        "objective": "Draft seller reply from review content. Do NOT call write tools.",
        "stopWhen": "always"
      }
    ]
  }
}
```

用户另发「确认提交」时再走写 Tool（或 `confirmWrite` 续跑）。

---

## 5. 召回与环境变量（双 Skill）

```env
SKILL_VECTOR_MIN_SCORE=0.42
SKILL_SINGLE_MIN_SCORE=0.42
SKILL_RECALL_MIN_GAP=0.08
```

- 两个 skill 分数接近（差 < 0.08）→ **miss**，走 intent + 全量 tool（比绑错 skill 安全）。
- 回复类 query 应更贴近 `review-reply` 描述；分析类更贴近 `review-analyze`。

---

## 6. 联调检查

- [ ] 「识别 reviewId…**回复**」→ 命中 `评论回复skill`，`recallScore` Top-1 为 id=回复
- [ ] 「**分析** reviewId…评论」→ 命中 `评论分析skill`
- [ ] 两句分数差 < 0.08 时 → `hit: false`，`reason: no_relevant_match`
- [ ] 命中回复 skill 后 `gatedToolCount` ≥ 2（detail + remark）
- [ ] 调用 remark 时出现写确认 SSE（`confirmation_required`）

---

## 7. 「评论分析 skill」召回优化

L0 嵌入文本 = `name` + `capabilityKey` + `description`（见 `buildSkillRouterEmbedText`）。  
关键词召回对用户 query 做分词（含中文双字切分），在嵌入文本里算命中率；向量召回做语义相似度。  
要与回复 skill 拉开 **Top-1 分差 ≥ 0.08**，分析侧需在描述里**密集覆盖分析类触发词**，回复侧则覆盖「回复/回评/remark」。

### 7.1 推荐字段（提升分析类 query 分数）

完整模板见 **[review-analyze-skill.example.md](./review-analyze-skill.example.md)**。

```json
{
  "name": "评论分析skill",
  "capabilityKey": "review-analyze",
  "description": "评论分析、评论统计、差评分析、差评原因、差评归因、评论构成、情感分析、评论报告、数据洞察。先按用户筛选条件调用评论列表取数，再基于 content 解读构成、评分分布与差评原因。适用：分析、统计、报告、洞察类请求；不适用：回复、回评、remark 提交。",
  "prompt": "你是评论数据分析助手。处理评论分析、评论统计、差评分析、差评原因、差评归因、评论构成、情感分析、评论报告、数据洞察类请求时遵循本技能。\n\n## 工作流（先查数，再分析）\n1. **取数**：将 user 的筛选条件转为评论列表（read-list）参数，调用一次取数；多页由引擎自动拉全。\n2. **分析**：取数完成后再基于 observations 中 content 解读构成、分布与差评原因。\n3. **输出**：数据驱动分析结论；不撰写卖家回复、不调用写接口或 remark。"
}
```

| 字段 | 召回作用 |
|------|----------|
| `name` 含「评论分析」 | 命中「分析」「评论」双字 token |
| `capabilityKey` `review-analyze` | 与分析类英文 query / reviewId 场景语义靠近 |
| `description` 前置分析同义词 +「先查数再分析」 | 抬高关键词命中率；与回复 skill 工作流形成对比 |
| 末尾「不适用：回复…」 | 与 `review-reply` 划界，避免两 skill 分数胶着导致 `no_relevant_match` |

### 7.2 L1 二次召回

L0 miss 且候选数 ≤ 5 时，会追加 `prompt` **前 300 字**再召回（`prompt_excerpt` 阶段）。  
上方 §7.1 的 `prompt` 开头已按此优化（分析/统计/差评/报告等触发词集中在前 300 字内）。

### 7.3 PATCH 示例

**`PATCH /skill/:skillId`** — 与 §7.1 相同，需同时更新 `description` 与 `prompt`。

修改 `name` / `description` / `prompt` 后需等 skill 向量缓存失效（服务重启或 fingerprint 变更）后分数才会更新。

---

## 8. Tool 元数据要求

Skill gate 后 Plan 的 `toolRole` 须与 scoped 工具一致。请确认 Tool 的 `agentMetadata` 中 `decisionRole` 为：

| Tool | decisionRole |
|------|----------------|
| 评论详情 | `read-detail` |
| 评论列表 | `read-list` |
| 评论 remark/回复 | `write-single` |

未配置时 Plan workflow 校验可能失败并降级为 LLM Plan / template。

---

## 9. 相关文档

- [Skill 数据模型](../skill-data-model.md)
- [Plan 节点与 workflow](../plan-node.md)
- [写操作确认 · 前端](../write-confirmation-frontend.md)
