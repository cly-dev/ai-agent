# B 端对接变更：PageAction 只绑定已有 HostTool

> 受众：B 端管理台前端、B 端后端联调、运营配置同学。  
> 范围：`/admin/page-action` 创建/更新，以及 PageAction 配置页里的 HostTool 选择逻辑。

---

## 1. 变更摘要

PageAction 创建时不再支持内联创建 HostTool。B 端必须先保证 HostTool 已存在，再通过 `hostToolId` 绑定。

| 项 | 旧做法 | 新做法 |
|----|--------|--------|
| PageAction 创建 HostTool | `POST /admin/page-action` 里传 `hostTool: { ... }`，服务端自动创建 | **不支持**；先创建或选择已有 HostTool，再传 `hostToolId` |
| 无 Workflow 的 PageAction | 可传内联 `hostTool` 或 `hostToolId` | **必须传 `hostToolId`** |
| 绑定 Workflow 的 PageAction | 常要求同时维护 `hostToolId` | `hostToolId` 可省略；分析类 Workflow 不需要 HostTool |
| 更新 PageAction | 可把 `workflowId` 清空但不补 HostTool | 清空 `workflowId` 后最终状态必须有 `hostToolId` |

---

## 2. B 端需要改什么

### 2.1 移除 PageAction 内联 HostTool 表单

PageAction 创建/编辑接口不再接收以下字段：

```json
{
  "hostTool": {
    "definitionKey": "review.fill",
    "name": "fillReview",
    "description": "回填评审内容",
    "argsSchema": {}
  }
}
```

若继续发送 `hostTool`，会被 DTO 白名单校验拒绝。

### 2.2 改成选择已有 HostTool

PageAction 配置页应提供 HostTool 下拉：

```http
GET /admin/host-tool/by-app-client/:appClientId
```

常用筛选：

| 查询参数 | 说明 |
|----------|------|
| `keyword` | 按名称 / key 搜索 |
| `scope` | 按页面 scope 过滤 |
| `genericOnly` | 只看 App 级通用工具 |
| `isActive` | 只看启用工具 |

若列表里没有目标 HostTool，先走 HostTool 管理页或弹窗创建：

```http
POST /admin/host-tool
```

```json
{
  "appClientId": 2,
  "hostPageId": 10,
  "definitionKey": "review.fill",
  "name": "fillReview",
  "description": "把 AI 生成内容回填到评审表单",
  "argsSchema": {
    "type": "object",
    "properties": {
      "content": { "type": "string" }
    },
    "required": ["content"]
  },
  "isActive": true
}
```

创建成功后取返回的 `id`，再写入 PageAction 的 `hostToolId`。

---

## 3. PageAction 保存规则

### 3.1 创建

无 Workflow，走 legacy 单步填表：

```http
POST /admin/page-action
```

```json
{
  "appClientId": 2,
  "actionKey": "review.fill",
  "name": "评审表单回填",
  "hostToolId": 12,
  "pageScope": "review-detail",
  "systemPrompt": "你是评审页填表助手，请根据上下文生成可直接回填的内容。"
}
```

绑定 Workflow，尤其是分析类 Workflow：

```json
{
  "appClientId": 2,
  "actionKey": "review.analyze",
  "name": "评审内容分析",
  "pageScope": "review-detail",
  "systemPrompt": "你是评审分析助手，请根据页面上下文给出风险点和改进建议。",
  "workflowId": 5
}
```

规则：

- `workflowId` 为空时，`hostToolId` 必填。
- `workflowId` 有值时，`hostToolId` 可省略。
- 如果传了 `hostToolId`，它必须属于同一个 `appClientId`。
- `defaultDelivery` 固定为 `inline_stream`，B 端无需提供其他值。

### 3.2 更新

```http
PATCH /admin/page-action/:id
```

常见场景：

| 操作 | 请求体 | 结果 |
|------|--------|------|
| 只改文案 | `{ "systemPrompt": "..." }` | 不影响 HostTool / Workflow |
| 从 legacy 切到 Workflow | `{ "workflowId": 5 }` | 可保留原 `hostToolId`，也可不展示为必填 |
| 从 Workflow 切回 legacy | `{ "workflowId": null, "hostToolId": 12 }` | 必须保证最终有 `hostToolId` |
| 绑定新的 HostTool | `{ "hostToolId": 13 }` | 校验 HostTool 属于当前 AppClient |

当前接口不支持通过 `hostToolId: null` 显式清空 HostTool。

---

## 4. 错误码与前端提示

| code / 现象 | 触发条件 | B 端建议提示 |
|-------------|----------|--------------|
| `PAGE_ACTION_HOST_TOOL_REQUIRED` | 未绑定 Workflow，且最终没有 `hostToolId` | 请先选择或创建 HostTool |
| `HOST_TOOL_NOT_FOUND` | `hostToolId` 不存在，或不属于当前 AppClient | HostTool 不存在或已被删除，请重新选择 |
| DTO 白名单错误 | 请求体仍包含 `hostTool` | 当前版本不支持在 PageAction 内联创建 HostTool |
| `PAGE_ACTION_PUSH_HOST_TOOL_MISSING` | Workflow 执行到推送节点时，节点和 PageAction 都没有可用 HostTool | 检查 Workflow 的 `generate_and_push.input.hostToolId` 或给 PageAction 补 `hostToolId` |

注意：项目的 JSON 响应可能是统一包络，B 端应读取业务响应里的 `data.code` / `data.message`，不要只看 HTTP status。

---

## 5. 推荐 UI 流程

### 5.1 PageAction 新建页

1. 选择 AppClient。
2. 选择是否绑定 Workflow。
3. 若不绑定 Workflow：HostTool 下拉必填。
4. 若绑定 Workflow：HostTool 下拉改为可选；分析类 Workflow 可完全不选。
5. 提交时只发送 `hostToolId`，不要发送 `hostTool` 对象。

### 5.2 HostTool 不存在时

推荐提供“新建 HostTool”入口，但新建动作应调用 `/admin/host-tool`。创建完成后回填 `hostToolId` 到 PageAction 表单。

### 5.3 列表和详情页

PageAction 详情若 `hostToolId` 为空但 `workflowId` 有值，这是合法状态。不要把它标为配置错误。

---

## 6. 联调检查清单

- [ ] PageAction 创建/更新请求体里不再出现 `hostTool`。
- [ ] 无 `workflowId` 时，前端强制要求选择 `hostToolId`。
- [ ] 有 `workflowId` 时，`hostToolId` 不再强制必填。
- [ ] 清空 `workflowId` 时，如果当前记录没有 HostTool，要求用户选择一个。
- [ ] HostTool 下拉数据来自 `/admin/host-tool/by-app-client/:appClientId`。
- [ ] 新建 HostTool 走 `/admin/host-tool`，成功后再绑定 `hostToolId`。
- [ ] 错误提示识别 `PAGE_ACTION_HOST_TOOL_REQUIRED` 和 `HOST_TOOL_NOT_FOUND`。
