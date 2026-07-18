# Entity Materialization 架构原则

> **受众**：后端 / 前端 / 产品 / 实施  
> **状态**：架构定稿 + 分阶段落地中  
> **类型真源**：`src/core/entity-materialization/entity-materialization.types.ts`  
> **关联**：Flow Intent [`b-end-flow-capabilities-and-scenarios.md`](./b-end-flow-capabilities-and-scenarios.md) · C 端 PageAction [`c-end-page-action-integration.md`](./c-end-page-action-integration.md)

---

## 0. 一句话

**Entity 承载业务对象，Evidence 承载 AI 理解结果；`entityKey` 只负责单次运行内关联，不承担业务身份。**

```text
Raw Context (pageContext / actionContext / tool output)
        ↓
Entity Materializer
        ↓
Entity { key, type, content, assets }
        ↓
Evidence Pipeline (vision / classify / RAG …)
        ↓
Entity Evidence
        ↓
Judge / Deliver / Mutate
```

---

## 1. 为什么要做

当前痛点（已在自动回复等场景暴露）：

| 问题 | 现状 |
|------|------|
| 图在 `invoke.context` 里 | 识图只扫 `pageContext` / `upstream` → `cells: []` |
| 列表 + 行图 | URL 被 flatMap，无法和行文本对齐 |
| 下游吃杂数据 | 直接读 `pageContext.review.content` 或 `toolResponse.data.list[0]` |
| 识图结果混在原始数据 | 难重跑、难审计 |

目标：**先物化实体，再挂图，再产 Evidence，下游只认统一结构。**

---

## 2. 核心原则

### 2.1 EntityKey 与业务身份解耦

| 字段 | 职责 |
|------|------|
| `entityKey` | **单次 run 内**唯一引用（如 `ent_001`）；关联图、Evidence、决策 |
| `fingerprint` | `hash(source + path [+ stable slice])`；辅助判断「是否同类输入」 |

**禁止**：用业务 `id` / `reviewId` / `itemId` 作为 `entityKey`。  
**禁止**：把 `entityKey` 当跨请求、跨版本、落库主键。

```json
{
  "entityKey": "ent_001",
  "fingerprint": "a3f2c1…",
  "entityType": "review",
  "source": "page_context",
  "path": "metadata.review"
}
```

### 2.2 EntityType

`entityType` 是**类型标签**（如 `review`、`product`），不是实例 id。

来源优先级（配置化，引擎不写死 `if (review)` 词表）：

1. `Tool.responseProfile.entityType`（列表/详情物化）
2. `pageContext.entity.type`
3. `metadata` 顶层 kind（协议级 fallback）

不同 `entityType` 可挂不同 Evidence 策略（如 review 看图质量、product 看外观），策略走配置/Pipeline 扩展，不进 Intent 新 operation。

### 2.3 固化 Entity Schema

所有物化结果统一为 `MaterializedEntity`（见类型文件）：

```ts
Entity {
  entityKey      // run 内 id
  fingerprint
  entityType
  source         // page_context | action_context | upstream
  path           // 结构路径，排障
  content: {
    text?,       // 主正文
    fields?      // 结构化投影
  }
  assets: {
    imageUrls?   // 原始图 URL，非 AI 摘要
  }
  metadata?
}
```

### 2.4 Evidence 层（不修改 Entity 本体）

```text
Entity（原始）  →  Evidence Pipeline  →  追加 EntityEvidence
```

识图后示例：

```json
{
  "entityKey": "ent_001",
  "evidence": [
    {
      "type": "image",
      "source": "vision",
      "summary": "包装有明显破损",
      "urls": ["https://..."],
      "legible": true
    }
  ]
}
```

好处：可重跑识图、多模型对比、审计区分「输入 vs 推理」。

### 2.5 Tool ResponseProfile 增强

在现有 `listPath` + `coreFields` 上增加 **`entityType`**（已写入 `ToolResponseProfile` 类型）：

```json
{
  "decisionRole": "read-list",
  "entityType": "review",
  "listPath": "data.list",
  "coreFields": [
    { "path": "content", "label": "评论内容" },
    { "path": "score", "label": "评分" },
    { "path": "images", "label": "图片" }
  ],
  "listMetaFields": [
    { "path": "total", "label": "总数" }
  ]
}
```

Materializer 据此：**列表每项 → 一个 `entityType=review` 的 Entity**。

### 2.6 图片流程（硬规则）

```text
原始数据
  → Entity Materialization（每项挂 imageUrls）
  → 按实体 Vision（单图直识 / 组内多图拼图）
  → Image Evidence
```

禁止：

- 全局图片池
- 跨实体拼图
- 仅从 prompt 文本扫 URL
- 在 `mutate` 节点上隐式识图

单图规则：**该实体仅 1 张图 → 不拼 IMAGE_PANEL，直识。**

### 2.7 下游统一消费

目标 API 面：

```ts
judge({ entity, evidence })
deliver({ entity, evidence })
mutate({ entity, evidence })
```

**禁止**长期依赖：

- `pageContext.metadata.review.content` 直读
- `toolResponse.data.list[0]` 下标访问

过渡期可保留旧路径，但新 Flow / 新场景必须走 Entity 层。

### 2.8 追加式生命周期

```text
Entity
  → + Image Evidence
  → + Sentiment Evidence
  → + Decision
  → + Action Result
```

不覆盖 Entity 原始字段；Evidence / Decision / Action 追加记录，便于审计与重跑。

---

## 3. 物化规则

### 3.1 pageContext

| 结构 | 物化 |
|------|------|
| `metadata.{kind}` 含 `content` | 每个 kind → 1 Entity |
| 对象数组 | 每项 → 1 Entity |
| 单详情对象 | 1 Entity |

`content.text` ← `content` 字段；`assets.imageUrls` ← 该项 JSON 内 URL 扫描。

### 3.2 actionContext（invoke.context）

与 pageContext **同一套扫描规则**，`source: action_context`。

**必须进入 Materializer**，不能只打进 `<context>` prompt。

### 3.3 upstream（Tool 输出）

当 `read` / `fetch_data` 返回且 Tool 配了 `responseProfile`：

1. `decisionRole: read-list` + `listPath` → 数组每项 1 Entity  
2. `read-detail` → 单 Entity  
3. 字段按 `coreFields` 投影到 `content.fields`  
4. `listMetaFields` → 列表级 meta，不混入每项 Entity  
5. `entityType` 取自 `responseProfile.entityType`

---

## 4. 与现有能力映射

| 现有概念 | 迁移后 |
|----------|--------|
| `pageContext` 隐式注入 | Materializer 输入源之一 |
| `invoke.context` | Materializer 输入源之一（**已实现**，见对接文档） |
| `read` + `images.enabled` | Evidence Pipeline 入口；输入为 **已物化 Entity.assets** |
| `summarize_images` 输出 | 转为 `EntityEvidence type=image` |
| `fetch_data` + `responseProfile` | Materializer 输入；列表拆项 |
| `collectImageEntityGroups` | 并入 Materializer 收图阶段（entityKey 改为 run 内 id） |
| `nodeOutputs` 扁平 obs | 逐步改为 `entities[]` + `evidences[]` |
| Intent 四节点 | **不变**；`read` 仍负责触发取证/识图 |

---

## 5. 职责划分

### C 端 / 前端

- 传原始 `pageContext` / `context` 结构  
- 图挂在**对应实体对象**下  
- **不生成** `entityKey`  
- 不要只把图放在 `context` 而 `pageContext` 无图（在 Materializer 落地前会识图失败）

### B 端 Tool 配置

- 列表接口：`decisionRole: read-list` + `listPath` + `entityType` + `coreFields`  
- 写字段进 `coreFields` 时考虑物化后 `content.fields`  Consumption

### 服务端

- 生成 `entityKey` / `fingerprint`  
- 统一 Materializer + Evidence Pipeline  
- Workflow 下游改为 `EntityExecutionContext`

---

## 6. 自动回复场景（示例）

```text
invoke(pageContext + context 含 review 与 reviewImages)
  → Materializer: 1 个 review Entity (ent_001)
  → Vision: ent_001 单图直识 → Image Evidence
  → mutate: compose 使用 entity.content + evidence
  → await_user_confirm → write
```

Flow 配置：

```text
read(无 Tool, images.enabled, from: all 或覆盖 page+action)
  → mutate(writeToolId)
```

**不要**在 `mutate.slots.readToolIds` 里配 **写工具**（PUT edit）。

---

## 7. 分阶段落地

| 阶段 | 范围 | 验收 |
|------|------|------|
| **P0** | 类型 + 本文档 + `responseProfile.entityType` | 原则对齐 |
| **P1** | Materializer：`pageContext` + `actionContext` | 评论详情/列表行可物化；**steps `type=entity`** |
| **P2** | Materializer：upstream + `listPath` 拆项 | Page `fetch_data` + Chat ReAct fetch |
| **P3** | Evidence：按实体识图 + 单图直识 | `cells/groups` 非空且带 `entityKey`（进行中） |
| **P4** | Workflow 消费 `Entity + Evidence` | compose/judge 不直读 pageContext |
| **P5** | Chat / Plan 路径接入 | 与会话 Plan 物化统一 |

**对接文档（C/B 实施）**：[`entity-materialization-integration.md`](./entity-materialization-integration.md)

### 代码落点（规划）

| 模块 | 路径 |
|------|------|
| 类型 | `src/core/entity-materialization/` |
| 物化 | `entity-materializer.util.ts` |
| 运行记录 | `record-entity-materialization.util.ts` |
| Chat upstream | `patch-upstream-from-fetch-round.util.ts` |
| Evidence | `entity-evidence-pipeline.util.ts`（待建） |
| 识图接入 | `summarize-images.executor.ts` → 消费 Entity |
| Tool 配置 | `tool-response-profile.types.ts` · Admin Tool 表单 |

---

## 8. 禁止项（Review）

1. 用业务 id 当 `entityKey`  
2. 在 agent 引擎里硬编码 `review` / `order` 分支（`entityType` 只作配置路由）  
3. 全局拼图画板跨实体  
4. 识图结果写回 Entity.content  
5. `mutate` 上增加识图开关（应前置 `read` 或 Pipeline）  
6. 下游长期直读 `pageContext` / 原始 tool JSON  

---

## 9. 相关文档

| 文档 | 内容 |
|------|------|
| [`b-end-flow-capabilities-and-scenarios.md`](./b-end-flow-capabilities-and-scenarios.md) | read 识图、mutate 确认链 |
| [`c-end-page-action-integration.md`](./c-end-page-action-integration.md) | pageContext / context 传参 |
| [`b-end-flow-judge-branch-guide.md`](./b-end-flow-judge-branch-guide.md) | judge 消费证据 |
| `src/core/host-bridge/page-context.types.ts` | pageContext 协议 |
| `src/core/tool-engine/tool-response-profile.types.ts` | Tool 物化配置 |
