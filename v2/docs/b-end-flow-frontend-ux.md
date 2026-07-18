# B 端 Flow 前端交互规范（完整版）

> **受众**：B 端管理台前端 / 产品  
> **目标**：对齐「Preset / Intent → Flow → 绑入口」的配置体验，避免做成旧 Workflow 节点画布  
> **API / 字段权威**：同目录 [`b-end-flow-admin-guide.md`](./b-end-flow-admin-guide.md)  
> **节点能力与场景手册**：[`b-end-flow-capabilities-and-scenarios.md`](./b-end-flow-capabilities-and-scenarios.md)  
> **Intent 画布编排（专用）**：[`b-end-flow-intent-editor-ux.md`](./b-end-flow-intent-editor-ux.md)  
> **类型真源**：`src/core/workflow/workflow-preset.types.ts`、`workflow-intent.types.ts`  
> **全局前缀**：`/admin`；鉴权 Admin JWT（`SUPER_ADMIN` / `OPERATOR`）

本文是 **前端实现清单级** 交互说明。实现时按文中「必须 / 禁止 / 验收」自检；与本文冲突时以服务端校验为准。

---

## 0. 产品定调（先对齐再写页面）

| 维度 | 目标行为 | 常见做错 |
|------|----------|----------|
| 配置真源 | 只写 **Preset** 或 **Intent** | 编辑 / 提交 **IR**、旧 action 名 |
| 资产名 | 列表与菜单叫 **Flow / 编排** | 继续叫 Workflow、画布、节点图 |
| 入口绑定 | Skill / PageAction 只选 **`flowId`** | 保留 `workflowId` 下拉「兼容」 |
| 创建主路径 | **场景 Preset 向导** | 一上来就 JSON / 原子节点 |
| 高级路径 | **Intent 步骤表单编辑器**（列表 + 属性面板） | 手写 JSON / 把 IR 当高级模式 |
| 页内写入 | **PageAction 不配 mutate**；用 `deliver(fill)` | 给 mutate 加免确认 / 绑 mutation Preset |
| Chat 写入 | Skill 绑 `mutation_submit` / `mutate` → **必确认** | 用说明开关 / skipConfirm 表达差异 |

> **现行 SSOT**：[`b-end-flow-product-canvas-guide.md`](./b-end-flow-product-canvas-guide.md)（三卡 Preset、入口定策略）。下文若与之冲突，以产品画布指南为准。

心智一句话：

```text
运营选「要干什么」（Preset）→ 填 Tool/Host → 保存成 Flow
→ Skill / PageAction 下拉绑这个 Flow → C 端跑
```

---

## 1. 信息架构与路由

建议路由（名称可改，能力必须齐）：

```text
/flows                              Flow 列表（按 AppClient）
/flows/new                          创建向导
/flows/:id                          详情（Intent 主展示 + IR 折叠）
/flows/:id/edit                     编辑（可与详情合并）
/flows/:id/revisions                版本列表
/flows/:id/revisions/:version       某版 Intent/IR 只读对照
/flows/migrate                      存量 Workflow → Flow 迁移

/skills/:id/edit                    编排区 = Flow 下拉（改已有页）
/page-actions/:id/edit              同上

/workflows（弱入口 / 归档）         只读列表 +「去迁移」+ 删除
```

侧栏建议：

- **编排**：指向 `/flows`（主入口）
- **存量迁移**：有候选时角标数字（`migration-candidates` 条数）
- **Legacy Workflow**：折叠在「高级 / 归档」下，勿与 Flow 并列同权

---

## 2. Flow 列表页

### 2.1 数据

```http
GET /admin/flow/by-app-client/:appClientId?page=&pageSize=&profile=&isActive=&keyword=
```

列表项 **不含** 完整 `intent` / `ir`（有 `irNodeCount`）。

### 2.2 UI

| 区域 | 行为 |
|------|------|
| 筛选项 | AppClient、关键词（`flowKey`/`name`）、`profile`、是否启用 |
| 表格列 | 名称、`flowKey`、`profile`、版本、`irNodeCount`、Skill 引用、PA 引用、启用、更新时间 |
| 行操作 | 详情、编辑、版本、删除 |
| 主 CTA | 「新建 Flow」→ `/flows/new` |
| 次 CTA | 「从旧 Workflow 迁移」→ `/flows/migrate` |

### 2.3 删除交互

点删除前：

1. 若 `skillRefCount + pageActionRefCount > 0` → 禁用或弹窗「请先解绑」
2. 调 `DELETE /admin/flow/:id` 后处理：

| code | Toast / 引导 |
|------|----------------|
| `FLOW_STILL_BOUND` | 展示引用数，链到 Skill / PA 列表 |
| `FLOW_HAS_PENDING_APPROVALS` | 链到审批收件箱 |
| `FLOW_HAS_ACTIVE_RUNS` | 提示等跑完或取消 PageActionRun |

---

## 3. 创建向导（主路径：Preset）

向导状态机建议存在前端 store（可刷新丢失则从 Step 1 重来即可）。

```text
[1 基础] → [2 选 Preset] → [3 填 Config] → [4 确认提交] → [成功引导绑定]
                ↘（高级）Intent 编辑器 ↗
```

`preset` 与 `intent` **全局互斥**：选了 Preset 模式就不要再塞 `intent` 字段。

### 3.1 Step 1 — 基础信息

| 字段 | 控件 | 校验 |
|------|------|------|
| `appClientId` | 应用选择器（上下文已定则只读） | 必填 |
| `flowKey` | 文本；建议 `domain.action` 风格 | 必填，≤200；同应用唯一 |
| `name` | 文本 | 必填，≤200 |
| `profile` | **单选卡片**（三选一） | 必填；选定后锁定到提交（创建后不可 PATCH profile） |
| `description` | 多行 | 可选 |
| `goal` | 多行 | 可选 |
| `deliverable` | 下拉 | 可选，默认 `answer`；枚举见下 |
| `constraints` | 字符串标签列表 | 可选 |
| `isActive` / `sortOrder` | 开关 / 数字 | 默认 true / 0 |

**`profile` 卡片文案（建议）：**

| 值 | 标题 | 说明 | 后续可绑 |
|----|------|------|----------|
| `page_action` | 页内动作 | 给 PageAction 用；**不能**做写确认链 | PageAction |
| `chat_skill` | Chat Skill | 给对话 Skill 用；可含变更确认 | Skill |
| `shared` | 共用 | Skill 与 PageAction 都能绑 | 两者 |

**`deliverable` 枚举：** `analysis` | `list` | `detail` | `mutation` | `answer`  
（多数场景保持默认 `answer` 即可，高级再展开。）

**交互要点：**

- 改 `profile` 时：若已选 Preset 且新 profile 不在该 Preset 的 `profiles` 内 → 清空 Preset 选择并提示。
- 「下一步」前本地校验必填。

### 3.2 Step 2 — 选 Preset

```http
GET /admin/flow/presets/catalog?profile=<Step1.profile>
```

返回项字段：

| 字段 | UI 用法 |
|------|---------|
| `kind` | 选中后写入请求 `preset` |
| `label` | 卡片标题 |
| `description` | 卡片说明 |
| `profiles` | 不含当前 profile → **禁用 + tooltip**「当前用途不支持」 |
| `requiredConfig` | 进入 Step 3 的必填键列表 |
| `optionalConfig` | 可选键列表 |
| `expandedOperations` | 卡片底部 chip：将展开成哪些业务步骤（**不是** IR） |

**卡片交互：**

- 单选；选中高亮。
- 展示 `expandedOperations` 例如：`read` → `deliver(fill)` → `deliver(speak)`。
- 提供入口：「改用高级 Intent 编辑」→ 清空 preset，进入 §5。

**六种 Preset（产品文案对齐服务端 label）：**

| kind | 适用 profile | 一句话给运营 |
|------|--------------|--------------|
| `page_auto_fill` | 全部 | 可选拉数 → 填页 → 口头说明 |
| `page_context_push` | 全部 | 不拉数，靠页内上下文填页 → 说明 |
| `fetch_push_summarize` | 全部 | 拉数 → 填页 → 说明 |
| `fetch_and_answer` | 全部 | 拉数 → 只口头作答（不填页） |
| `mutation_submit` | **仅** chat_skill / shared | 写操作 + 用户确认门（Chat） |
| `page_context_mutation_submit` | **仅** chat_skill / shared | 同上，写依赖运行时 pageContext |

`mutation_submit` **仅 Skill/Chat**。PageAction 创建/推荐 Flow：**隐藏或禁用**变更卡（入口定策略，不是 profile 闸门）。勿渲染 `explainBeforeConfirm` / `summarizeAfter`。

### 3.3 Step 3 — 动态 Config 表单

Catalog **只返回键名**，没有 type/label。前端必须有一份 **字段字典**（与本文 §4 一致），按 `requiredConfig ∪ optionalConfig` 渲染。

**渲染规则：**

1. `requiredConfig` 中的键：标必填，提交前校验。
2. `optionalConfig`：可折叠「高级选项」。
3. `objectives`：拆成子字段 `fetch` / `push` / `write` / `summarize`（按 Preset 语义显示有关的）。
4. Tool / Host 选择器：**限定当前 `appClientId`**；Host 用 HostTool 选择器，读/写用 Tool 选择器。
5. 不要提供「手填 tools[] / hostTools[]」主路径（绑定由 Intent slots 派生；见 §6.4）。

### 3.4 Step 4 — 确认与提交

确认页只读摘要：

- 基础信息 + Preset label + 已填 Tool/Host 名称（若选择器能反查）
- `expandedOperations` 再次展示

提交：

```http
POST /admin/flow
```

```json
{
  "appClientId": 2,
  "flowKey": "page.review.autofill",
  "name": "评论自动回填",
  "profile": "page_action",
  "preset": "page_auto_fill",
  "presetConfig": {
    "hostToolId": 12,
    "readToolId": 205,
    "objectives": {
      "push": "根据评论生成回复并填入表单",
      "summarize": "告知用户草稿已填入"
    }
  }
}
```

**禁止**在 body 里同时带 `intent`。  
**禁止**提交 `ir`。

成功后：

1. Toast 成功，跳转 `/flows/:id`
2. 详情顶栏引导条：「去绑定 PageAction」或「去绑定 Skill」（按 profile）
3. 可选：展示刚生成的 Intent 步骤只读预览（证明「不是空壳」）

### 3.5 创建错误处理

| code / 情况 | UI |
|-------------|-----|
| `WORKFLOW_PRESET_INTENT_CONFLICT` | 不应出现；出现则清掉一侧 |
| `WORKFLOW_INTENT_REQUIRED` | 未选 Preset 也未填 Intent |
| `WORKFLOW_INTENT_INVALID` + `issues` | 按 path 标红（高级模式） |
| `FLOW_TOOL_NOT_FOUND` / `FLOW_HOST_TOOL_NOT_FOUND` | 对应选择器标错 |
| `flowKey` 唯一冲突 | 改 key |
| Preset 校验失败（message） | Toast 原文；检查 profile / 必填 ID |

---

## 4. PresetConfig 字段字典（前端必实现）

与 `WorkflowPresetConfig` 对齐。Catalog 只给 key，**UI 元数据由前端维护**：

| key | 控件 | 值类型 | 文案建议 | 出现场景 |
|-----|------|--------|----------|----------|
| `hostToolId` | HostTool 单选 | `number` ≥1 | 填页 Host 工具 | 回填 / 推送类 |
| `readToolId` | Tool 单选 | `number` ≥1 | 读数 HTTP 工具 | 拉数类 |
| `writeToolId` | Tool 单选 | `number` ≥1 | 写数 HTTP 工具 | mutation 类 |
| `fetchCompleteWhen` | 单选 | `first_success` \| `fetch_all_pages` | 拉数何时算完成 | 有 read 时 |
| `summarizeMode` | 单选 | `brief` \| `detailed` \| `final` | 说明/总结语气 | 多数 |
| `presentMode` | 单选 | `brief` \| `detailed` | 变更前展示详细度 | mutation |
| `confirmKind` | 单选 | `mutation` \| `generic` | 确认门类型 | mutation |
| `objectives.fetch` | 文本 | string | 拉数步骤目标 | 有 read |
| `objectives.push` | 文本 | string | 填页步骤目标 | 有 fill |
| `objectives.write` | 文本 | string | 写步骤目标 | mutation |
| `objectives.summarize` | 文本 | string | 总结步骤目标 | 有 speak |

### 4.1 各 Preset 表单该显示什么

按 catalog 的 required/optional 渲染即可；下表便于产品验收：

#### `page_auto_fill`

- 必填：`hostToolId`
- 可选：`readToolId`、`fetchCompleteWhen`、`summarizeMode`、`objectives`
- 运营理解：有读工具则先拉数再填；无读工具则主要靠 pageContext

#### `page_context_push`

- 必填：`hostToolId`
- 可选：`summarizeMode`、`objectives`
- 运营理解：不配读工具，直接填页

#### `fetch_push_summarize`

- 必填：`readToolId`、`hostToolId`
- 可选：`fetchCompleteWhen`、`summarizeMode`、`objectives`

#### `fetch_and_answer`

- 必填：`readToolId`
- 可选：`fetchCompleteWhen`、`summarizeMode`、`objectives`
- 无 Host；Chat 问答主场景

#### `mutation_submit` / `page_context_mutation_submit`

- 必填：`writeToolId`
- 可选：`readToolId`、`presentMode`、`confirmKind`、`summarizeMode`、`objectives`
- **仅** `chat_skill` / `shared`
- 运营理解：会走「确认后再写」；不要配到纯 PageAction profile

### 4.2 Preset 模式禁止项

- 不要让用户编辑「展开后的 steps」却仍标成 Preset 保存（要么整单走 Intent 模式）
- 不要把 `expandedOperations` 当成可编辑节点
- DB **不存** Preset 名：详情无法「回显上次选的 preset」；重建须再次选 Preset 并 `PATCH`

---

## 5. 高级模式：Intent 配置交互

完整交互规范（布局、属性面板、识图开关、连线、分期验收）见专用文档：

→ **[`b-end-flow-intent-editor-ux.md`](./b-end-flow-intent-editor-ux.md)**

要点摘要：

- **Intent 画布**：四类业务节点 + 连线，不是手写 JSON / 不是旧 IR action 画布  
- 只编辑 `read` / `judge` / `deliver` / `mutate`；不编辑 IR  
- 与 Preset **互斥**；保存只提交 `intent`  
- 识图 = `read` 上的能力开关；`page_action` 禁止 `mutate`  

创建向导入口：Step 2「使用高级 Intent」。详情入口：「编辑 Intent」。
---

## 6. 详情 / 编辑页

### 6.1 布局（推荐）

```text
┌──────────────────────────────────────────────────────────┐
│ 标题 name · flowKey · profile · v{version} · 启用        │
│ [编辑基础] [用 Preset 重建] [编辑 Intent] [版本] [删除]   │
├──────────────┬───────────────────────────────────────────┤
│ Intent 主区  │  步骤时间线 / 列表（operation + objective） │
│ （默认真源） │  edges 摘要                                 │
├──────────────┴───────────────────────────────────────────┤
│ ▸ IR（编译产物，只读）—— 默认折叠，给排障用                │
├──────────────────────────────────────────────────────────┤
│ 派生绑定：flowTools / flowHostTools（只读表）              │
│ 引用：Skill xN · PageAction xM → 链到过滤列表              │
└──────────────────────────────────────────────────────────┘
```

### 6.2 编辑动作

| 动作 | 请求 | 版本 |
|------|------|------|
| 改 name / description / isActive / sortOrder | `PATCH` 仅元数据 | 通常不升编排 version |
| 「用 Preset 重建」 | 弹窗走 §3.2–3.3 → `PATCH` `preset`+`presetConfig` | **version+1**，写 revision |
| 「编辑 Intent」 | Intent 编辑器 → `PATCH` `intent` | **version+1** |
| 同时带 preset+intent | **禁止**；前端互斥 | `FLOW_PRESET_INTENT_CONFLICT` |

```http
PATCH /admin/flow/:id
```

注意：更新 DTO **不能改** `profile` / `flowKey` / `appClientId`。要换用途 → 新建 Flow。

### 6.3 IR 区交互

- 默认折叠
- 标题旁固定文案：「由服务端编译，禁止当配置编辑」
- 内容 JSON 只读（可复制）
- **不要**提供「从 IR 保存回 Flow」

### 6.4 tools / hostTools

- 详情只读展示派生绑定
- 一般 **不要** 在创建表单暴露手动绑定
- 若必须调 `isRequired`：仅允许改已有 slot 对应项的 `isRequired`；乱加 ID → `FLOW_BINDING_RESOLUTION_FAILED`

---

## 7. 版本页

```http
GET /admin/flow/:id/revisions?summary=true   // 列表轻量
GET /admin/flow/:id/revisions/:version       // 含 intent/ir
```

| UI | 行为 |
|----|------|
| 列表 | version、deliverable、changeNote、createdAt、是否当前 |
| 点开 | Intent 只读；IR 折叠 |
| 用途 | 给 Skill/PA 的 `flowVersion` 下拉提供选项 |

钉版本语义（入口表单要写清）：

> 填写 `flowVersion` 后固定跑该 revision；**不会**自动跟着最新版。钉到不存在的版本会失败。

---

## 8. Skill / PageAction 入口绑定（必改已有表单）

### 8.1 编排区块（替换旧 Workflow 选择器）

| 控件 | 行为 |
|------|------|
| Flow 下拉 | `GET /flow/by-app-client/:appClientId`；选项展示 `name (flowKey) · v{version}` |
| 过滤 | Skill：`profile in (chat_skill, shared)`；PageAction：`profile in (page_action, shared)`；仅 `isActive` |
| `flowId` | 选中写入；允许清空为 `null`（表示不跑 Flow 编排） |
| `flowVersion` | 可选；选项来自该 Flow 的 revisions；空 = 跟头版本 |
| `workflowOverrides` | 高级折叠：按 nodeKey 覆写 `objective`（若产品需要；可二期） |

### 8.2 必须删除

- `workflowId` / `workflowVersion` 输入与选择器
- 「兼容旧编排」开关

写入正数 `workflowId` → `LEGACY_WORKFLOW_BINDING_REMOVED`。

### 8.3 存量提示条

当详情仍返回旧 `workflowId` 且 `flowId` 为空：

```text
⚠ 该入口仍绑定旧 Workflow，现网已无法执行。请迁移到 Flow 或手动选择 Flow。
[去迁移]
```

PageAction 仅有旧绑定时 C 端 invoke → `FLOW_REQUIRED`（配置侧应提前拦住）。

### 8.4 推荐配置路径（产品可用作引导）

**页内回填**

1. 新建 Flow：`profile=page_action` + `page_auto_fill`
2. PageAction：`flowId` + `actionKey` + `pageScope` + `systemPrompt`
3. C 端 invoke 冒烟

**Chat 拉数作答**

1. Flow：`fetch_and_answer`
2. Skill 绑 `flowId`
3. 会话点 Skill

**Chat 变更确认**

1. Flow：`mutation_submit` + `chat_skill`
2. Skill 绑 `flowId`
3. 会话走确认链

---

## 9. 存量迁移向导

```text
候选列表 → 预览（可改 flowKey）→ 确认执行 → 成功页冒烟引导
```

### 9.1 候选

```http
GET /admin/flow/migration-candidates?appClientId=
```

表格列：`workflowKey`、name、profile、启用、将改绑 Skill 数、PA 数、操作「预览」。

### 9.2 预览

```http
GET /admin/flow/migrate-from-workflow/:workflowId/preview?flowKey=
```

| 字段 | UI |
|------|-----|
| `canMigrate` | false → 禁用确认；展示 `error` |
| `flowKeyAvailable` | false → 要求改 `flowKey` |
| `lossy` | true → **强警告**：推断有损，迁移后建议用 Preset 重建核对 |
| `warnings[]` | 列表 |
| `matchedPattern` | 展示推断模式（只读） |
| `intent` | 只读预览（可折叠） |
| `rebind` | 确认文案：「将改绑 N 个 Skill、M 个 PageAction」 |

### 9.3 执行

```http
POST /admin/flow/migrate-from-workflow/:workflowId
```

```json
{
  "flowKey": "optional.override",
  "rebindBindings": true,
  "deactivateSource": true,
  "changeNote": "migrate from legacy"
}
```

默认两开关建议 **打开** 且二次确认。

成功页：新 Flow 链接、改绑数量、建议立即冒烟；可选去归档删旧 Workflow。

---

## 10. 错误码 → 前端映射（表单级）

| code | 场景 | 前端 |
|------|------|------|
| `WORKFLOW_PRESET_INTENT_CONFLICT` / `FLOW_PRESET_INTENT_CONFLICT` | 同时传两边 | 表单互斥校验挡住 |
| `WORKFLOW_INTENT_REQUIRED` | 两边都空 | 提示选 Preset 或 Intent |
| `WORKFLOW_INTENT_INVALID` | Intent 不合法 | 展示 `issues[]` |
| `FLOW_BINDING_RESOLUTION_FAILED` | 手动 tools 与 slots 不符 | 去掉手改绑定 |
| `FLOW_DEFINITION_INVALID` | 编译后图不合法 | 联系后端 / 检查 Intent |
| `FLOW_TOOL_NOT_FOUND` / `FLOW_HOST_TOOL_NOT_FOUND` | ID 不在应用下 | 重选工具 |
| `FLOW_REVISION_NOT_FOUND` | 钉版本不存在 | 刷新 revisions |
| `FLOW_HAS_PENDING_APPROVALS` | 删除 | 去审批 |
| `FLOW_HAS_ACTIVE_RUNS` | 删除 | 等跑完 |
| `FLOW_STILL_BOUND` | 删除 | 先解绑 |
| `LEGACY_WORKFLOW_BINDING_REMOVED` | 入口写旧 workflowId | 改为 flowId |
| `FLOW_REQUIRED` | PA invoke | 配置侧黄条 |
| 迁移 `LEGACY_INTENT_INFER_*` | 预览失败 | 引导手建 Preset Flow 再改绑 |

业务失败时 HTTP 可能仍为 200，以 `data.code` / `data.message` / `data.issues` 为准（见 admin-guide）。

---

## 11. 与目标差距自检清单（给 B 端评审）

实现前用此表打分；任一项「否」即与目标有距离。

### 11.1 信息架构

- [ ] 有独立 Flow 列表 / 创建 / 详情，而不是改名后的 Workflow 画布
- [ ] Legacy Workflow 仅为归档弱入口
- [ ] 侧栏文案是「编排 / Flow」，不是「节点图」

### 11.2 创建

- [ ] 主路径是 Preset 向导（基础 → 选场景 → 动态表单 → 提交）
- [ ] `profile` 先选，并过滤 Preset
- [ ] PageAction 侧不可选 `mutation_submit` / 含 mutate 的 Flow
- [ ] 提交只带 `preset`+`presetConfig` 或只带 `intent`
- [ ] 从不提交 `ir`

### 11.3 Preset 表单

- [ ] 按 catalog 的 required/optional 动态渲染
- [ ] 字段字典覆盖 §4 全部 key（含 objectives 子字段）
- [ ] Tool/Host 选择器限制同 AppClient

### 11.4 Intent（若已做高级）

- [ ] 只编辑 `read|judge|deliver|mutate` + edges
- [ ] 无 IR/action 词表编辑器
- [ ] PageAction 上下文禁止 mutate 节点
- [ ] `deliver`+`fill` 强制 Host；`mutate` 强制 writeTool
- [ ] 无 pageContext 加载步骤

### 11.5 详情

- [ ] Intent 默认展开为主内容
- [ ] IR 默认折叠且只读
- [ ] 展示引用计数；删除受三码约束

### 11.6 入口

- [ ] Skill / PageAction 只有 Flow 下拉 + 可选 flowVersion
- [ ] 已删除 workflowId 控件
- [ ] 存量无 flowId 有黄条 + 迁移入口

### 11.7 迁移

- [ ] 候选 → 预览（lossy 警告）→ 执行 三步齐全

### 11.8 冒烟（联调）

- [ ] `page_auto_fill` → PageAction → invoke 成功
- [ ] `fetch_and_answer` → Skill → Chat 有编排步
- [ ]（若有存量）migrate 后入口仅 flowId 有值

---

## 12. 禁止事项（前端 Code Review 用）

1. 调用 `POST/PATCH /admin/workflow`
2. 保留或新增 `workflowId` 配置控件
3. 把 Flow 数字 id 写入任何 Workflow 外键字段
4. IR / 旧 action 名作为可编辑表单真源
5. Intent 里配置「加载 pageContext」
6. PageAction 配置 mutate / mutation Preset，或给 mutate 加免确认 / 说明开关
7. 钉 `flowVersion` 后假设会自动跟随最新版
8. 创建后用「静默改 profile」冒充换场景（应新建 Flow）

---

## 13. 文档与代码索引

| 用途 | 路径 |
|------|------|
| API / 错误码 / 迁移 body | [`b-end-flow-admin-guide.md`](./b-end-flow-admin-guide.md) |
| Preset 类型与 catalog | `src/core/workflow/workflow-preset.types.ts`、`workflow-preset.util.ts` |
| Intent 类型与校验 | `src/core/workflow/workflow-intent.types.ts`、`validate-workflow-intent.util.ts` |
| Flow Admin API | `src/modules/flow/` |
| OpenSpec | `openspec/changes/refactor-workflow-intent-ssot/` |

---

## 14. 建议落地分期（缩小与目标差距）

| 期 | 范围 | 验收 |
|----|------|------|
| **P0** | Flow 列表 + Preset 向导创建 + 详情（Intent 展示、IR 折叠）+ Skill/PA 改绑 flowId + 去掉 workflowId | 两条冒烟（页内回填 + Chat 拉数） |
| **P1** | 版本页、flowVersion 钉版本、删除三码提示、迁移三步 | 存量可迁 |
| **P2** | Intent 步骤表单编辑器（有序 always 边 + 属性面板） | 自定义编排不依赖手写 JSON |
| **P3** | Intent 分支边、judge、images 能力表单 | 覆盖复杂场景 |

若当前 B 端仍是「Workflow 节点画布改名」，优先砍画布、上 **P0**，不要在 IR 上继续堆交互。
