# B 端配置指南（V2 · 单文档版）

> **受众**：B 端管理台前端、运营配置、后端联调。  
> **定位**：Workflow / Skill / PageAction 配置的**唯一入口文档**（2026-06 起）。  
> **原则**：Workflow 节点 `input` 是工具绑定的 SSOT；绑了 `workflowId` 后不必再重复维护 SkillTool / PageAction.hostToolId。

---

## 1. 变更摘要

| 主题 | 旧做法（废弃） | 新做法 |
|------|----------------|--------|
| Workflow 工具绑定 | 单独维护 `tools[]` / `hostTools[]` 再填节点 | **只在节点** `input.toolId` / `input.hostToolId` 上选工具 |
| Workflow 创建 | 手拖 4～6 个原子节点 | **Preset** `preset` + `presetConfig`，服务端展开为 `nodes[]` |
| `fetch_data` | `toolId` 或 `definitionKey` 二选一 | 保存时 **`toolId` 必填** |
| Skill + Workflow | 绑 workflowId **且** SkillTool 必须覆盖全部节点 | **workflow-only**：只绑 `workflowId` + `prompt` 即可 |
| SkillTool | 绑 Workflow 后强制配置 | **可选**；仅「叠加层」收窄 ReAct 时才须覆盖节点引用 |
| PageAction + Workflow | 必须填 `hostToolId` 且与 push 节点一致 | **只绑 `workflowId`**；任意 Workflow；`hostToolId` 可省略 |
| PageAction invoke | Workflow 加载失败可能回退单步 | 绑了 `workflowId` 且加载失败 → **SSE `failed`**，不回退 |

---

## 2. 三层关系

**统一原则**：Workflow 节点定义是 SSOT；Chat（用户发消息）与 PageAction（`actionKey` invoke）共用同一套步序与节点语义，仅**入口与交付**不同（SSE 对话流 vs 页内 inline_stream / 审批挂起）。

```
Workflow（步序 + 节点工具 SSOT）
    ↑ workflowId
Skill（Chat）          PageAction（页内一键）
prompt + 可选叠加层     systemPrompt + 可选 hostToolId
```

| 层 | 职责 | 必填 |
|----|------|------|
| **Workflow** | 固定步序；节点引用哪些 HTTP Tool / Host Tool | `nodes[]` 或 Preset 展开结果 |
| **Skill** | Chat 入口；角色 prompt；可选收窄工具白名单 | `prompt`；绑 Workflow 时加 `workflowId` |
| **PageAction** | 页内 invoke；流式填入 | `actionKey` + `systemPrompt`；无 Workflow 时需 `hostToolId` |

**权限（C 端）**：workflow-only 模式下，用户能否运行 = Workflow 节点引用的 toolId / hostToolId ∩ 该用户在此 Agent 下的角色权限。不再依赖空的 SkillTool 阻断保存。

---

## 3. Workflow 配置

### 3.1 Profile（可选标签，无绑定限制）

`profile` 字段（`page_action` | `chat_skill` | `shared`）仅作 B 端分类/筛选，**不限制** Skill 或 PageAction 引用，也不限制 nodes 里可用哪些 action。任意 Workflow 可被任意入口使用。

### 3.2 推荐：Preset 创建

**GET** `/admin/workflow/presets/catalog`（`profile` 查询参数可选，**不再过滤** preset 列表）

| preset | 必填 presetConfig | 典型用途 |
|--------|-------------------|----------|
| `page_auto_fill` | `hostToolId` | 读页 → 可选拉数 → 推送 → 总结 |
| `page_context_push` | `hostToolId` | 读页 → 推送 → 总结 |
| `fetch_push_summarize` | `readToolId`, `hostToolId` | 拉数 → 推送 → 总结 |
| `fetch_and_answer` | `readToolId` | 拉数 → 总结 |
| `mutation_submit` | `writeToolId` | 读 → 组参 → 展示 → 确认 → 写 → 总结 |
| `page_context_mutation_submit` | `writeToolId` | 读页 → … → 写确认链 |

**POST** `/admin/workflow` 示例：

```json
{
  "appClientId": 2,
  "workflowKey": "page.campaign.fill",
  "name": "活动页自动回填",
  "profile": "page_action",
  "preset": "page_auto_fill",
  "presetConfig": {
    "hostToolId": 12,
    "readToolId": 101,
    "objectives": {
      "push": "根据活动数据生成表单回填内容"
    }
  }
}
```

规则：

- `preset` 与 `nodes` **二选一**，不可同时传。
- 保存后 DB 只存展开后的 `nodes[]`；`tools[]` / `hostTools[]` **可选**，仅给已出现在 nodes 里的 id 标 `isRequired: true`。
- **PATCH** 可传 `preset` + `presetConfig` 重建 nodes（version 递增）。

### 3.3 节点 input（SSOT）

| action | 必填 input | 说明 |
|--------|------------|------|
| `fetch_data` | `toolId` | HTTP Tool 数字 id |
| `compose_mutation` / `write_data` | `toolId` | 写链 HTTP Tool |
| `generate_and_push` | `hostToolId` | Host Tool 数字 id |
| `load_page_context` | — | 读 `pageContext` |

---

## 4. Skill 配置（Chat）

### 4.1 两种模式

| 模式 | 配置 | 保存校验 | C 端 |
|------|------|----------|------|
| **workflow-only**（推荐） | `workflowId` + `prompt`，**不绑** SkillTool / SkillHostTool | 只校验 Workflow 引用有效 | 发消息前校验：节点工具 ∩ 用户 Agent 权限 |
| **叠加层** | 上述 + `SkillTool` / `SkillHostTool` | 叠加层须 **覆盖** Workflow 全部节点引用 | 同上；ReAct scopedTools 可取叠加层 |

### 4.2 字段

| 字段 | API | 说明 |
|------|-----|------|
| `workflowId` | POST/PATCH skills | 有则 Chat 走 DB Workflow |
| `workflowVersion` | 同上 | 可选 pin 历史版本 |
| `workflowOverrides` | 同上 | `{ "nodeId": { "objective": "..." } }` |
| `prompt` | 同上 | Plan / 引导语 |
| SkillTool | PUT `/admin/skill/:id/tools` | **可选**；`{ tools: [{ toolId, isRequired? }] }` |
| SkillHostTool | PUT `/admin/skill/:id/host-tools` | **可选** |

### 4.3 workflow-only 保存顺序

1. POST `/admin/workflow` 创建 Workflow  
2. POST 或 PATCH Skill，设 `workflowId` + `prompt`  
3. 完成（无需 PUT tools）

### 4.4 叠加层保存顺序

1. 创建 Workflow  
2. PUT tools / host-tools 补齐节点引用  
3. PATCH 设 `workflowId`  

失败时 `SKILL_WORKFLOW_BINDING_INCOMPATIBLE` + `issues[]`（仅叠加层会出现）。

---

## 5. PageAction 配置

### 5.1 两种路径

| 路径 | hostToolId | Workflow |
|------|------------|----------|
| **Legacy 单步** | **必填**（或内联 `hostTool` 自动创建） | 不绑 |
| **Workflow 多步** | **可省略** | 必填；保存期不校验节点结构 |

### 5.2 字段

| 字段 | 说明 |
|------|------|
| `actionKey` | C 端 invoke 键，App 内唯一 |
| `systemPrompt` | 页内角色提示 |
| `pageScope` | 与 `pageContext.page` 对齐；空=不限页 |
| `workflowId` | 有则 `runPageWorkflow` |
| `hostToolId` | 无 Workflow 时必填；有 Workflow 时可空 |

### 5.3 绑 Workflow 时

- 仅校验 Workflow 存在且 `workflowVersion`（若 pin）有效；
- `hostToolId` 可省略；`generate_and_push` 执行期从节点 `input.hostToolId` 解析。

### 5.4 创建示例（workflow-only）

```json
POST /admin/page-action
{
  "appClientId": 2,
  "actionKey": "demo.fill_draft",
  "name": "草稿回填",
  "systemPrompt": "你是页面填表助手…",
  "pageScope": "demo-playground",
  "workflowId": 5
}
```

---

## 6. 错误码速查

### Skill（叠加层）

| code | 含义 |
|------|------|
| `SKILL_WORKFLOW_BINDING_INCOMPATIBLE` | SkillTool/SkillHostTool 未覆盖 Workflow 节点 |
| `WORKFLOW_CHANGE_BREAKS_SKILL_REFERENCES` | 改 Workflow 后破坏了有叠加层的 Skill |

### PageAction

| code | 含义 |
|------|------|
| `PAGE_ACTION_HOST_TOOL_MISSING` | 无 Workflow 且无 hostToolId（Legacy 单步 invoke） |
| `PAGE_ACTION_PUSH_HOST_TOOL_MISSING` | 执行 `generate_and_push` 时节点与 PageAction 均无 hostToolId |

### PageAction C 端 invoke（SSE failed）

| errorCode | 含义 |
|-----------|------|
| `WORKFLOW_LOAD_ASSET_MISSING` | Workflow 不存在或停用 |
| `WORKFLOW_LOAD_REVISION_MISSING` | pin 的 version 无 revision |
| `WORKFLOW_LOAD_EMPTY_NODES` | nodes 为空 |
| `WORKFLOW_TRIGGER_PERMISSION_DENIED` | 用户无节点写工具权限 |

### Chat requestedSkill

| code | 含义 |
|------|------|
| `SKILL_TOOLS_EMPTY` | workflow-only Skill：用户无 Workflow 所需 tool/host 权限 |

---

## 7. C 端运行时（联调必知）

### Skill + workflowId

```
发消息(skillId) → 校验节点权限 → workflow_init(Agent级 allowedToolIds)
  → workflow_db 成功 | scope_incompatible 回退 plan_compile | 资产缺失硬失败
```

- 列表：有 `workflowId` 的 Skill 会出现在技能列表（不按空 SkillTool 过滤）。  
- 发消息：无节点权限 → `SKILL_TOOLS_EMPTY`。

### PageAction + workflowId

```
invoke(actionKey) → 加载 Workflow → runPageWorkflow（与 Chat 相同 nodes[]）
  → mutation 链：compose → present → await → write → summarize（均已支持）
加载失败 → SSE phase=failed（不回退单步 LLM）
```

---

## 8. 三条典型配置路径

### A. 页内自动回填（workflow-only PageAction）

1. POST Workflow：`preset=page_auto_fill`，`presetConfig.hostToolId=12`，`readToolId=101`  
2. POST PageAction：`workflowId` + `systemPrompt` + `pageScope`（**不传 hostToolId**）  
3. C 端：`POST /page-action/invoke` + 匹配 `pageContext.page`

### B. Chat 固定查询（workflow-only Skill）

1. POST Workflow：`preset=fetch_and_answer`，`readToolId=101`，`profile=chat_skill`  
2. POST Skill：`workflowId` + `prompt`（**不传 tools**）  
3. Agent 角色须具备 toolId=101；C 端带 `skillId` 发消息

### C. Chat 写确认（workflow-only + 角色写权限）

1. POST Workflow：`preset=mutation_submit`，`writeToolId=102`  
2. POST Skill：`workflowId` + `prompt`  
3. 角色勾选 writeToolId 对应 RoleTool；C 端走确认链 SSE

### D. 页内写确认（workflow-only PageAction）

1. POST Workflow：`preset=page_context_mutation_submit` 或 `mutation_submit`，`writeToolId=102`  
2. POST PageAction：`workflowId` + `systemPrompt` + `pageScope`  
3. C 端 `invoke` → `present_mutation` 草稿说明 → `awaiting_approval` → 审批后续跑 write + summarize

---

## 9. API 索引（Admin 前缀 `/admin`）

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/workflow/presets/catalog` | Preset 目录 |
| POST/PATCH | `/workflow` | Workflow CRUD |
| GET | `/workflow/:id` | 详情（含 nodes、workflowTools 推导） |
| POST/PATCH | `/app-client/:id/skills` 等 | Skill CRUD |
| PUT | `/skill/:id/tools` | SkillTool（可选） |
| PUT | `/skill/:id/host-tools` | SkillHostTool（可选） |
| POST/PATCH | `/page-action` | PageAction CRUD |
| POST | `/page-action/invoke` | **C 端**执行（SSE） |

---

## 10. 上线检查清单

**Workflow**

- [ ] Preset 必填项已填；展开后 `nodes.length > 0`  
- [ ] `generate_and_push` 的 `hostToolId` 指向有效 HostTool（若有该节点）

**Skill（workflow-only）**

- [ ] 已绑 `workflowId` + `prompt`  
- [ ] 目标用户角色具备 Workflow 节点引用的 HTTP / Host 权限  

**Skill（叠加层）**

- [ ] SkillTool / SkillHostTool 覆盖全部节点 toolId / hostToolId  

**PageAction**

- [ ] 无 Workflow：`hostToolId` 或内联 `hostTool` 已配置  
- [ ] 有 Workflow：含 push 节点；若填 hostToolId 与 push 一致  
- [ ] `pageScope` 与 C 端 `pageContext.page` 一致  

---

## 11. FAQ

**Q：绑了 Workflow 还要配 SkillTool 吗？**  
不必。workflow-only 只绑 `workflowId` 即可。只有要收窄 ReAct 工具范围时才配 SkillTool，且须覆盖节点引用。

**Q：PageAction 还要 hostToolId 吗？**  
绑 Workflow 时可省略，运行时从 `generate_and_push` 推导。不绑 Workflow 时仍必填（或自动创建）。

**Q：`tools[]` 还要在创建 Workflow 时传吗？**  
不必。工具绑在节点 `input` 上；`tools[]` 仅可选标 `isRequired`。

**Q：改 Workflow 会影响已绑 Skill 吗？**  
workflow-only Skill **不会**因 SkillTool 未覆盖而被阻断。有 SkillTool 叠加层的 Skill 仍会被 `WORKFLOW_CHANGE_BREAKS_SKILL_REFERENCES` 拦截。

**Q：Chat scope 不对会怎样？**  
`workflow_init` 可能 `scope_incompatible` 回退 `plan_compile`；用户完全无节点权限时发消息前 `SKILL_TOOLS_EMPTY`。

---

## 12. 实现参考（服务端）

| 模块 | 文件 |
|------|------|
| workflow-only 保存 | `workflow.service.ts` → `assertSkillWorkflowBindingsCompatible` |
| 运行时权限 | `workflow-runtime-scope.util.ts`、`requested-skill-run.service.ts` |
| PageAction host 推导 | `page-action-workflow-host.util.ts` |
| workflow_init scope | `workflow-init.node.ts`（Agent 级 `allowedToolIds`） |
