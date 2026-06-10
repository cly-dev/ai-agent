# 评论分析 Skill · 模板样例

> 与 [评论回复 skill](./review-reply-skill.example.md) 配对。L0 召回用 `name + capabilityKey + description`；L0 miss 时 L1 会追加 **`prompt` 前 300 字**再召回（`SKILL_RECALL_PROMPT_EXCERPT_CHARS`，默认 300）。

---

## 1. 与回复 Skill 的分工

| 维度 | 评论分析 skill（本模板） | 评论回复 skill |
|------|--------------------------|----------------|
| capabilityKey | `review-analyze` | `review-reply` |
| 用户意图 | 分析、统计、差评原因、评论报告、数据洞察 | 回复、回评、remark、提交 |
| 工作流 | **先按条件查列表取数 → 再基于 content 分析解读** | 读单条详情 → 撰写/提交回复 |
| 绑定工具 | **评论列表**（`read-list`） | 详情 + 写（`read-detail` + `write-single`） |
| deliverable | `analysis` | `mutation` |
| riskLevel | 通常 `L1` | 通常 `L2`+ |

---

## 2. 创建 Skill（POST）

**`POST /agent/:agentId/app-client/:appClientId/skills`**

将 `toolId` 换成环境中评论列表 Tool 的真实 ID（须已绑定到该 Agent 的 `AgentTool`）。

```json
{
  "name": "评论分析skill",
  "capabilityKey": "review-analyze",
  "description": "评论分析、评论统计、差评分析、差评原因、差评归因、评论构成、情感分析、评论报告、数据洞察。先按用户筛选条件调用评论列表取数，再基于 content 解读构成、评分分布与差评原因。适用：分析、统计、报告、洞察类请求；不适用：回复、回评、remark 提交。",
  "riskLevel": "L1",
  "isActive": true,
  "config": {
    "deliverable": "analysis"
  },
  "prompt": "你是评论数据分析助手。处理评论分析、评论统计、差评分析、差评原因、差评归因、评论构成、情感分析、评论报告、数据洞察类请求时遵循本技能。\n\n## 工作流（先查数，再分析）\n1. **取数**：将 user 的筛选条件（时间、评分、商品/订单标识等）转为评论列表（read-list）参数，调用一次取数；结果跨多页时由引擎自动拉全，勿手动重复分页或重复调用列表。\n2. **分析**：取数完成后再基于 observations 中每条评论的 content，解读评论构成、情感分布、差评原因与可归因问题。\n3. **输出**：给出数据驱动的分析结论与可读报告；不撰写卖家回复、不调用写接口或 remark。\n\n## 工具纪律\n- 本技能仅使用 read-list 取数；无 observations 前勿进入总结；禁止编造 reviewId 或评论正文。\n- 列表为空或接口失败时，说明原因并建议调整查询条件。\n\n## 分析输出\n- 语种与用户请求一致。\n- 区分好评/中评/差评构成；差评须归纳可验证的原因类别（引用 content 证据）。\n- 用户未要求全量明细时，用概括 + 典型样例，勿堆砌原始列表。",
  "tools": [
    { "toolId": 0, "isRequired": true }
  ]
}
```

> `deliverable: analysis` 使 Plan 拆为 gather → analyze。列表跨多页时引擎按 Plan 自动分页并做页内摘要；单页数据则直接用 raw observation 进入 analyze，无需额外配置。

### L1 召回用的 prompt 前 300 字（仅供参考，勿单独存 DB）

运行时由 `buildSkillRecallEmbedText(skill, 'prompt_excerpt')` 自动截取；**请保证下列内容落在 prompt 开头**：

```text
你是评论数据分析助手。处理评论分析、评论统计、差评分析、差评原因、差评归因、评论构成、情感分析、评论报告、数据洞察类请求时遵循本技能。

## 工作流（先查数，再分析）
1. **取数**：将 user 的筛选条件（时间、评分、商品/订单标识等）转为评论列表（read-list）参数，调用一次取数；结果跨多页时由引擎自动拉全，勿手动重复分页或重复调用列表。
2. **分析**：取数完成后再基于 observations 中每条评论的 content，解读评论构成、情感分布、差评原因与可归因问题。
```

---

## 3. PATCH 更新（已有 Skill）

**`PATCH /skill/:skillId`**

```json
{
  "name": "评论分析skill",
  "capabilityKey": "review-analyze",
  "description": "评论分析、评论统计、差评分析、差评原因、差评归因、评论构成、情感分析、评论报告、数据洞察。先按用户筛选条件调用评论列表取数，再基于 content 解读构成、评分分布与差评原因。适用：分析、统计、报告、洞察类请求；不适用：回复、回评、remark 提交。",
  "config": {
    "deliverable": "analysis"
  },
  "prompt": "你是评论数据分析助手。处理评论分析、评论统计、差评分析、差评原因、差评归因、评论构成、情感分析、评论报告、数据洞察类请求时遵循本技能。\n\n## 工作流（先查数，再分析）\n1. **取数**：将 user 的筛选条件（时间、评分、商品/订单标识等）转为评论列表（read-list）参数，调用一次取数；结果跨多页时由引擎自动拉全，勿手动重复分页或重复调用列表。\n2. **分析**：取数完成后再基于 observations 中每条评论的 content，解读评论构成、情感分布、差评原因与可归因问题。\n3. **输出**：给出数据驱动的分析结论与可读报告；不撰写卖家回复、不调用写接口或 remark。\n\n## 工具纪律\n- 本技能仅使用 read-list 取数；无 observations 前勿进入总结；禁止编造 reviewId 或评论正文。\n- 列表为空或接口失败时，说明原因并建议调整查询条件。\n\n## 分析输出\n- 语种与用户请求一致。\n- 区分好评/中评/差评构成；差评须归纳可验证的原因类别（引用 content 证据）。\n- 用户未要求全量明细时，用概括 + 典型样例，勿堆砌原始列表。"
}
```

修改 `name` / `description` / `prompt` 后，skill 向量缓存会在 fingerprint 变化或**服务重启**后刷新。

---

## 4. 评论列表 Tool 描述（`S02S1101`）

决策环与向量召回会读 `description`（及 `agentMetadata.aliases`）。建议：

**`PATCH /tool/:toolId`**

```json
{
  "description": "按查询条件（时间、评分、商品/订单标识、评价状态等）分页获取商品评论列表，返回多条记录及评论 content。用于评论检索、统计与分析取数；单条详情或回复提交请用其他工具。"
}
```

| 项 | 建议 |
|----|------|
| `decisionRole` | `read-list`（`agentMetadata`: `READ` + `LIST`） |
| `aliases`（可选） | `评论列表`、`查评论`、`评论检索`、`差评查询` |
| 与详情工具区分 | 本工具**批量列表**；`read-detail` 仅单条 reviewId |

路径示例：`GET /seller/review/list`。

---

## 5. 联调检查

- [ ] 「**分析** …评论」「差评原因」「评论统计」「数据洞察」→ 命中 `评论分析skill`，`recallStage` 为 `router` 或 `prompt_excerpt`
- [ ] 「**回复** …评论」→ 命中 `评论回复skill`，与分析 skill 分差 ≥ 0.08
- [ ] 命中后 Plan 路径：`read-list`（引擎分页 gather）→ `summarize`（见 [plan-node.md](../plan-node.md)、[paged-list-gather.md](../paged-list-gather.md)）

---

## 6. 相关文档

- [评论回复 skill 模板](./review-reply-skill.example.md)
- [Skill 数据模型](../skill-data-model.md)
- [Plan 节点](../plan-node.md)
- [分页 Gather](../paged-list-gather.md)
