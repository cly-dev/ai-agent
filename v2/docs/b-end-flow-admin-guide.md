# B 端 Flow 配置与对接指南

> **受众**：B 端管理台前端、产品、运营、实施  
> **唯一配置真源**：`Flow`（Intent / Preset → 服务端编译 IR）  
> **全局前缀**：`/admin`（下文路径均相对此前缀，除非标明 C 端）  
> **鉴权**：Admin JWT；角色 `SUPER_ADMIN` / `OPERATOR`  
> **变更**：`refactor-workflow-intent-ssot`

本文侧重 **心智模型、API 字段、错误码与迁移**。  
配套：

| 文档 | 内容 |
|------|------|
| [`b-end-flow-capabilities-and-scenarios.md`](./b-end-flow-capabilities-and-scenarios.md) | 节点能力、Preset 场景、端到端使用 |
| [`b-end-flow-intent-editor-ux.md`](./b-end-flow-intent-editor-ux.md) | Intent 步骤编辑器交互（非 JSON） |
| [`b-end-flow-frontend-ux.md`](./b-end-flow-frontend-ux.md) | 前端整体页面交互与差距自检 |

---

## 0. 一句话定调

| 以前（废弃） | 现在（唯一） |
|--------------|--------------|
| 手搓 Workflow 原子节点图 | 选 **Preset**（或高级编辑 **Intent**）保存为 **Flow** |
| Skill / PageAction 绑 `workflowId` | **只绑 `flowId`**（可选 `flowVersion`） |
| B 端编辑 IR / action | IR **只读排障**，禁止当保存真源 |

运行时只执行 Flow。存量仍挂 `workflowId` 的入口 **不会再跑**，须先走迁移向导。

> **代码保留 ≠ 现网兼容**：`loadWorkflowForRun*` / Workflow 表可留着，供以后**另开独立链路与 Runtime**；当前 Chat / PageAction / Skill **禁止**当回退路径使用。

---

## 1. 配置心智模型

### 1.1 三层语言（B 端只写第一层）

```text
┌─────────────────────────────────────────────────────────┐
│  B 端可写                                                │
│  Preset（场景模板） 或  Intent（业务步骤）                │
└───────────────────────────┬─────────────────────────────┘
                            │  保存时服务端 compile
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Flow.ir（机器语言）— 详情页只读折叠，禁止当表单真源      │
└───────────────────────────┬─────────────────────────────┘
                            │  服务端 lower（executor 过渡桥）
                            ▼
                     运行时执行（对 B 端不可见）
```

| 概念 | 谁写 | B 端怎么展示 |
|------|------|----------------|
| **Preset** | 运营选场景 + 填 Tool/Host ID | 创建向导主路径 |
| **Intent** | 高级用户编辑 steps/edges | 「高级模式」；保存后可回看 |
| **Flow** | 资产本体（`flowKey` / `name` / `profile`） | 列表 + 详情 |
| **IR** | 仅 Compiler | 折叠只读；勿做节点编辑器 |
| **Skill / PageAction** | 入口绑定 `flowId` | 下拉选 Flow，**不**再出现 Workflow 选择器 |

### 1.2 Profile：先定「用在哪」

创建 Flow 时 **先选 `profile`**，再筛可用 Preset：

| `profile` | 用途 | 可绑入口 |
|-----------|------|----------|
| `page_action` | 页内一键动作 | PageAction |
| `chat_skill` | Chat Skill 编排 | Skill |
| `shared` | 两边都能用 | Skill 或 PageAction |

**产品约定（入口定策略）**：`mutate` / `mutation_submit` **只服务 Skill（Chat）**——走确认链，不是开关。PageAction **不配** mutate；页内写用 `deliver(fill)`。创建 Flow 时 `profile` 固定 `shared`，不要靠 `page_action` profile 当唯一闸门。详见 [`b-end-flow-product-canvas-guide.md`](./b-end-flow-product-canvas-guide.md) §1.1。

### 1.3 入口绑定心智

```text
Flow（编排资产，AppClient 级）
   │
   ├─ Skill.flowId        → Chat 发消息命中 Skill 后跑编排
   └─ PageAction.flowId   → C 端 invoke PageAction 后跑编排
```

- **一个 Flow 可被多个 Skill / PageAction 引用**（详情有 `skillRefCount` / `pageActionRefCount`）。
- **钉版本**：`flowVersion` 有值则跑该 revision；缺省跟 Flow 头版本。钉到不存在的版本 → 运行失败 / 空通道（**不会**静默用最新版）。
- Skill **无 `flowId`**：走 Plan LLM 动态步序（不是 Workflow）。
- PageAction **仅有旧 `workflowId`、无 `flowId`**：invoke 直接失败 `FLOW_REQUIRED`，须 migrate。

### 1.4 和「老 Workflow」的关系（给产品/前端）

| 层级 | 怎么处理 |
|------|----------|
| 配置面 | 只认 Flow；正数 `workflowId` → `400` / `LEGACY_WORKFLOW_BINDING_REMOVED` |
| 运行时 | 只执行 Flow |
| `/workflow` | **归档**：列表 / 详情 / 版本 / 删除；**无** create/update |
| 迁移 | 候选列表 → 预览 → 一键 migrate（改绑 + 停用源） |
| 删除 Flow | 无 pending 审批，且无 Skill/PageAction 仍绑定，否则拒绝 |

**不要**再做「原子节点画布」；迁移页只做「迁到 Flow / 删除归档」。

---

## 2. 建议信息架构（页面）

B 端建议拆成四块（路由名可自定，能力要对齐）：

```text
编排
├── Flow 列表          /flows?appClientId=
├── Flow 创建 / 编辑    /flows/new | /flows/:id
├── Flow 版本          /flows/:id/revisions
└── 存量迁移           /flows/migrate   （读 /workflow 归档 + /flow/migration-*）

入口配置（已有模块增强）
├── Skill 表单         编排字段 = Flow 下拉（flowId）
└── PageAction 表单    同上

归档（弱入口）
└── Legacy Workflow    只读列表 +「去迁移」+ 删除
```

### 2.1 Flow 列表

| UI | 数据 |
|----|------|
| 筛 AppClient、关键词、是否启用 | `GET /flow/by-app-client/:appClientId` |
| 列：名称、`flowKey`、`profile`、`version`、引用数、节点数 | `name` / `flowKey` / `profile` / `version` / `skillRefCount` / `pageActionRefCount` / `irNodeCount` |
| 行操作：详情、编辑、版本、删除 | 删除前看引用数；有引用先解绑 |

列表项 **不含** 完整 `intent`/`ir`（减轻 payload）。

### 2.2 Flow 创建向导（推荐交互）

```text
Step 1  基础信息
        appClientId / flowKey / name / profile /（可选）description、goal

Step 2  选场景 Preset（按 profile 过滤 catalog）
        展示 label + description + expandedOperations

Step 3  填 presetConfig
        按 catalog.requiredConfig / optionalConfig 动态表单
        Tool / HostTool 用现有选择器（同 AppClient）

Step 4  预览 Intent（可选）
        创建成功后进详情看 intent；高级用户可再 PATCH intent

Step 5  完成 → 引导「去绑 Skill / PageAction」
```

**高级模式**：Step 2–3 换成 **可视化 Intent 步骤编辑器**（见 [`b-end-flow-intent-editor-ux.md`](./b-end-flow-intent-editor-ux.md)）。仍提交 `intent`，不提交 `ir`。**不是**手写 JSON。

### 2.3 Flow 详情

| 区块 | 行为 |
|------|------|
| 基础信息 | 可 PATCH `name` / `description` / `isActive` / `sortOrder` 等 |
| Intent | 主展示：steps / edges / operation；可「用 Preset 重建」或「编辑 Intent」 |
| IR | **默认折叠**；文案：「编译产物，只读」 |
| 派生绑定 | `flowTools` / `flowHostTools` 只读列表（一般由 Intent slots 派生） |
| 引用 | Skill / PageAction 数量；链到入口列表（若有） |
| 版本 | 进 revisions；当前 `version` 高亮 |

### 2.4 Skill / PageAction 表单（编排区）

| 控件 | 规则 |
|------|------|
| 编排资产 | **Flow 下拉**（同 `appClientId`，建议按 `profile` 过滤：Skill → `chat_skill\|shared`；PageAction → `page_action\|shared`） |
| 字段写入 | 只写 `flowId`；可选 `flowVersion` |
| 清空编排 | `flowId: null`（允许）；**不要**写正数 `workflowId` |
| 存量提示 | 若详情仍返回旧 `workflowId` 且 `flowId` 为空 → 黄条：「须迁移，否则无法运行」+ 链到迁移页 |
| `workflowId` 输入框 | **删除**；勿保留「高级兼容」 |

PageAction 额外：

- `hostToolId` 可空；填页类优先依赖 Flow Intent 里的 fill HostTool。
- 绑了 Flow 后加载失败 → C 端 SSE `failed`，**不会**静默回退单步 Host。

### 2.5 迁移向导（推荐交互）

```text
1. GET /flow/migration-candidates?appClientId=
   → 表格：workflowKey、引用 Skill/PA 数、是否启用

2. 行点击「预览」
   GET /flow/migrate-from-workflow/:id/preview
   → 展示：matchedPattern、warnings、lossy、将改绑数量、推断 intent 摘要
   → lossy=true：强提示「请核对 Intent，必要时迁移后用 Preset 重建」

3. canMigrate=false（flowKey 冲突）
   → 要求用户改 flowKey 再预览 / 迁移

4. 确认迁移
   POST /flow/migrate-from-workflow/:id
   body: { rebindBindings: true, deactivateSource: true, flowKey? }

5. 成功页
   → 新 Flow 链接；skillsUpdated / pageActionsUpdated
   → 建议冒烟：PageAction invoke 或 Chat 点 Skill

6. 可选
   DELETE /workflow/:id（确认无残留引用）
```

---

## 3. API 一览

### 3.1 Flow（主路径）

| 操作 | 方法 | 路径 |
|------|------|------|
| Preset 目录 | `GET` | `/flow/presets/catalog` |
| 状态 key 分配 | `POST` | `/flow/intent/state-keys` |
| 分页列表 | `GET` | `/flow/by-app-client/:appClientId` |
| 详情 | `GET` | `/flow/:id` |
| 创建 | `POST` | `/flow` |
| 更新 | `PATCH` | `/flow/:id` |
| 删除 | `DELETE` | `/flow/:id` |
| 版本列表 | `GET` | `/flow/:id/revisions`（`summary=true` 仅元数据） |
| 指定版本 | `GET` | `/flow/:id/revisions/:version` |
| 迁移候选 | `GET` | `/flow/migration-candidates?appClientId=` |
| 迁移预览 | `GET` | `/flow/migrate-from-workflow/:workflowId/preview?flowKey=` |
| 执行迁移 | `POST` | `/flow/migrate-from-workflow/:workflowId` |

### 3.2 Legacy Workflow（归档）

| 操作 | 方法 | 路径 |
|------|------|------|
| 列表 / 详情 / 版本 | `GET` | `/workflow/...` |
| 删除 | `DELETE` | `/workflow/:id` |

响应含 `deprecated: true`、`configWritable: false`。前端只做「迁移 / 删除」。

### 3.3 入口（已有 Admin）

| 资源 | 路径示例 | 编排字段 |
|------|----------|----------|
| Skill | `POST/PATCH .../skill` | **`flowId` / `flowVersion`** |
| PageAction | `POST/PATCH /page-action` | **`flowId` / `flowVersion`** |

### 3.4 响应包络

成功（非 SSE）：

```json
{ "status": 200, "message": "success", "data": { } }
```

业务校验失败时 HTTP 仍可能为 200，错误看 `data.code` / `data.message` / `data.issues`。

---

## 4. 创建 / 更新 Flow

`preset` + `presetConfig` 与 `intent` **二选一**（勿同时传）。

### 4.1 Preset（推荐）

```http
POST /admin/flow
Content-Type: application/json
```

```json
{
  "appClientId": 2,
  "flowKey": "page.review.autofill",
  "name": "评论自动回填",
  "profile": "shared",
  "preset": "page_auto_fill",
  "presetConfig": {
    "hostToolId": 12,
    "readToolId": 205
  }
}
```

详情返回：`intent`、`ir`（只读）、`flowTools` / `flowHostTools`、`version`、引用计数。
产品创建约定见 [`b-end-flow-product-canvas-guide.md`](./b-end-flow-product-canvas-guide.md)。

### 4.2 Preset 目录 → 动态表单

`GET /flow/presets/catalog?profile=` 返回项形状：

| 字段 | 用途 |
|------|------|
| `kind` | 写入 `preset` |
| `label` / `description` | 向导文案 |
| `profiles` | 与当前 `profile` 求交（产品创建固定 `shared`） |
| `requiredConfig` | 必填表单项 |
| `optionalConfig` | 可选表单项 |
| `expandedOperations` | 展示「会展开成哪些业务步骤」 |

目录**仅三张产品卡**（无兼容 kind）：

| `preset` | 必填 config | 语义 |
|----------|-------------|------|
| `page_auto_fill` | `hostToolId` | 可选读数 → **仅填页**（无 speak） |
| `fetch_and_answer` | `readToolId` | 拉数 → 口头说明 |
| `mutation_submit` | `writeToolId` | 组参 → 审批 → 执行（标准无说明） |

`presetConfig` 产品键：

| 键 | 类型 | 说明 |
|----|------|------|
| `readToolId` | number | HTTP 读 Tool |
| `writeToolId` | number | 写 Tool（mutate；仅 Chat 场景） |
| `hostToolId` | number | 页内 HostTool（fill） |

**不要**再传 `explainBeforeConfirm` / `summarizeAfter`（已从 catalog 删除；写入策略由 Skill vs PageAction 入口派生，见产品画布指南 §1.1）。

画布状态边 key 分配：`POST /flow/intent/state-keys` body `{ "labels": ["可回答", "需变更"] }` → `{ "keys": ["…", "…"] }`。

约束：

- `tools[]` / `hostTools[]` 一般不传；绑定由 Intent slots 派生。
- DB **不存** Preset 名；想「按场景重建」须再次 `PATCH` 完整 `preset` + `presetConfig`。

### 4.3 Intent（高级）

```json
{
  "appClientId": 2,
  "flowKey": "skill.order.inquiry",
  "name": "订单查询",
  "profile": "chat_skill",
  "intent": {
    "version": 1,
    "profile": "chat_skill",
    "entryStepId": "read",
    "steps": [
      {
        "id": "read",
        "operation": "read",
        "slots": { "readToolIds": [101] }
      },
      {
        "id": "speak",
        "operation": "deliver",
        "channel": "speak",
        "summarizeMode": "final"
      }
    ],
    "edges": [
      { "id": "e_read_speak", "from": "read", "to": "speak", "kind": "always" }
    ]
  }
}
```

| operation | 含义 | 关键字段 |
|-----------|------|----------|
| `read` | 拉数 / 图证据 | `slots.readToolIds` 或 `capabilities.images` |
| `judge` | 结构化判定 | `capabilities.policyHint` |
| `deliver` | 对人说话或填页 | `channel: speak \| fill`；fill 需 `fillHostToolIds` |
| `mutate` | 写确认链 | `slots.writeToolId` 必填 |

`pageContext` **不进 Intent**，运行时由 C 端请求注入。

### 4.4 更新 / 版本

```http
PATCH /admin/flow/:id
```

- 传 `preset`+`presetConfig` **或** `intent` → **`version` +1**，写 `FlowRevision`
- 仅改 `name` / `isActive` 等元数据 → 通常不升编排版本（以服务端行为为准）
- 版本：`GET /flow/:id/revisions`、`GET /flow/:id/revisions/:version`

钉版本 UI：Skill/PageAction 的 `flowVersion` 下拉来自 revisions 列表。

### 4.5 删除

```http
DELETE /admin/flow/:id
```

| 错误码（示意） | 含义 | UI |
|----------------|------|-----|
| `FLOW_HAS_PENDING_APPROVALS` | 有未结审批 | 提示先处理审批 |
| `FLOW_HAS_ACTIVE_RUNS` | 有进行中 PageActionRun | 等跑完或取消后再删 |
| `FLOW_STILL_BOUND` | 仍有 Skill/PageAction 绑定 | 列出引用数，引导解绑 |

成功：`{ "ok": true, "id": 123 }`。

---

## 5. Skill / PageAction 绑定

### 5.1 Skill

| 字段 | 说明 |
|------|------|
| `flowId` | 新配置必填（要跑编排时） |
| `flowVersion` | 可选钉版本 |
| `prompt` | Chat 角色 / 指引 |
| SkillTool / SkillHostTool | **可选**；执行以 Flow 节点引用为准 |

相关 Admin（示例）：

- 创建：`POST /app-client/:appClientId/skills` 或带 agent 的路径  
- 更新：`PATCH /skill/:skillId`  
- 详情：`GET /skill/:skillId`（若仍见 `workflowId` 无 `flowId` → 迁移提示）

### 5.2 PageAction

| 字段 | 说明 |
|------|------|
| `flowId` | 编排（分析 / 填页） |
| `flowVersion` | 可选钉版本 |
| `hostToolId` | 可省略 |
| `systemPrompt` | 页内角色 |
| `pageScope` | 与 C 端 `pageContext.page` 对齐 |
| `actionKey` | 稳定键，创建后勿乱改 |

- 创建：`POST /page-action`  
- 更新：`PATCH /page-action/:id`  
- C 端执行：`POST /page-action/invoke`（**无** `/admin` 前缀）

### 5.3 推荐配置路径

**页内回填**

1. `POST /flow`（`page_auto_fill`，`profile=page_action`）  
2. `POST /page-action`：`flowId` + `actionKey` + `systemPrompt` + `pageScope`  
3. C 端 invoke 冒烟  

**Chat 变更**

1. `POST /flow`（`mutation_submit`，`profile=chat_skill`）  
2. Skill 绑 `flowId`  
3. C 端会话内走写确认（Preset 已含确认链）  

**Chat 拉数作答**

1. `POST /flow`（`fetch_and_answer`）  
2. Skill 绑 `flowId`  

---

## 6. 存量迁移 API 细节

### 6.1 候选列表

```http
GET /admin/flow/migration-candidates?appClientId=2
```

`data.items[]`：

| 字段 | 说明 |
|------|------|
| `workflowId` / `workflowKey` / `name` / `profile` / `isActive` | 源资产 |
| `skillRefCount` / `pageActionRefCount` | 将改绑数量 |
| `previewPath` / `migratePath` | 相对路径提示 |

### 6.2 预览（不写库）

```http
GET /admin/flow/migrate-from-workflow/:workflowId/preview?flowKey=optional.key
```

| 字段 | UI 用法 |
|------|---------|
| `canMigrate` | false 时禁用「确认迁移」 |
| `flowKeyAvailable` | false → 改 `flowKey` |
| `lossy` | true → 警告条 |
| `warnings[]` | 列表展示 |
| `matchedPattern` | 推断命中的模式 |
| `intent` | 只读预览 |
| `rebind.skillCount` / `pageActionCount` | 确认文案 |
| `error` | 无法推断时展示 |

### 6.3 执行

```http
POST /admin/flow/migrate-from-workflow/:workflowId
```

```json
{
  "flowKey": "optional.override.key",
  "rebindBindings": true,
  "deactivateSource": true,
  "changeNote": "migrate v1"
}
```

| 参数 | 默认 | 含义 |
|------|------|------|
| `flowKey` | 源 `workflowKey` | 目标 Flow 键 |
| `rebindBindings` | `true` | Skill / PageAction 改绑到新 Flow 并清空 `workflowId` |
| `deactivateSource` | `true` | 源 `isActive=false` |

成功返回：`flow`、`warnings`、`rebind.skillsUpdated` / `pageActionsUpdated`、`sourceDeactivated`。

同一事务：创建 Flow + 改绑 + 停用源，避免半迁移。

---

## 7. 错误码与前端提示

| code | 场景 | 前端建议 |
|------|------|----------|
| `LEGACY_WORKFLOW_BINDING_REMOVED` | Skill/PA 写入正数 `workflowId` | Toast：请改绑 Flow；链到迁移 |
| `FLOW_REQUIRED` | PageAction 仅有旧 workflow 绑定时 invoke | 配置侧先拦；运行侧提示 migrate |
| `FLOW_HAS_PENDING_APPROVALS` | 删除 Flow | 引导审批收件箱 |
| `FLOW_HAS_ACTIVE_RUNS` | 删除 Flow | 有进行中 / 待审批的 PageActionRun |
| `FLOW_STILL_BOUND` | 删除 Flow | 展示引用数，先解绑 |
| `FLOW_PRESET_INTENT_CONFLICT` | 同时传 preset 与 intent | 表单互斥校验 |
| `FLOW_REVISION_NOT_FOUND` | 查不存在版本 | 刷新 revisions |
| flowKey 唯一冲突 | 创建/迁移 | 改 `flowKey` |

审批新建只写 `flowId`；收件箱展示优先 `flowKey` / Flow 名称（`workflowKey` 字段可能回落 Flow）。

---

## 8. B 端对接检查清单

配置面：

- [ ] 编排中心路由改为 Flow；创建走 Preset 向导  
- [ ] 详情 Intent 主展示、IR 折叠只读  
- [ ] 无原子节点编辑器；无 `POST/PATCH /workflow`  
- [ ] Skill / PageAction：Flow 下拉 + 只写 `flowId`；去掉 `workflowId` 输入  
- [ ] 存量 `workflowId` 无 `flowId`：黄条 + 迁移入口  
- [ ] 迁移三步：候选 → 预览（lossy/warnings）→ 执行  
- [ ] 删除 Flow：处理 `FLOW_STILL_BOUND` / `FLOW_HAS_PENDING_APPROVALS`  
- [ ] PageAction 侧隐藏/禁用含 mutate 的 Flow / `mutation_submit`（入口定策略）

联调冒烟：

- [ ] 新建 `page_auto_fill` Flow → 绑 PageAction → C 端 invoke 成功  
- [ ] 新建 `fetch_and_answer` Flow → 绑 Skill → Chat 点 Skill 有编排步  
- [ ] （若有存量）migrate 后入口 `flowId` 有值、`workflowId` 为空，再跑通一次  

---

## 9. 禁止事项

- 调用已移除的 `POST/PATCH /admin/workflow`  
- Skill / PageAction 写入正数 `workflowId`  
- 把 Flow 数字 ID 写入任何 `Workflow` FK  
- 把 IR / 旧 action 名当运营配置真源  
- 在 Intent 里配置 `load_page_context` 步骤  
- PageAction 配 mutate / mutation Preset，或给 mutate 加免确认 / 说明开关
- 钉 `flowVersion` 后依赖「自动回落最新版」（不会）  

---

## 10. 交付状态

| 项 | 状态 |
|----|------|
| Flow CRUD / Preset / Intent / revisions | ✅ |
| Skill / PageAction 只认 `flowId` | ✅ |
| 运行时只执行 Flow；审批只写 `flowId` | ✅ |
| Legacy 写路由移除；迁移 preview + migrate | ✅ |
| 原生 IR executor（去掉 lower） | ✅ 物化统一；run 带 irNodeId；executor 经 `resolveWorkflowNodeRuntimeInput` 读 irConfig |
| Trigger / Parallel | ⏳ 另开变更 |

---

## 11. 代码索引

| 区域 | 路径 |
|------|------|
| Admin API | `src/modules/flow/` |
| Intent / Preset / compile / lower / migrate | `src/core/workflow/` |
| Preset 目录与 config 校验 | `src/core/workflow/workflow-preset.util.ts` |
| OpenSpec 变更 | `openspec/changes/refactor-workflow-intent-ssot/` |
