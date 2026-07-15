# B 端对接变更：Workflow 节点可绑多个 Tool / HostTool

> 受众：B 端管理台前端、联调、运营配置。  
> 范围：Workflow 节点 `fetch_data` / `generate_and_push` 的 input 绑定形态。  
> 背景：节点不再只能钉死一个工具；由 **候选白名单 + ReAct（模型选择）** 决定用哪一个。

---

## 1. 变更摘要

| 项 | 旧做法 | 新做法 |
|----|--------|--------|
| `fetch_data` | `input.toolId: number`（单绑） | **`input.toolIds: number[]`**（≥1） |
| `generate_and_push` | `input.hostToolId: number`（单绑） | **`input.hostToolIds: number[]`**（≥1） |
| 运行时 | Page 直调该 ID；Chat 候选面偏整图 | 节点白名单内由模型选一把再执行 / 下发 |
| 遗留字段 | — | `toolId` / `hostToolId` **仍可读**，等价写成单元素数组 |

---

## 2. B 端需要改什么

### 2.1 节点表单：多选绑定

`fetch_data` 配置页：

- 控件从「单选 HTTP Tool」改为 **多选**（至少选 1 个）
- 提交字段：

```json
{
  "id": "fetch_tracking",
  "action": "fetch_data",
  "name": "查物流",
  "objective": "按用户意图选择合适的只读接口并拉取",
  "input": {
    "toolIds": [101, 102, 103],
    "completeWhen": "first_success"
  }
}
```

`generate_and_push` 配置页：

- HostTool 改为 **多选**（至少选 1 个）
- 提交字段：

```json
{
  "id": "push_form",
  "action": "generate_and_push",
  "name": "生成并推送",
  "objective": "选择合适的 HostTool 写回页面",
  "input": {
    "hostToolIds": [11, 12]
  }
}
```

### 2.2 不要再只写单数字段（新配置）

新保存应写 `toolIds` / `hostToolIds`。  
仅读旧数据时服务端会把 `toolId` / `hostToolId` 归一成数组；**新编辑建议迁成数组字段**，避免双写。

### 2.3 Workflow 级绑定表

保存 Workflow 时，服务端仍从 **节点 input 推导** `WorkflowTool` / `WorkflowHostTool` 投影：

- `toolIds` / `hostToolIds` 里出现的每个 id 都会进入绑定
- 显式 `tools[]` / `hostTools[]` 不得引用节点未出现的 id（规则不变）

管理台若展示「本图用到的 Tool」，按节点上所有 id 并集展示即可。

### 2.4 Preset 展开

服务端 Preset（如 `fetch_and_answer`、`page_auto_fill`）展开后的节点已改为：

```json
{ "toolIds": [<readToolId>] }
{ "hostToolIds": [<hostToolId>] }
```

B 端若本地镜像 Preset 模板，请同步改字段名。

---

## 3. 运行时语义（给联调）

| 场景 | 行为 |
|------|------|
| Chat + `fetch_data` | 只把该节点 `toolIds` 放进 bindTools；模型选一把再调 HTTP |
| Chat + `generate_and_push` | 只把该节点 `hostToolIds` 放进 Host Tool 候选；模型选一把 |
| Page + 单候选 | 行为接近旧版：直执 / HostFill |
| Page + 多候选 | 一轮 LLM：从白名单选 tool（并组参）再执行 / `host_action` flush |
| 白名单 id 不在 Workflow 绑定内 | 保存校验失败（`tool_not_bound` / `host_tool_not_bound`） |
| 数组为空且无遗留单字段 | 保存校验失败（`missing_tool_ids` / `missing_host_tool_ids`） |

**图仍定方向**（含 `detect_clues`）；**节点定能用哪些工具**；**模型定用哪一个**。

---

## 4. 校验与错误码（节选）

| code | 含义 |
|------|------|
| `missing_tool_ids` | `fetch_data` 未提供可用 toolIds/toolId/definitionKey |
| `missing_host_tool_ids` | `generate_and_push` 未提供 hostToolIds/hostToolId |
| `tool_not_bound` | 节点 tool id 不在 WorkflowTool 绑定 |
| `host_tool_not_bound` | 节点 hostTool id 不在 WorkflowHostTool 绑定 |
| `FETCH_TOOL_CHOICE_FAILED` | Page 多候选时模型未选合法 tool |
| `HOST_TOOL_CHOICE_FAILED` | Page 多候选 HostTool 选择/组参失败 |

---

## 5. 前端验收清单

- [ ] `fetch_data` 可多选 Tool，提交 `toolIds`（长度 ≥ 1）
- [ ] `generate_and_push` 可多选 HostTool，提交 `hostToolIds`（长度 ≥ 1）
- [ ] 打开旧 Workflow：仅有 `toolId`/`hostToolId` 时编辑器显示为已选一项，保存写出数组
- [ ] 保存校验：空数组、非法 id、未进图绑定均有明确报错
- [ ] Chat / Page 联调：多候选时审计可见模型实际选中的 tool / hostTool 名

---

## 6. 相关文档

- 动作说明：[workflow-action-kinds.md](../workflow-action-kinds.md)
- 状态识别路由：[b-end-workflow-detect-clues-edges.md](./b-end-workflow-detect-clues-edges.md)
- Preset 配置：[b-end-workflow-preset-admin-guide.md](./b-end-workflow-preset-admin-guide.md)
