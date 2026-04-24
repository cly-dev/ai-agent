# Swagger Tool CLI 使用说明

从 OpenAPI（Swagger）文档选取接口，生成 `Tool` 草稿 JSON，并可选择写入数据库。写入时会按 OpenAPI 的 **tag** 同步 **`ToolCategory`**（业务分类），并把每个 `Tool` 关联到对应分类。

入口文件：`swagger-tool-cli.ts`。

## 前置条件

- 已配置 **`DATABASE_URL`**（按 `NODE_ENV` 加载 `.env.test` / `.env.prod`，未命中时回退 `.env`）。
- `--apply` 时支持两种 Integration 方式：
  - 传 `--integration-id`：使用已存在 Integration；
  - 传 `--auto-integration --app-client-id`：基于 Swagger 自动创建/复用 Integration。
- 确保已执行 Prisma 迁移，表 **`Tool`**、**`ToolCategory`** 等结构就绪。

## 运行方式

### npm scripts（推荐）

```bash
# 仅生成 JSON，不写库（使用已有 Integration）
npm run codegen:swagger-tools:dry-run -- --integration-id 1

# 生成并写入数据库（upsert，使用已有 Integration）
npm run codegen:swagger-tools:apply -- --integration-id 1

# 自动创建/复用 Integration 后再写入 Tool
npm run codegen:swagger-tools:apply -- --auto-integration --app-client-id 1
```

**注意：** 通过 `npm run` 传参时，**必须先写 `--`**，后面的参数才会传给脚本；否则会被 npm 吞掉。

### 直接调用 ts-node

```bash
npx ts-node src/codegen/swagger-tool-cli.ts --dry-run --integration-id 1
npx ts-node src/codegen/swagger-tool-cli.ts --apply --integration-id 1
```

## 模式（必选其一）

| 标志 | 含义 |
|------|------|
| `--dry-run` | 只拉取/解析 spec，写出 JSON，**不连接数据库写 Tool**。 |
| `--apply` | 在 `--dry-run` 同等逻辑基础上，**对数据库执行 upsert**（需 `DATABASE_URL`）。 |

不能两个都不选，也不能同时选两个（由代码校验）。

## 命令行参数

| 参数 | 说明 | 默认值 / 环境变量 |
|------|------|-------------------|
| `--integration-id <n>` | 工具归属的集成 ID（与 `--auto-integration` 二选一） | `GEN_TOOL_INTEGRATION_ID` |
| `--auto-integration` | 自动创建/复用 Integration（按 `appClientId + baseUrl`） | `GEN_TOOL_AUTO_INTEGRATION` |
| `--app-client-id <n>` | 自动 Integration 所属 appClientId（开启自动模式时必填） | `GEN_TOOL_APP_CLIENT_ID` |
| `--integration-name <name>` | 自动 Integration 名称（可选，默认用 `info.title`） | `GEN_TOOL_INTEGRATION_NAME` |
| `--integration-base-url <url>` | 自动 Integration baseUrl（可选，默认 `servers[0].url`） | `GEN_TOOL_INTEGRATION_BASE_URL` |
| `--integration-api-key <key>` | 自动 Integration apiKey（可选，默认空字符串） | `GEN_TOOL_INTEGRATION_API_KEY` |
| `--spec-url <url>` | OpenAPI JSON 的 HTTPS 地址 | `GEN_TOOL_SPEC_URL`，缺省为内置测试 URL |
| `--spec-path <path>` | 本地 OpenAPI JSON 文件路径（相对 cwd） | `GEN_TOOL_SPEC_PATH` |
| `--output <path>` | 生成的草稿 JSON 路径 | `GEN_TOOL_OUTPUT`，默认 `tmp/generated-tools.json` |
| `--risk-level <L1\|L2\|L3>` | 生成 Tool 的风险等级 | `GEN_TOOL_RISK_LEVEL`，默认 `L1` |
| `--tags <csv>` | 只处理这些 **OpenAPI tag**（与 spec 里 `operation.tags` 首项一致） | `GEN_TOOL_TAGS`（逗号分隔） |
| `--ops <csv>` | 只处理指定操作，格式见下文 | `GEN_TOOL_OPS`（逗号分隔） |
| `--insecure` | 下载 `--spec-url` 时 **跳过** TLS 证书校验 | `GEN_TOOL_INSECURE=1` 或 `true` |

## 环境变量（与参数等价）

| 变量 | 作用 |
|------|------|
| `GEN_TOOL_INTEGRATION_ID` | 同 `--integration-id` |
| `GEN_TOOL_AUTO_INTEGRATION` | 同 `--auto-integration` |
| `GEN_TOOL_APP_CLIENT_ID` | 同 `--app-client-id` |
| `GEN_TOOL_INTEGRATION_NAME` | 同 `--integration-name` |
| `GEN_TOOL_INTEGRATION_BASE_URL` | 同 `--integration-base-url` |
| `GEN_TOOL_INTEGRATION_API_KEY` | 同 `--integration-api-key` |
| `GEN_TOOL_SPEC_URL` | 同 `--spec-url` |
| `GEN_TOOL_SPEC_PATH` | 同 `--spec-path` |
| `GEN_TOOL_OUTPUT` | 同 `--output` |
| `GEN_TOOL_RISK_LEVEL` | 同 `--risk-level` |
| `GEN_TOOL_TAGS` | 同 `--tags`，逗号分隔 |
| `GEN_TOOL_OPS` | 同 `--ops`，逗号分隔 |
| `GEN_TOOL_INSECURE` | 非空且为 `1` 或 `true` 时等同 `--insecure` |

## 选择要导入的接口

1. **`--tags tag1,tag2`**  
   只导入「首个 tag」落在这些 tag 下的 operation（与 CLI 列表分组用的 tag 一致）。

2. **`--ops`**  
   精确指定操作，每项格式为 **`METHOD:/path`**（method 大写），path 会自动补前导 `/`，例如：  
   `GET:/api/v1/users`、`POST:/orders`。

3. **交互模式**  
   若未传 `--tags` 且未传 `--ops`，且 **stdin/stdout 为 TTY**，会打印按 tag 分组的编号列表，输入例如：  
   - `1,3,5`  
   - `1-8`  
   - `all` 或 `*`  

   在 **非 TTY**（如 CI）下必须提供 `--tags` 或 `--ops`，否则会报错。

## 数据库行为（`--apply`）

- **匹配已有 Tool：** `integrationId` + `method` + `path` 唯一确定一条；存在则 **update**，不存在则 **create**。
- **字段更新：** 名称、描述、风险等级、schema、input/output schema、是否启用、**以及由本次 spec 推导的 `toolCategoryId`** 会随同步更新。
- **`ToolCategory`：** 对每个 draft 的 **`categoryLabel`**（见下）在表 **`ToolCategory`** 中按 **`label` 精确查找**；没有则 **创建**；若 spec 顶层 **`tags[].description`** 与当前 tag 的 `name` 匹配，会在 **新建** 或 **description 为空** 时写入说明。
- **`RoleTool` 自动权限绑定：**
  - `GET`：绑定给**所有角色**；
  - `POST` / `PUT`（含 OpenAPI `patch` 映射到 `Put`）：仅绑定给 `admin` + `operator`；
  - `DELETE`：仅绑定给 `admin`；
  - 同步时会删除该 Tool 上不在本次策略中的旧角色绑定，避免权限残留。

> 角色名按小写匹配：`admin`（也接受 `super_admin`）与 `operator`。

## 草稿 JSON 中的分类字段

每条 draft 除 Tool 字段外还包含：

- **`categoryLabel`**：来自该 operation 的 **`tags[0]`**；若无 tag 则为 **`misc`**。
- **`categoryDescription`**：若 OpenAPI 文档根级 **`tags`** 里存在同名项且带 **`description`**，则填入，否则为 `null`。

输出文件默认：`tmp/generated-tools.json`。

## OpenAPI 与 HTTP 方法

- 支持路径上的方法：`get`、`post`、`put`、`patch`、`delete`。
- OpenAPI 的 **`patch`** 在库中映射为 **`HttpMethod.Put`**（与现有枚举一致）。

## 示例

```bash
# 本地 spec，dry-run
npm run codegen:swagger-tools:dry-run -- \
  --integration-id 1 \
  --spec-path ./openapi.json

# 指定 URL，写入数据库，仅某几个 tag
npm run codegen:swagger-tools:apply -- \
  --integration-id 1 \
  --spec-url https://example.com/v3/api-docs \
  --tags User,Order

# 自签名证书的开发环境
npm run codegen:swagger-tools:apply -- \
  --integration-id 1 \
  --spec-url https://dev.local/openapi.json \
  --insecure
```

## 故障排查

- **`integration id is required`**：未传 `--integration-id` 且未开启 `--auto-integration`。
- **`app-client-id is required when using --auto-integration`**：自动模式缺少 app 归属。
- **`choose one mode: --dry-run or --apply`**：必须二选一。
- **`DATABASE_URL is required when using --apply`**：`--apply` 时未配置数据库连接。
- **外键错误**：确认 `Integration` 中已有对应 `id`。
- **`tag not found in spec` / `operation not found`**：检查 `--tags` 是否与 spec 里首 tag 完全一致，`--ops` 的 path 是否与规范里一致（含前缀 `/` 的规范化规则）。
- **`ECONNRESET` / `read ECONNRESET`**：服务端或中间网络把连接掐断。CLI 已带 **重试、浏览器 User-Agent、跟随重定向**；仍失败时可依次尝试：**`--insecure`**（自签名/抓包环境）、换网络/VPN、用浏览器或 `curl` 下载 spec 后走 **`--spec-path`**。
