# Entity Materialization 对接

> 架构：[`entity-materialization-architecture.md`](./entity-materialization-architecture.md)

---

## C 端怎么做

### PageAction invoke

```http
POST /page-action/invoke
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `actionKey` | 是 | PageAction 标识 |
| `pageContext` | 建议 | 页面/实体快照 → 物化 `source: page_context` |
| `context` | 否 | 本次动作附加 JSON → 物化 `source: action_context` |
| `instruction` | 否 | 自定义说明 |
| `idempotencyKey` | 否 | 防重试 |
| `clientActionId` | 否 | 埋点 |

**C 端必做**

1. 正文、评分、实体 id 放 `pageContext`
2. 图片 URL 放 `pageContext` 实体对象内 **或** `context` 内（`http(s)` 绝对地址）
3. 不要传 `entityKey`（服务端生成）
4. 识图由 B 端 Flow `read.images` 控制，C 端只负责把图传进来

### Chat

| 字段 | 说明 |
|------|------|
| `pageContext` | 同 PageAction 协议 → 物化 `page_context` |
| `context` | Chat **无**此字段；upstream 由服务端 fetch 产生 |

---

### pageContext 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | string | 页面标识 |
| `routePath` | string | 路由路径 |
| `routeParams` | object | 路由参数，如 `{ reviewId }` |
| `flowId` | number | 可选 |
| `programName` | string | 可选 |
| `entity.type` | string | 实体类型，如 `review` → 物化 `entityType` |
| `entity.id` | string | 业务 id（**不是** `entityKey`） |
| `entity.*` | any | 其它实体字段 |
| `metadata.{kind}` | object | 内联正文块 |
| `metadata.{kind}.content` | string | 主正文 → 物化 `content.text` |
| `metadata.{kind}.*` | any | 同块其它字段 → 物化 `content.fields`；其中的图片 URL → `imageUrls` |

### invoke.context 字段

任意 JSON；整包 + 子树都会扫描。

| 常见写法 | 说明 |
|----------|------|
| `context.reviewImages` | string[] 图片 URL |
| `context.reviewImageUrls` | string[] 图片 URL |
| `context.images` | string[] 或嵌套对象内的 URL |
| `context.*` | 任意字段下的 `http(s)` URL 都会被收录 |

---

## B 端怎么做

### 1. Tool.responseProfile

| 字段 | 类型 | 说明 |
|------|------|------|
| `entityType` | string | 物化实体类型，如 `review` |
| `decisionRole` | string | `read-list` / `read-detail` |
| `listPath` | string | 列表路径，如 `data.list`；有则每项 1 Entity |
| `coreFields[]` | array | 每项字段投影 |
| `coreFields[].path` | string | 相对列表项的路径 |
| `coreFields[].label` | string | 展示名 |
| `coreFields[].description` | string | 可选 |
| `coreFields[].keywords` | string[] | 可选 |
| `coreFields[].enumLabels` | object | 可选 |
| `listMetaFields[]` | array | 列表容器级字段（不进每项 Entity） |
| `optionalFields[]` | array | 同 coreFields 结构 |
| `arrayLimits` | object | 数组截断 |
| `decisionRole` | enum | 工具决策角色 |

列表 Tool 示例：

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
  "listMetaFields": [{ "path": "total", "label": "总数" }]
}
```

### 2. Flow Intent — read 识图

| 字段 | 类型 | 说明 |
|------|------|------|
| `capabilities.images.enabled` | boolean | 开识图 |
| `capabilities.images.from` | enum | `page_context` \| `upstream` \| `all` |
| `capabilities.images.maxCells` | number | 1–6 |
| `capabilities.images.cellPx` | number | 128–1024 |
| `capabilities.images.onFailure` | enum | `fail` \| `degrade` |
| `capabilities.images.hint` | string | 可选 |
| `readToolIds` | number[] | 读 Tool；无 Tool 时可只做 pageContext/actionContext 识图 |

`from` 取值：

| 值 | 识图 URL 来源 |
|----|----------------|
| `page_context` | `page_context` + `action_context` |
| `upstream` | fetch 后的 `upstream` |
| `all` | 三者 |

### 3. Flow Intent — mutate

| 字段 | 说明 |
|------|------|
| `writeToolId` / 写 Tool | 提交接口 |
| `slots.readToolIds` | 仅绑 **读** Tool；**不要**绑 PUT/写 Tool |

推荐 PageAction 自动回复：`read(images.enabled)` → `mutate(写 Tool)`。

---

## 服务端物化 Entity 字段（运行记录里看到的）

物化真源：`MaterializedEntity`

| 字段 | 类型 | 说明 |
|------|------|------|
| `entityKey` | string | run 内 id，如 `ent_001`（服务端生成） |
| `fingerprint` | string | `hash(source + path)` |
| `entityType` | string | 如 `review` |
| `source` | enum | `page_context` \| `action_context` \| `upstream` |
| `path` | string | 结构路径，如 `metadata.review`、`data.list[0]` |
| `content.text` | string | 主正文 |
| `content.fields` | object | 结构化投影 |
| `assets.imageUrls` | string[] | 原始图片 URL |

### 运行记录 — PageActionRun step

`GET /admin/page-action/run/:id` → `steps[]`

| 字段 | 说明 |
|------|------|
| `step` | 序号 |
| `type` | `entity` |
| `name` | `entity_materialization`（启动） / `entity_materialization_upstream`（fetch 后） |
| `at` | ISO 时间 |
| `status` | `ok` |
| `detail.count` | 实体数量 |
| `detail.entities[]` | 实体列表（见下表） |

`detail.entities[]` 单条：

| 字段 | 说明 |
|------|------|
| `entityKey` | |
| `fingerprint` | |
| `entityType` | |
| `source` | |
| `path` | |
| `content.text` | 截断 400 字 |
| `content.fieldKeys` | fields 键名列表 |
| `content.fields` | 完整 fields |
| `imageUrlCount` | |
| `imageUrls` | |

### 运行记录 — AgentRun step

`GET /agent-run/:id` → `steps[]`

| 字段 | 说明 |
|------|------|
| `type` | `entity` |
| `name` | `entity_materialization` / `entity_materialization_upstream` |
| `output` | 同 PageAction `detail` 结构 |

---

## 禁止

| 谁 | 不要做什么 |
|----|------------|
| C 端 | 传 `entityKey`；相对路径图片；只把图放 prompt 字符串 |
| B 端 | `mutate.readToolIds` 绑写 Tool；在 mutate 上配识图（应前置 read） |
