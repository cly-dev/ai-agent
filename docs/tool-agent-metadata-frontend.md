# Tool.agentMetadata — 前端对接说明

面向管理端 Tool 配置页：字段结构、枚举、API、与 `responseProfile` 的分工。

> 源码类型：`src/core/tool-engine/tool-agent-metadata.types.ts`  
> 校验与落库：`src/modules/tool/tool.service.ts` → `resolveAgentMetadataForPersist`

---

## 1. 字段分工

| 字段 | 用途 | 典型维护方式 |
|------|------|----------------|
| `agentMetadata` | Agent **选工具**、意图过滤、embedding 召回、决策 compact 清单 | Swagger 导入启发式 / 运营手工 |
| `responseProfile` | 工具**执行后**响应裁剪、`fieldLabels`、summarize 展示 | 调试推断 schema / 手工 |

聊天/SSE **不会**向终端用户推送 `agentMetadata`，仅管理端读写。

**decisionRole**：由服务端根据 `agentMetadata` 推导（`mode` + `resource` + `operation`），可冗余写入 `responseProfile.decisionRole`；前端一般**只读展示**推导结果，不必单独编辑。

---

## 2. 数据结构

### 2.1 TypeScript 定义

```typescript
export interface AgentMetadata {
  /** 工具行为大类（必填） */
  mode: 'READ' | 'WRITE' | 'ADMIN';

  /** 业务资源（必填） */
  resource:
    | 'PRODUCT'
    | 'PRICE'
    | 'INVENTORY'
    | 'SEO'
    | 'CATEGORY'
    | 'COLLECTION'
    | 'ORDER'
    | 'CUSTOMER'
    | 'UNKNOWN';

  /** 业务动作（必填） */
  operation:
    | 'DETAIL'
    | 'LIST'
    | 'SEARCH'
    | 'STATS'
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'IMPORT'
    | 'EXPORT'
    | 'PUBLISH'
    | 'UNPUBLISH';

  /** 执行业务动作前应具备的业务参数名（非 OpenAPI 参数名） */
  businessFields: string[];

  /** 同义词，用于向量/关键词召回 */
  aliases: string[];

  /** 典型用户说法（运营参考 + 召回） */
  examples: string[];

  /** 多工具命中时的排序权重，越大越靠前；默认 READ≈100、WRITE≈200 */
  priority: number;

  /** 是否会改系统状态；落库时服务端按 mode === 'WRITE' 规范化 */
  isMutation: boolean;
}
```

### 2.2 枚举常量（表单下拉）

```typescript
export const TOOL_MODE_OPTIONS = ['READ', 'WRITE', 'ADMIN'] as const;

export const RESOURCE_TYPE_OPTIONS = [
  'PRODUCT',
  'PRICE',
  'INVENTORY',
  'SEO',
  'CATEGORY',
  'COLLECTION',
  'ORDER',
  'CUSTOMER',
  'UNKNOWN',
] as const;

export const OPERATION_TYPE_OPTIONS = [
  'DETAIL',
  'LIST',
  'SEARCH',
  'STATS',
  'CREATE',
  'UPDATE',
  'DELETE',
  'IMPORT',
  'EXPORT',
  'PUBLISH',
  'UNPUBLISH',
] as const;
```

### 2.3 字段说明

| 字段 | 说明 |
|------|------|
| `mode` | `READ` 只读查询；`WRITE` 会改数据；`ADMIN` 缓存/测试等运维接口 |
| `resource` | 业务对象，用于区分「改商品 / 改价格 / 改库存」等相似描述 |
| `operation` | 动作粒度，如 `DETAIL` 单条、`LIST` 列表、`UPDATE` 更新 |
| `businessFields` | 业务语义参数，如 `productId`、`skuId`、`price`；**不是** `X-SHOP-ID`、`vo` |
| `aliases` | 中文/英文同义词，参与工具 embedding 文本 |
| `examples` | 示例用户话术，便于运营配置与后续扩展 |
| `priority` | 结构化过滤后、向量 Top-K 前的排序依据 |
| `isMutation` | 与 `mode === 'WRITE'` 一致；决策 prompt 用于区分「必须 tool_calls」 |

### 2.4 服务端校验

创建/更新时若传入 `agentMetadata`：

- 必须能解析出合法的 `mode`、`resource`、`operation`（**大写**枚举值）。
- 失败响应：`400 Bad Request`  
  `agentMetadata invalid: mode, resource, and operation are required`
- `businessFields` / `aliases` / `examples` 应为字符串数组（可为 `[]`）。

---

## 3. decisionRole 推导规则（只读展示）

服务端函数：`deriveDecisionRoleFromAgentMetadata`（`src/core/tool-engine/tool-decision-role.enum.ts`）。

| mode | operation | resource（部分） | 推导 `decisionRole` |
|------|-----------|------------------|---------------------|
| `READ` | `DETAIL` | * | `read-detail` |
| `READ` | `LIST` / `SEARCH` | * | `read-list` |
| `READ` | `STATS` | * | `read-stats` |
| `WRITE` | `CREATE` | * | `write-single` |
| `WRITE` | `UPDATE` | `PRICE` / `INVENTORY` | `write-batch` |
| `WRITE` | `UPDATE` | 其他 | `write-single` |
| `WRITE` | `DELETE` | * | `write-single` |
| `ADMIN` | * | * | `admin` |
| `WRITE` | * | `COLLECTION` 等 | 可能 `write-meta` |

推导优先级（运行时选工具角色）：

1. `agentMetadata` 推导  
2. `responseProfile.decisionRole`（若已手填）  
3. HTTP `method` 启发式  
4. `unknown`

---

## 4. HTTP API

全局前缀：`/admin`（`src/main.ts` → `setGlobalPrefix('admin')`）。

Swagger UI：`http://localhost:3030/docs`（本地默认端口以实际配置为准）。

### 4.1 查询

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/admin/tool` | 分页列表，含 `agentMetadata` |
| `GET` | `/admin/tool/by-app-client/:appClientId` | 按 App 分页 |
| `GET` | `/admin/tool/:id` | 详情 |

响应片段：

```json
{
  "id": 1,
  "name": "S02S001_1",
  "description": "通过id获取商品的详细信息",
  "method": "Get",
  "path": "/api/...",
  "responseProfile": { "coreFields": [], "decisionRole": "read-detail" },
  "agentMetadata": {
    "mode": "READ",
    "resource": "PRODUCT",
    "operation": "DETAIL",
    "businessFields": ["productId"],
    "aliases": ["商品详情", "商品信息"],
    "examples": [],
    "priority": 100,
    "isMutation": false
  }
}
```

`agentMetadata` 可能为 `null`（历史 Tool 或未重新导入）——表单应支持空态与「去配置」引导。

### 4.2 创建

`POST /admin/tool`

请求体需包含原有必填字段（`appClientId`、`name`、`description`、`method`、`path`、`integrationId`、`schema`、`inputSchema` 等），可选：

```json
{
  "agentMetadata": {
    "mode": "WRITE",
    "resource": "PRICE",
    "operation": "UPDATE",
    "businessFields": ["skuId", "price"],
    "aliases": ["价格", "售价", "定价"],
    "examples": ["把价格改成99美元", "调整售价"],
    "priority": 200,
    "isMutation": true
  }
}
```

### 4.3 更新

`PATCH /admin/tool/:id`

- 传入 `agentMetadata`：经校验后**写入整份 JSON**（建议前端提交完整对象）。
- 不传：不修改该字段。

`UpdateToolDto` 为 `PartialType(CreateToolDto)`，字段与创建一致。

### 4.4 Swagger 导入

`POST /admin/tool/import/swagger`

- 新建 Tool：写入启发式 `agentMetadata` + 占位 `responseProfile`（含推导的 `decisionRole`）。
- 更新已有 Tool：仅当库里**没有合法** `agentMetadata` 时合并写入；已有则保留运营配置。

启发式规则（导入时，非前端实现）：

| HTTP | 典型推断 |
|------|----------|
| `GET` + 详情语义 | `READ` + `PRODUCT` + `DETAIL` |
| `GET` + 列表/条件语义 | `READ` + `LIST` |
| `POST` | `WRITE` + `CREATE` |
| `PUT` + 价格/库存 | `WRITE` + `PRICE`/`INVENTORY` + `UPDATE` |

### 4.5 调试推断 schema（含 agentMetadata）

`POST /admin/tool/by-app-client/:appClientId/:id/debug/init-schemas`

请求体：继承 `DebugToolDto`（`parameters`、`headers` 等），可选：

| 字段 | 说明 |
|------|------|
| `persist` | 默认 `true`，写回 `outputSchema`、`responseProfile`、`agentMetadata` |
| `hint` | 补充说明，帮助大模型判断 coreFields 与 resource/operation |

响应新增字段：

```json
{
  "debug": { ... },
  "outputSchema": { ... },
  "responseProfile": { ... },
  "agentMetadata": {
    "mode": "READ",
    "resource": "PRODUCT",
    "operation": "DETAIL",
    "businessFields": ["productId"],
    "aliases": ["商品详情"],
    "examples": ["查看商品详情"],
    "priority": 100,
    "isMutation": false
  },
  "source": "llm",
  "agentMetadataSource": "llm",
  "persisted": true,
  "tool": { ... }
}
```

| 字段 | 说明 |
|------|------|
| `source` | `outputSchema` / `responseProfile` 推断来源：`llm` \| `fallback` |
| `agentMetadataSource` | `agentMetadata` 来源：`llm`（大模型）\| `heuristic`（method/path 启发式）\| `existing`（保留库内已有） |

`responseProfile.decisionRole` 会根据最终 `agentMetadata` 自动推导并落库。

---

## 5. 商品域配置示例

### 5.1 查询商品详情 `S02S001_1`

```json
{
  "mode": "READ",
  "resource": "PRODUCT",
  "operation": "DETAIL",
  "businessFields": ["productId"],
  "aliases": ["商品详情", "商品信息"],
  "examples": ["查看商品详情", "查询商品售价"],
  "priority": 100,
  "isMutation": false
}
```

### 5.2 条件列表 `S02S004`

```json
{
  "mode": "READ",
  "resource": "PRODUCT",
  "operation": "LIST",
  "businessFields": [],
  "aliases": ["商品列表", "多条件查询"],
  "examples": ["查一批商品", "按条件搜索商品"],
  "priority": 100,
  "isMutation": false
}
```

### 5.3 批量改价 `S02S008`

```json
{
  "mode": "WRITE",
  "resource": "PRICE",
  "operation": "UPDATE",
  "businessFields": ["skuId", "price"],
  "aliases": ["价格", "售价", "定价", "批量改价"],
  "examples": ["把价格改成99美元", "批量调整售价"],
  "priority": 200,
  "isMutation": true
}
```

### 5.4 创建商品 `S02S002_1`

```json
{
  "mode": "WRITE",
  "resource": "PRODUCT",
  "operation": "CREATE",
  "businessFields": ["productId"],
  "aliases": ["创建商品", "新增商品"],
  "examples": ["新建一个商品"],
  "priority": 200,
  "isMutation": true
}
```

---

## 6. 前端表单建议

### 6.1 页面结构

1. **基础信息**：`name`、`description`、`method`、`path`、`riskLevel`、`toolCategory`…
2. **Agent 选工具（agentMetadata）**：本文件第二节字段
3. **响应裁剪（responseProfile）**：独立编辑器，见其他文档或 `CreateToolDto` 中 `responseProfile` 示例

### 6.2 交互建议

| 控件 | 字段 |
|------|------|
| 单选/下拉 | `mode`、`resource`、`operation` |
| 标签输入（可增删） | `businessFields`、`aliases`、`examples` |
| 数字输入 | `priority` |
| 只读勾选 | `isMutation`（`mode === 'WRITE'` 时自动 true） |
| 只读文本 | 推导 `decisionRole`（可选，调试用） |

### 6.3 空态与批量

- `agentMetadata === null`：提示「未配置，Agent 将主要依赖 description 与 HTTP 方法，建议重新 Swagger 导入或手工填写」。
- 可提供「从模板填充」：详情 / 列表 / 改价 / 改库存 四套 JSON 模板（见第五节）。

---

## 7. 数据库与迁移

Prisma 字段（`prisma/schema.prisma`）：

```prisma
agentMetadata Json?
```

迁移目录：`prisma/migrations/20260604140000_tool_agent_metadata/migration.sql`

```sql
ALTER TABLE "Tool" ADD COLUMN IF NOT EXISTS "agentMetadata" JSONB;
```

本地应用：

```bash
pnpm prisma migrate deploy
```

**迁移注意**：若存在**没有** `migration.sql` 的空目录（如历史的 `20260602195500_message_content_json`），`prisma migrate deploy` 会报 `P3015`。删除该空目录后重试。

---

## 8. 与运行时 Agent 的关系（前端无需实现）

服务端在 Agent 运行时会：

1. 用 `parseUserToolIntent(userMessage)` 解析用户意图（规则）。
2. 用 `filterToolsByAgentMetadata` 在 bind 工具前过滤。
3. 在决策 prompt 的 compact 清单中输出：`mode`、`resource`、`operation`、`businessFields`、`provides`（来自 `responseProfile.coreFields`）、`role`（推导）。

聊天接口**不需要**客户端传 `agentMetadata`。

---

## 9. 常见问题

**Q：`ToolEntity`（codegen）里没有 `agentMetadata`？**  
A：以 API 实际 JSON 为准；可重新跑 `prisma-schema-codegen` 同步实体类。

**Q：能否只改 `responseProfile.decisionRole`？**  
A：可以，但推荐以 `agentMetadata` 为源；运行时优先 metadata 推导。

**Q：`businessFields` 和 OpenAPI required 参数不一致？**  
A： intentional。前者是业务语义（给用户/Agent 看），后者是 HTTP 调用参数（如 `X-SHOP-ID`）。

**Q：导入后 `operation` 仍是 `DETAIL` 但接口是列表？**  
A：启发式不完美，需在管理端把 `operation` 改为 `LIST`。

---

## 10. 相关源码索引

| 模块 | 路径 |
|------|------|
| 类型定义 | `src/core/tool-engine/tool-agent-metadata.types.ts` |
| 解析 / 推断 / 过滤 | `src/core/tool-engine/tool-agent-metadata.util.ts` |
| decisionRole 推导 | `src/core/tool-engine/tool-decision-role.enum.ts` |
| 决策 compact 清单 | `src/core/agent-engine/tool-decision-role.util.ts` |
| DTO | `src/modules/tool/dto/create-tool.dto.ts` |
| Swagger 导入 | `src/codegen/swagger-tool-import.core.ts` |
