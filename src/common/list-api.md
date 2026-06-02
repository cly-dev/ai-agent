# 列表查询 API 规范

所有 **GET 列表**（`findAll` / `findPage`）及 **详情/写入响应** 接口必须遵循本规范。

## 请求

### 公共分页参数（Query）

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `page` | int | `1` | 页码，从 1 开始 |
| `pageSize` | int | `20` | 每页条数，最大 `100` |

使用 `PaginationQueryDto`（`src/common/pagination/pagination-query.dto.ts`）。

### 筛选参数

- 各资源在 `Query*Dto` 中定义**可筛选字段**（精确匹配、模糊匹配、枚举、布尔等）
- 可选通用字段 `keyword`：对常用文本列做 `OR` 模糊搜索
- 布尔 Query 支持 `true` / `false` 字符串

### 排序参数（可选）

| 参数 | 说明 |
|------|------|
| `orderBy` | 白名单字段，如 `id`、`createdAt` |
| `order` | `asc` / `desc`，默认 `desc` |

## 响应

### 分页结构

`service.findPage()` 返回 `PaginatedResult<T>`，经全局拦截器包装后：

```json
{
  "status": 200,
  "message": "success",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "pageSize": 20,
    "totalPages": 0
  }
}
```

使用 `resolvePagination()` + `toPaginatedResult()`（`src/common/pagination/pagination.util.ts`）。

### 关联数据（必遵）

**列表项、详情、创建/更新/删除的返回体** 必须带上 Prisma 模型上所有**直接关联表**的数据，不能只返回外键 id。

| 规则 | 说明 |
|------|------|
| 统一 include | 在 `*.types.ts` 或 `*.include.ts` 定义 `*_DETAIL_INCLUDE`，列表与详情共用 |
| 嵌套实体 | 多对多/中间表（如 `agentTools`）需 `include` 嵌套关联实体摘要字段 |
| 避免循环 | 关联实体不要再展开其反向集合（如 `appClient.tools`） |
| 展示标签 | 若有「类目/标签」语义，除完整 `toolCategory` 对象外，可附加 `tags: string[]`（如 `[toolCategory.label]`） |

**Tool 示例**（每条 `items[]` / 详情）：

```json
{
  "id": 1,
  "name": "getOrderList",
  "appClientId": 1,
  "appClient": { "id": 1, "name": "crm", "dsn": "...", "isActive": true },
  "toolCategoryId": 3,
  "toolCategory": { "id": 3, "label": "订单", "description": "...", "sortOrder": 0 },
  "tags": ["订单"],
  "integrationId": 2,
  "integration": { "id": 2, "name": "order-api", "baseUrl": "...", "authMode": "USER_PREFERRED" },
  "agentTools": [{ "id": 1, "agentId": 5, "toolId": 1, "agent": { "id": 5, "name": "Sales Bot" } }],
  "skillTools": [],
  "roleTools": [{ "id": 1, "roleId": 2, "toolId": 1, "role": { "id": 2, "name": "admin" } }]
}
```

实现步骤：

1. 定义 `RESOURCE_DETAIL_INCLUDE`（Prisma `satisfies XxxInclude`）
2. `findPage` / `findOne` / `create` / `update` / `remove` 均 `include: RESOURCE_DETAIL_INCLUDE`
3. 可选 `toXxxResponse()` mapper 补充 `tags` 等 UI 字段

## 实现 checklist

1. `Query*Dto extends PaginationQueryDto`
2. `*Service.findPage(dto)`：`Promise<PaginatedResult<Entity>>`
3. Controller `@Get()` 使用 `@Query() dto: Query*Dto`
4. 禁止无分页的 `findMany()` 返回全表（管理端大数据量资源）
5. Swagger：`@ApiOperation` 注明支持的分筛字段与返回的关联对象
6. **列表/详情/CUD 响应均带完整关联数据**

## 参考实现

- `src/modules/tool/tool.controller.ts`
- `src/modules/tool/tool.service.ts`
- `src/modules/tool/tool.types.ts`（`TOOL_DETAIL_INCLUDE`）
- `src/modules/tool/tool.mapper.ts`（`tags`）
- `src/modules/tool/dto/query-tool.dto.ts`
