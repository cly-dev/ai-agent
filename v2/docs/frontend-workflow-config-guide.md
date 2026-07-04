# 前端 Workflow / Skill / PageAction 配置变更指南

> **受众**：B 端管理台、Workflow 编排器、PageAction 配置页的前端开发。  
> **详细对接规格（推荐前端必读）**：[frontend-b-end-workflow-integration-spec.md](./frontend-b-end-workflow-integration-spec.md)  
> **运营 / 实施配置向导**（非前端）：见 [b-end-workflow-preset-admin-guide.md](./b-end-workflow-preset-admin-guide.md)。  
> **服务端版本**：V2 Workflow 主轴（节点直绑 Tool / HostTool ID）。  
> **相关后端文档**：[b-end-workflow-skill-migration.md](./b-end-workflow-skill-migration.md)、[skill-workflow-binding-validation.md](./skill-workflow-binding-validation.md)

---

## 1. 变更摘要（必读）

| 变更 | 旧做法（请废弃） | 新做法（唯一权威） |
|------|------------------|-------------------|
| HTTP Tool 绑定 | 单独维护 `tools[]` 列表，再填节点 | **在节点上选 Tool**，写 `nodes[].input.toolId` |
| Host Tool 绑定 | 单独维护 `hostTools[]` 列表 | **在节点上选 HostTool**，写 `nodes[].input.hostToolId` |
| `fetch_data` | `toolId` 或 `definitionKey` 二选一 | **保存时 `toolId` 必填**（不再接受仅 definitionKey） |
| `tools[]` / `hostTools[]` | 与 nodes 并列的主配置 | **可选**；仅用于给已在 nodes 中出现的 ID 标记 `isRequired` |
| Skill + Workflow | 只绑 workflowId | **workflow-only**：只绑 `workflowId` + `prompt` 即可；SkillTool / SkillHostTool **可选**（叠加层时才须覆盖节点引用） |
| PageAction + HostTool | PageAction 内联 `hostTool` 自动创建 | **先创建/选择已有 HostTool，再绑定 `hostToolId`** |
| PageAction + Workflow | 只绑 workflowId + hostToolId | **`hostToolId` 可省略**；分析类 Workflow 可不含 push 节点；push 执行期优先用节点 HostTool，必要时用 PageAction.hostToolId 兜底 |
| PageAction invoke | workflow 加载失败可能静默走单步 | 绑了 `workflowId` 时加载失败 → **SSE failed**，不再回退单步 |
| Workflow 创建 | 必须手拖 4～6 个原子节点 | **推荐 Preset**：`preset` + `presetConfig`，服务端展开为 `nodes[]` 再保存 |

---

## 2. 场景 Preset（推荐默认入口）

B 端默认用 **场景 Preset** 创建 Workflow，不必手拼原子节点。Preset 只在**保存时展开**为现有 8 种 `action`；DB 与运行时仍只存/只跑展开后的 `nodes[]`。

### 2.1 获取 Preset 目录

**GET** `/admin/workflow/presets/catalog?profile=page_action`

返回字段：`kind`、`label`、`description`、`profiles`、`requiredConfig`、`optionalConfig`、`expandedActions`。

### 2.2 Preset 一览

| `preset` | 适用 profile | 必填 `presetConfig` | 展开后 |
|----------|--------------|---------------------|--------|
| `page_auto_fill` | page / chat / shared | `hostToolId` | load → fetch? → push → summarize |
| `page_context_push` | page / chat / shared | `hostToolId` | load → push → summarize |
| `fetch_push_summarize` | page / chat / shared | `readToolId`, `hostToolId` | fetch → push → summarize |
| `fetch_and_answer` | chat / shared | `readToolId` | fetch → summarize |
| `mutation_submit` | chat / shared | `writeToolId` | fetch? → compose → present → await → write → summarize |
| `page_context_mutation_submit` | chat / shared | `writeToolId` | load → fetch? → compose → present → await → write → summarize → [B 端专文](./preset-page-context-mutation-submit-admin.md) |

### 2.3 创建示例（页内自动回填）

```json
{
  "appClientId": 2,
  "workflowKey": "page.campaign.fill",
  "name": "活动页自动回填",
  "profile": "page_action",
  "preset": "page_auto_fill",
  "presetConfig": {
    "hostToolId": 10,
    "readToolId": 101,
    "objectives": {
      "push": "根据拉取到的活动数据生成表单回填内容",
      "summarize": "简要说明已推送哪些字段"
    }
  }
}
```

### 2.4 创建示例（变更提交）

```json
{
  "appClientId": 2,
  "workflowKey": "skill.campaign.update",
  "name": "更新活动",
  "profile": "chat_skill",
  "deliverable": "mutation",
  "preset": "mutation_submit",
  "presetConfig": {
    "readToolId": 101,
    "writeToolId": 102,
    "objectives": {
      "compose": "根据订单详情组装更新参数",
      "present": "向用户展示即将提交的变更字段"
    }
  }
}
```

### 2.5 规则

- `preset` 与 `nodes` **二选一**；不可同时传。
- `PATCH` 也可传 `preset` + `presetConfig` **重新展开** nodes（会递增 version）。
- 高级用户：创建后 GET 详情拿到展开后的 `nodes[]`，再 PATCH 微调单步 `objective`。
- `presetConfig.objectives` 可选，按场景键覆盖各步默认 objective。

---

## 3. 核心原则：节点 input 是 SSOT

展开后的 Workflow 仍按 **`nodes[]`** 校验与运行。服务端保存时会：

1. 从 `nodes[].input.toolId` / `input.hostToolId` **自动推导** `WorkflowTool` / `WorkflowHostTool` 表；
2. 若额外传了 `tools[]` / `hostTools[]`，其中 ID **必须出现在 nodes 里**，否则 400；
3. 多传的 orphan ID 报错 `orphan_tool_binding` / `orphan_host_tool_binding`。

**UI 建议**：

- **默认**：场景 Preset 向导（选场景 → 绑 Tool/HostTool → 写 objective）。
- **高级**：「展开节点」进入原子画布；绑定列表 Tab 可隐藏。

---

## 4. Workflow 节点表单（编排器 · 高级）

### 4.1 节点通用字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 节点唯一 id，建议 snake_case |
| `action` | enum | 见 §3.2 |
| `name` | string | 展示名 |
| `objective` | string | 本步目标，注入 LLM |
| `input` | object | **按 action 不同，见下表** |

### 4.2 各 action 的 `input` 表单

| action | profile 限制 | input 字段 | 前端控件 |
|--------|--------------|------------|----------|
| `load_page_context` | page / chat / shared | `materialize?: boolean` | 开关，默认 true |
| `fetch_data` | page / chat / shared | **`toolId: number`（必填）** | Tool 下拉，值为 `tool.id` |
| | | `completeWhen?: 'first_success' \| 'fetch_all_pages'` | 下拉，默认 first_success |
| `generate_and_push` | page / chat / shared | **`hostToolId: number`（必填）** | HostTool 下拉，值为 `hostTool.id` |
| | | `stream?: boolean` | 开关，默认 true |
| `summarize` | page / chat / shared | `mode?: 'brief' \| 'detailed' \| 'draft' \| 'final'` | 下拉 |
| `compose_mutation` | chat / shared only | **`toolId: number`（必填）** | Tool 下拉 |
| `present_mutation` | chat / shared only | `mode?: 'brief' \| 'detailed'` | 下拉 |
| `write_data` | chat / shared only | **`toolId: number`（必填）** | Tool 下拉 |
| `await_user_confirm` | chat / shared only | `confirmKind?: 'mutation' \| 'generic'` | 下拉 |

`profile=page_action` 的 Workflow **不得**包含 compose / present / write / await 四类节点（保存时服务端拒绝）。

### 4.3 创建 / 更新 Workflow API

**POST** `/admin/workflow` · **PATCH** `/admin/workflow/:id`

```typescript
type WorkflowNodeDef = {
  id: string;
  action: WorkflowActionKind;
  name: string;
  objective: string;
  input: Record<string, unknown>;
};

type CreateWorkflowBody = {
  appClientId: number;
  workflowKey: string;
  name: string;
  profile: 'chat_skill' | 'page_action' | 'shared';
  deliverable?: 'answer' | 'analysis' | 'mutation';
  goal?: string;
  nodes: WorkflowNodeDef[];
  /** 可选：仅覆盖 isRequired，ID 必须已在 nodes 中出现 */
  tools?: { toolId: number; isRequired?: boolean }[];
  hostTools?: { hostToolId: number; isRequired?: boolean }[];
};
```

**最简请求（推荐）**——只传 nodes，不传 tools/hostTools：

```json
{
  "appClientId": 2,
  "workflowKey": "page.review.autofill",
  "name": "评论自动回填",
  "profile": "page_action",
  "nodes": [
    {
      "id": "load_ctx",
      "action": "load_page_context",
      "name": "加载页上下文",
      "objective": "读取 pageContext",
      "input": { "materialize": true }
    },
    {
      "id": "fetch_review",
      "action": "fetch_data",
      "name": "拉取评论",
      "objective": "补全评论详情",
      "input": { "toolId": 205, "completeWhen": "first_success" }
    },
    {
      "id": "push_draft",
      "action": "generate_and_push",
      "name": "填入草稿",
      "objective": "生成并流式填入回复",
      "input": { "hostToolId": 12, "stream": true }
    },
    {
      "id": "done",
      "action": "summarize",
      "name": "完成说明",
      "objective": "告知用户草稿已就绪",
      "input": { "mode": "brief" }
    }
  ]
}
```

### 4.4 下拉数据源

| 控件 | 推荐 API |
|------|----------|
| Tool 下拉 | `GET /admin/tool/by-app-client/:appClientId`（或 Agent 已绑 Tool 列表） |
| HostTool 下拉 | `GET /admin/host-tool/by-app-client/:appClientId` |

选项展示建议：`name` + `#${id}`，提交时只传 **数字 id**。

---

## 4. Skill 配置页

### 4.1 字段

| 字段 | 说明 |
|------|------|
| `workflowId` | 可选；有则 Chat 走 DB Workflow |
| `workflowVersion` | 可选 pin 版本 |
| `workflowOverrides` | 可选，`{ [nodeId]: { objective?: string } }` |
| `tools` | **SkillTool** 列表（`PUT /admin/skill/:id/tools`）；绑 Workflow 时**可选** |
| — | **SkillHostTool**（`PUT /admin/skill/:id/host-tools`）；绑 Workflow 时**可选** |

### 4.2 两种绑定模式

**A. workflow-only（推荐）**

- 只配置 `workflowId` + `prompt`；
- 保存期仅校验 Workflow 引用有效；
- C 端权限：Workflow 节点 toolId / hostToolId ∩ 用户 Agent 角色权限。

**B. 叠加层（可选收窄）**

- 额外配置 SkillTool / SkillHostTool；
- 保存期须覆盖 Workflow 节点引用的全部 toolId / hostToolId。

### 4.3 校验规则（保存时服务端强制执行）

绑了 `workflowId` 且 **SkillTool / SkillHostTool 非空** 时：

- Workflow 节点里每个 **`input.toolId`** → 必须存在于 **SkillTool**；
- Workflow 节点里每个 **`input.hostToolId`** → 必须存在于 **SkillHostTool**；
- 推导出的 WorkflowTool / WorkflowHostTool 同样必须在 Skill 白名单内。

**workflow-only（tools 与 host-tools 均为空）时不做上述覆盖校验。**

**UI 建议**：

1. 用户选择 Workflow 后，默认走 workflow-only，隐藏或折叠 SkillTool 配置；
2. 开启「收窄 ReAct 范围」时，解析 `nodes` 并 diff SkillTool / SkillHostTool；
3. 保存 tools/host-tools 时展示服务端 `issues[]`（仅叠加层模式）。

### 4.4 错误码

```json
{
  "code": "SKILL_WORKFLOW_BINDING_INCOMPATIBLE",
  "workflowId": 1,
  "issues": [
    {
      "path": "skillHostTools",
      "code": "workflow_host_tool_not_in_skill",
      "message": "WorkflowHostTool hostToolId=4 must be bound on Skill (SkillHostTool)"
    }
  ]
}
```

常见 `issues[].code`：

| code | 含义 | 前端处理 |
|------|------|----------|
| `workflow_tool_not_in_skill` | Workflow 用了 Skill 未绑的 Tool | 引导添加到 SkillTool |
| `workflow_host_tool_not_in_skill` | Workflow 用了 Skill 未绑的 HostTool | 引导添加到 SkillHostTool |
| `node_tool_not_in_skill` | 节点 toolId 不在 SkillTool | 同上 |
| `node_host_tool_not_in_skill` | 节点 hostToolId 不在 SkillHostTool | 同上 |

---

## 5. PageAction 配置页

### 5.1 字段

| 字段 | 说明 |
|------|------|
| `actionKey` | C 端 invoke 用 |
| `hostToolId` | 流式填入目标；**无 `workflowId` 时必填**，且必须是已有 HostTool；有 Workflow 时可省略 |
| `systemPrompt` | 全局角色提示 |
| `pageScope` | 与 `pageContext.page` 对齐 |
| `workflowId` | 可选；有则走多步 Workflow runner |
| `workflowVersion` / `workflowOverrides` | 同 Skill |

### 5.2 校验规则

保存 PageAction 时：

1. 不再接收内联 `hostTool` 对象；只接收已有 HostTool 的 `hostToolId`；
2. 未绑定 `workflowId` 时，`hostToolId` 必填；
3. 绑定 `workflowId` 时，`hostToolId` 可省略，保存期只校验 Workflow 存在且启用；
4. 若填写了 `hostToolId`，服务端校验它属于同一个 AppClient；
5. C 端执行 `generate_and_push` 时，优先使用节点 `input.hostToolId`，缺失时可用 PageAction.hostToolId 兜底。

**UI 建议**：

- PageAction 页不要再内嵌 HostTool 创建表单；需要新建时跳转或弹出 HostTool 创建流程；
- 选 Workflow 后，HostTool 下拉降级为可选，可展示 push 节点 HostTool 作为只读预览；
- 分析类 Workflow 没有 push 节点也可保存，不要在前端强制拦截。

### 5.3 错误码

```json
{
  "code": "PAGE_ACTION_HOST_TOOL_REQUIRED",
  "message": "hostToolId is required when workflowId is not set; create HostTool first, then bind by id"
}
```

| code | 含义 |
|------|------|
| `PAGE_ACTION_HOST_TOOL_REQUIRED` | 未绑定 Workflow 且无 hostToolId |
| `HOST_TOOL_NOT_FOUND` | hostToolId 不存在或不属于当前 AppClient |
| `PAGE_ACTION_PUSH_HOST_TOOL_MISSING` | 执行 push 节点时节点和 PageAction 都没有可用 HostTool |

---

## 6. Workflow 编辑对下游的影响

更新 Workflow 的 `nodes` 或绑定推导结果时，服务端会检查所有引用该 Workflow 的 **active Skill / PageAction**。若破坏对齐，整个 PATCH 失败：

| code | 说明 |
|------|------|
| `WORKFLOW_CHANGE_BREAKS_SKILL_REFERENCES` | 有 SkillTool 叠加层的 Skill 不再覆盖节点 |
| `WORKFLOW_CHANGE_BREAKS_PAGE_ACTION_REFERENCES` | 旧版 PageAction 强对齐错误码；当前保存期不再因 push 节点 HostTool 不一致失败 |

**UI 建议**：Workflow 保存失败时展示 `skillId` / `pageActionId` 与 `issues`，并提供跳转链接。

---

## 7. Workflow 保存：绑定相关错误

| code | 场景 |
|------|------|
| `WORKFLOW_VALIDATION_FAILED` | 节点 action/input 不合法（如 fetch 无 toolId） |
| `WORKFLOW_BINDING_RESOLUTION_FAILED` | `tools[]`/`hostTools[]` 含 nodes 未引用的 ID |

`WORKFLOW_BINDING_RESOLUTION_FAILED.issues[]`：

| code | 含义 |
|------|------|
| `orphan_tool_binding` | tools[].toolId 不在任何节点 input |
| `orphan_host_tool_binding` | hostTools[].hostToolId 不在任何节点 input |

---

## 8. C 端 PageAction invoke

**POST** `/page-action/invoke`（无 `/admin` 前缀）

### 8.1 行为变更

| 条件 | 行为 |
|------|------|
| 未配置 `workflowId` | 单步 LLM + hostTool 流式填入（Legacy） |
| 配置了 `workflowId` 且加载成功 | `runPageWorkflow` 按 nodes 顺序执行 |
| 配置了 `workflowId` 但加载失败 | **SSE `page_action` phase=`failed`**，**不会**回退单步 |

### 8.2 SSE 失败事件

```json
{
  "phase": "failed",
  "actionRunId": 123,
  "actionKey": "review.autofill",
  "generation": 123,
  "errorCode": "WORKFLOW_LOAD_ASSET_MISSING",
  "errorMessage": "关联的工作流不存在或已停用，无法执行 PageAction。"
}
```

| errorCode | 含义 |
|-----------|------|
| `WORKFLOW_LOAD_ASSET_MISSING` | Workflow 不存在或未激活 |
| `WORKFLOW_LOAD_REVISION_MISSING` | pin 的 workflowVersion 无对应 revision |
| `WORKFLOW_LOAD_EMPTY_NODES` | nodes 为空 |
| `WORKFLOW_LOAD_SCOPE_INCOMPATIBLE` | scope 不兼容（Page 场景少见） |

前端应在 `phase=failed` 时展示 `errorMessage`，勿假设仍会收到 `host_action` 流。

---

## 9. 编排器 UI 迁移清单

- [ ] **移除**「Workflow 绑定 Tool 列表」作为主配置入口；改为节点属性面板内 Tool/HostTool 选择器
- [ ] **移除** `fetch_data` 表单的 `definitionKey` 选项（保存不再支持）
- [ ] **保留**（可选）高级区：`isRequired` 勾选，提交时合成 `tools[]` / `hostTools[]`
- [ ] Skill 页：workflow-only 默认只绑 workflowId；叠加层模式 diff SkillTool/SkillHostTool
- [ ] PageAction 页：移除内联 HostTool 创建；无 Workflow 时强制选择已有 hostToolId，绑 Workflow 后 hostToolId 可选
- [ ] Workflow 编辑页：保存失败时解析 `WORKFLOW_CHANGE_BREAKS_*` 并跳转引用方
- [ ] PageAction C 端：处理 `WORKFLOW_LOAD_*` 失败，不再依赖「无 workflow 单步」兜底

---

## 10. TypeScript 类型（可直接复制到前端）

```typescript
export type WorkflowActionKind =
  | 'load_page_context'
  | 'fetch_data'
  | 'generate_and_push'
  | 'summarize'
  | 'compose_mutation'
  | 'present_mutation'
  | 'write_data'
  | 'await_user_confirm';

export type WorkflowProfile = 'chat_skill' | 'page_action' | 'shared';

export type FetchDataNodeInput = {
  toolId: number;
  completeWhen?: 'first_success' | 'fetch_all_pages';
};

export type GenerateAndPushNodeInput = {
  hostToolId: number;
  stream?: boolean;
};

export type WorkflowValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type ApiValidationError = {
  code: string;
  message: string;
  issues?: WorkflowValidationIssue[];
  workflowId?: number;
  skillId?: number;
  pageActionId?: number;
};
```

---

## 11. 常见问题

**Q：还需要在创建 Workflow 时传 `tools` / `hostTools` 吗？**  
不需要。只在需要标记 `isRequired: true` 时传，且 ID 必须已在 nodes 里。

**Q：Skill 和 Workflow 都要配 Tool 吗？**  
不必。**workflow-only**：只绑 `workflowId` 即可，权限由 Workflow 节点 + 用户 Agent 角色决定。若额外配置 SkillTool 作为 ReAct 收窄，则须覆盖 Workflow 节点引用。

**Q：PageAction 的 hostToolId 和 Workflow push 节点必须相同吗？**  
不要求相同。绑 Workflow 时 **`hostToolId` 可省略**；push 执行期优先使用节点 `input.hostToolId`，缺失时可用 PageAction.hostToolId 兜底。若 B 端填写了 `hostToolId`，保存时只校验它属于同一个 AppClient。

**Q：Chat 里 Skill 绑了 Workflow 但用户无节点 tool 权限会怎样？**  
发消息前返回 `SKILL_TOOLS_EMPTY`。`workflow_init` scope 不对时仍可能回退 `plan_compile`。

---

## 12. 相关 API 索引

| 方法 | 路径 | 用途 |
|------|------|------|
| POST/PATCH | `/admin/workflow` | Workflow CRUD |
| GET | `/admin/workflow/:id` | 详情含推导后的 workflowTools / workflowHostTools |
| POST/PATCH | `/admin/.../skills` | Skill + workflowId |
| PUT | `/admin/skill/:id/tools` | SkillTool |
| PUT | `/admin/skill/:id/host-tools` | SkillHostTool |
| POST/PATCH | `/admin/page-action` | PageAction |
| POST | `/page-action/invoke` | C 端执行 |
