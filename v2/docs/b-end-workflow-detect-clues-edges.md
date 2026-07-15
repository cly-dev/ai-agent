# B 端指南：状态识别节点（`detect_clues`）

> **受众**：B 端管理台前端 / 实施配置  
> **能力**：在图上做 **可配置状态判定**，命中哪些状态就走对应分支；让状态与流向在画布上可读、可审、可改  
> **action 名**：协议层仍为 `detect_clues`（不必改历史资产）；管理台展示建议用 **「状态识别」**  
> **相关**：[节点 action 一览](../workflow-action-kinds.md) · [Preset 配置](./b-end-workflow-preset-admin-guide.md) · [Skill / PageAction 绑定](./b-end-workflow-skill-migration.md)

---

## 1. 产品定调（先记住）

| 本节点负责 | 不负责 |
|------------|--------|
| 识别「当前处于哪些状态」 | 组 HTTP / HostTool 参数 |
| 按命中状态 **多分支** 决定下游 | 替代 `fetch_data` / ReAct 拉数 |
| 让运营在图上看到状态 → 流向 | 日常线性场景（可不配本节点） |

**一个节点可挂多条状态**；每条状态 = Key + 描述 + 一条出边 + 一个下游。  
运行时：**可多选命中**（命中 N 条则串行执行 N 个下游）；**零命中**走 `default`。

### 心智模型

**在节点上「新增状态」= 填 Key + 描述 → 生成一条 `clue` 边 → 再在边终点接下游节点。**

| 运营看到的 | 落库真源 |
|------------|----------|
| 状态列表（key、描述、去向） | `edges[]` 中 `kind: "clue"`（`clue.key` / `clue.description` / `to`） |
| 未命中任一状态 | `kind: "default"` |
| 汇合 | 各分支叶 `kind: "always"` → 同一汇合点 |

状态目录 **不要**写进节点 `input`；`input` 仅可选 `hint`（判定口径，含互斥说明）。

---

## 2. 为什么需要它

全靠一个胖 ReAct「内部自己决定」时，画布上看不出「垃圾邮件 / 物流 / 商品 / 问询」分叉，出问题也不好对照当时判成了什么。

有状态识别节点后，**状态是配置，流向是边**：

```text
[状态识别·邮件意图]
  ├─ spam ──────────► 标记垃圾邮件（该情况说明，可直接结束）
  ├─ logistics ─────► 查物流 ──可选──► 物流说明
  ├─ product ───────► 查商品 ──可选──► 商品说明
  ├─ inquiry ───────► 问询答复稿
  └─ default ───────► 意图不明答复
```

下游仍用 `fetch_data` / `generate_and_push` / `summarize` 自己组参执行；本节点只把门。

---

## 3. 多分支语义（与邮件场景）

### 3.1 默认：多选扇出

- 每个配置状态独立判 `matched`  
- 命中多个 → 对应下游 **按边声明顺序串行**  
- 未命中的分支目标 → `skipped`  
- 全部未命中 → 只走 `default`

适合：一封邮件里 **同时** 提到物流单号和商品问题 → 可先后查物流再查商品。

### 3.2 需要互斥时（垃圾 vs 业务意图）

协议层 **没有** `matchMode: exclusive`；用 **description + hint** 约束模型，例如：

- 状态 `spam`：描述写清「广告/钓鱼/无关垃圾；**一旦 matched，其余业务意图必须为 false**」  
- `input.hint`：「互斥：`spam` 与 `logistics`/`product`/`inquiry` 不可同时 matched；优先判 spam」

正常业务意图下：`spam=false`，再允许多选物流/商品/问询。

### 3.3 例：邮件意图状态表（B 端配置）

| Key | 描述（给 LLM） | 下游（示例） |
|-----|----------------|--------------|
| `spam` | 垃圾/诈骗/完全无关邮件 | Host 标记垃圾 或 summarize「已标垃圾」 |
| `logistics` | 涉及运单、物流进度、签收 | `fetch_data` 物流 tool |
| `product` | 商品参数、价格、库存 | `fetch_data` 商品 tool |
| `inquiry` | 一般问询、政策、人工诉求 | `summarize` 问询口径 |
| （default） | 以上皆非 | 直接汇合 summarize |

---

## 4. 管理台推荐交互

### 4.1 放置

1. 类型选 **`detect_clues`（展示：状态识别）**  
2. **可多个**：例如先判垃圾，分支里再做业务意图识别  
3. 建议先放各分支收尾节点，再配状态边与 `default`  

### 4.2 节点面板

| UI | 字段 | 说明 |
|----|------|------|
| 名称 | `name` | 如「邮件意图识别」 |
| 目标说明 | `objective` | 如「判断是否垃圾邮件及业务意图类别」 |
| 判定补充 | `input.hint` | 互斥规则、边界 case |
| **状态列表** | 出边 | 新增状态 → Key + 描述 → 接线 |

### 4.3 新增一条状态

1. 点 **「新增状态」** → 填 Key、描述  
2. 系统生成 `kind: "clue"` 边  
3. 引导把终点接到下游（标记垃圾 / fetch / summarize…）  
4. 画布边标签建议：`状态 · {key}`  

**一条状态 = 一条边 = 一个下游**（禁止多状态指同一 `to`）。

### 4.4 default 与分支收尾

- 有状态后自动保证一条 `default` → **零命中**去向（UI：「未命中任一状态」）  
- **各状态分支可各自收尾**：不同情况配不同说明 / 动作节点，不必汇合到同一点  
- 需要串线时仍可自选 `always`（例如分支内 fetch → 该分支自己的 summarize）  
- `default.to` 不能与任一状态 `to` 相同

### 4.5 保存

必须提交 `{ nodes, edges, entryNodeId? }`；禁止裸 `nodes[]`。

---

## 5. 字段契约

### 5.1 节点

```json
{
  "id": "intent",
  "action": "detect_clues",
  "name": "邮件意图识别",
  "objective": "识别垃圾邮件与物流/商品/问询等业务意图",
  "input": {
    "hint": "互斥：spam 为 true 时 logistics/product/inquiry 必须为 false；不确定时 spam=false 并走业务或 default"
  }
}
```

### 5.2 边（状态挂在 `clue` 上）

```typescript
type WorkflowEdge = {
  id: string;
  from: string;
  to: string;
  kind?: 'always' | 'clue' | 'default';
  clue?: { key: string; description: string }; // kind=clue 必填
};
```

| kind | 含义 |
|------|------|
| `clue` | 状态边（协议字段名仍为 clue） |
| `default` | 零状态命中 |
| `always` | 线性，或分支叶 → 汇合 |

### 5.3 运行输出（审计 / 图对照）

```json
{
  "clues": [
    { "key": "spam", "matched": false, "confidence": 0.9, "value": null, "reason": "正文为正常售后问物流" },
    { "key": "logistics", "matched": true, "confidence": 0.93, "value": "SF123", "reason": "出现运单号" },
    { "key": "product", "matched": false, "confidence": 0.7, "value": null, "reason": "未问商品" },
    { "key": "inquiry", "matched": false, "confidence": 0.6, "value": null, "reason": "重心在物流" }
  ],
  "matchedClueKeys": ["logistics"]
}
```

| 字段 | 用途 |
|------|------|
| `matched` | **唯一**决定是否走该状态边 |
| `value` | 可选附带信息（审计 / 下游 LLM 可读 prior output）；**不**自动写入工具/Host args |
| `confidence` / `reason` | Run 详情对照「当时判了啥」 |
| `routing` | 仅 `pendingNodeIds`（待跑分支根队列）；命中详情看 `clues` / `matchedClueKeys` |

组参由下游节点自己完成（pageContext / ReAct / HostFill），detect 只做状态识别与路由。

---

## 6. 完整示例（邮件意图）

```json
{
  "nodes": [
    {
      "id": "intent",
      "action": "detect_clues",
      "name": "邮件意图识别",
      "objective": "判断垃圾邮件与业务意图（物流/商品/问询）",
      "input": {
        "hint": "spam 与业务意图互斥；spam=true 时其他业务 key 必须 matched=false"
      }
    },
    {
      "id": "mark_spam",
      "action": "summarize",
      "name": "标记垃圾邮件",
      "objective": "向用户说明已判定为垃圾邮件并建议归档",
      "input": { "mode": "final", "stream": true }
    },
    {
      "id": "fetch_tracking",
      "action": "fetch_data",
      "name": "查物流",
      "objective": "按运单拉取物流",
      "input": { "toolId": 102 }
    },
    {
      "id": "fetch_product",
      "action": "fetch_data",
      "name": "查商品",
      "objective": "按商品相关意图拉详情",
      "input": { "toolId": 103 }
    },
    {
      "id": "reply_inquiry",
      "action": "summarize",
      "name": "问询作答",
      "objective": "对一般问询直接作答",
      "input": { "mode": "final", "stream": true }
    },
    {
      "id": "fallback",
      "action": "summarize",
      "name": "意图不明答复",
      "objective": "未命中任一状态时的兜底说明",
      "input": { "mode": "final", "stream": true }
    }
  ],
  "edges": [
    {
      "id": "e_spam",
      "from": "intent",
      "to": "mark_spam",
      "kind": "clue",
      "clue": {
        "key": "spam",
        "description": "广告、钓鱼、与业务完全无关的垃圾邮件；命中则其他意图不得 matched"
      }
    },
    {
      "id": "e_logistics",
      "from": "intent",
      "to": "fetch_tracking",
      "kind": "clue",
      "clue": {
        "key": "logistics",
        "description": "涉及运单号、物流进度、派送或签收"
      }
    },
    {
      "id": "e_product",
      "from": "intent",
      "to": "fetch_product",
      "kind": "clue",
      "clue": {
        "key": "product",
        "description": "涉及商品规格、价格、库存或选购"
      }
    },
    {
      "id": "e_inquiry",
      "from": "intent",
      "to": "reply_inquiry",
      "kind": "clue",
      "clue": {
        "key": "inquiry",
        "description": "一般政策问询、人工诉求，无需先拉业务实体"
      }
    },
    {
      "id": "e_default",
      "from": "intent",
      "to": "fallback",
      "kind": "default"
    }
  ],
  "entryNodeId": "intent"
}
```

运行举例：

| 邮件内容 | 期望 matched | 实际走法 |
|----------|--------------|----------|
| 明显广告 | `spam` | 只跑 mark_spam（垃圾说明） |
| 只问运单 | `logistics` | 查物流（可再接该分支自己的说明节点） |
| 又问运单又问规格 | `logistics` + `product` | 串行两路 fetch，各自收尾 |
| 含糊寒暄 | 皆 false | default → fallback |

---

## 7. 拓扑硬约束（保存校验）

1. 可有 **多个** `detect_clues`（串行，或落在不同分支上）  
2. 每个 detect 的出边只能是 `clue` / `default`（不能从该节点出 `always`）  
3. 该 detect 有状态边时必须有且仅有一条 `default`  
4. **同一 detect 上** 状态 `key` 不重复；各 `to` 互异  
5. 该 detect 的 `default.to` ≠ 其任一状态 `to`  
6. （可选）分支内可自行串联；**不**要求各状态下游 always 到同一点  
7. 仅 `detect_clues` 可发出 `clue` / `default`  
8. 非 detect 节点至多一条 `always` 出边（`multiple_always_outgoing`）  
9. 节点须从入口可达；边无环  

运行时 `load`：
- 声明了 `edges`（含非数组 `edges`）→ 解析失败/空边/拓扑非法 → `invalid_edges`
- 图中含 `detect_clues` 但未声明 `edges` → `invalid_edges`（禁止线性合成绕过门控）

嵌套时：内层 detect 的扇出排在前面；cascade skip **保护**外层 pending 兄弟及其 always 链（避免钻石多入边误 skip）。

LLM 失败 → 节点 `failed`（不静默当零命中）。

---

## 8. 错误码（节选）

| code | 含义 |
|------|------|
| `WORKFLOW_EDGES_REQUIRED` / `INVALID` | 边未传或无法解析 |
| `invalid_edges_type` | 文档含 `edges` 但不是数组 |
| `duplicate_clue_key` / `duplicate_clue_target` | 状态 key 或去向冲突 |
| `missing_default` | 有状态边无 default |
| `multiple_always_outgoing` | 非 detect 节点多条 always 出边 |
| `DETECT_CLUES_LLM_FAILED` | 判定模型失败 |
| `DETECT_CLUES_NO_ROUTE` | 零命中且无 default |
| `WORKFLOW_ORPHAN_PENDING` | 收尾时仍有未跑节点（路由漏 skip；正常分支图不应出现） |
| `WORKFLOW_LOAD_INVALID_EDGES` | 运行加载：声明边非法、detect 缺边、或拓扑失败 |

---

## 9. 与「AI 自己规划」的关系

| 场景 | 建议 |
|------|------|
| 线性拉数 + 总结，无分叉需求 | **不配**本节点，`fetch_data` → `summarize` 即可 |
| 要在图上表达多种状态与不同流向 | **配**本节点，多状态多分支 |
| 组参 / 调 tool | 始终给下游节点，不在本节点完成 |

---

## 10. 管理台 checklist

- [ ] 展示名：**状态识别**（`action` 仍为 `detect_clues`）  
- [ ] 允许多个状态识别节点（不限制整图只能一个）  
- [ ] 「新增状态」→ Key + 描述 → 生成边 → 接下游  
- [ ] 支持 **多条状态**；文案说明默认可多选扇出  
- [ ] 提供 hint 填写互斥规则（如 spam）  
- [ ] 自动维护 `default`（零命中兜底）；分支可各自收尾  
- [ ] Run 详情展示各状态 `matched` / `reason` 与实际走边  
- [ ] 保存始终带 `{ nodes, edges }`  

### 前端速查

```
状态识别节点
  action = detect_clues
  input.hint?          ← 互斥 / 口径

每条状态 → 一条 edge
  kind = "clue"
  clue.key / clue.description
  to = 下游节点

未命中 → kind = "default" → 零命中兜底节点
每个状态下游 → 可各自结束，或按需再接自己的后续节点
```

---

## 11. 代码位置（后端）

```text
src/core/workflow/
  graph/                         # 图：解析 / 列表 / 推进 / 扇出路由
    workflow-edge.util.ts
    workflow-run-advance.util.ts
    index.ts
  detect-clues/                  # 状态识别节点
    detect-clues.executor.ts
    detect-clues-llm.util.ts
    detect-clues-output.util.ts  # normalize
    index.ts
  executors/                     # 其他 action；registry 引用 detect-clues/
  validate-workflow.util.ts      # 含 detect 拓扑 + ≤1 always；validateWorkflowTopology
  load-workflow-definition.util.ts  # edgesDeclared / detect 必声明边 → fail-closed
  workflow-resume.util.ts        # resume 整图（nodes+edges）回填 run
```

B 端写路径：`modules/workflow` → `graph/workflow-edge.util`（parse/serialize）。
