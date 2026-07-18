# Flow 产品配置指南（前端接入）

> **受众**：B 端前端 / 产品 / 实施  
> **定位**：Preset + 画布的现行约定与接入清单（可直接开工）  
> **API 细节**：[`b-end-flow-admin-guide.md`](./b-end-flow-admin-guide.md)  
> **类型真源**：`src/core/workflow/workflow-intent.types.ts` · `workflow-preset.types.ts`

路径前缀以环境为准；下文写 **`/admin/flow`**（与现网 Admin 一致）。若网关无 `/admin` 前缀，则对应 `/flow`。

---

## 0. 前端要交付什么

| 页面 | 必须有 |
|------|--------|
| Flow 创建向导 | 三张 Preset 卡 +「使用画布」入口 |
| Flow 画布编辑器 | 四节点 + 连线（含 judge 分支） |
| Flow 详情 | 只读拓扑；编辑 / Preset 重建 |
| Skill / PageAction | 只绑 `flowId`（不选 profile、不绑旧 workflowId） |

配置真源是 **Intent**（或 Preset 展开成 Intent）。**不要**让运营编辑 IR / 旧 action 图。

---

## 1. 心智

```text
优先 Preset 三场景 → 不够再画布（4 节点 + 连线）
保存 = intent  或  preset+presetConfig（二选一，勿同时传）
服务端 compile → IR；运营不碰 IR / 旧 Workflow
Skill / PageAction 绑同一套 Flow；产品不选 profile
```

| 入口 | 做什么 |
|------|--------|
| PageAction | 绑 `flowId`，页内触发 |
| Skill | 绑 `flowId`，会话触发 |

创建 / 保存 Flow：`profile` **固定传 `shared`**（UI **不展示**选择器）。  
`deliverable` **不要传**（服务端有默认即可）。

---

## 2. 页面结构

### 2.1 创建向导

```text
Step1  名称 / flowKey / 描述（无 deliverable、无 profile）
Step2  三张 Preset 卡  或  「使用画布」
Step3a Preset：按 catalog 动态表单填 Tool → 保存
Step3b 画布：进编辑器 → 保存 intent
```

### 2.2 画布页

```text
左：节点库 ×4 │ 中：画布 │ 右：属性（节点 / 边）
顶栏：名称 · 设入口 · 保存 · 校验提示
```

- 节点 **坐标 / 缩放** 只放前端本地或独立 layout 字段，**禁止写入 `intent`**。
- `entryStepId`：顶栏「设为入口」或默认第一个节点。

### 2.3 详情

- 只读拓扑（可用 GET 回的 `intent.steps/edges` 渲染）
- 「编辑画布」→ 编辑器（PATCH `intent`）
- 「用 Preset 重建」→ 二次确认后 PATCH `preset` + `presetConfig`（会覆盖 Intent）
- `ir` / 原始 `intent` JSON：折叠只读（研发排障）

---

## 3. API 速查（前端必调）

| 用途 | 方法 | 路径 |
|------|------|------|
| Preset 三卡目录 | `GET` | `/admin/flow/presets/catalog` |
| 状态 key 分配 | `POST` | `/admin/flow/intent/state-keys` |
| 列表 | `GET` | `/admin/flow/by-app-client/:appClientId` |
| 详情（回显） | `GET` | `/admin/flow/:id` |
| 创建 | `POST` | `/admin/flow` |
| 更新 | `PATCH` | `/admin/flow/:id` |
| 绑 Skill | `PATCH` | Skill Admin（`flowId` / `flowVersion`） |
| 绑 PageAction | `PATCH` | PageAction Admin（`flowId` / `flowVersion`） |

成功包络一般：`{ status, message, data }`。校验失败看 `data.code` / `data.message` / `data.issues`。

---

## 4. Preset 三卡

### 4.1 拉目录

```http
GET /admin/flow/presets/catalog
```

返回 **恰好 3 项**（无兼容 kind）：

| kind | 卡片文案 | requiredConfig | optionalConfig | 展开 |
|------|----------|----------------|----------------|------|
| `page_auto_fill` | 页内回填 | `hostToolId` | `readToolId` | `read?` → `deliver(fill)`，**无 speak** |
| `fetch_and_answer` | 拉数作答 | `readToolId` | — | `read` → `deliver(speak)` |
| `mutation_submit` | 变更提交 | `writeToolId` | `readToolId`, `explainBeforeConfirm`, `summarizeAfter` | 标准 mutate |

**分支（judge）不进 Preset** → 走画布。

### 4.2 动态表单

按 `requiredConfig` / `optionalConfig` 渲染：

| 键 | UI | 说明 |
|----|-----|------|
| `hostToolId` | HostTool 单选 | 填页 |
| `readToolId` | HTTP 读 Tool 单选 | 可选/必填看 catalog |
| `writeToolId` | 写 Tool 单选 | 变更 |
| `explainBeforeConfirm` | 高级开关，默认关 | 确认前说明 |
| `summarizeAfter` | 高级开关，默认关 | 写后口头说明 |

变更卡：**主表单只露出写工具 + 可选预读**；两个说明开关放「高级」。

### 4.3 创建（Preset）

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

不要传 `objectives` / `summarizeMode` / `confirmKind` 等已删除字段。

### 4.4 Preset 重建

详情页「用 Preset 重建」：再次 `PATCH` 完整 `preset` + `presetConfig`（DB **不存** Preset 名）。二次确认文案需说明会覆盖当前画布 Intent。

---

## 5. 画布节点（白名单）

### 5.1 节点库

| 节点文案 | `operation` |
|----------|-------------|
| 获取数据 | `read` |
| 判定分流 | `judge` |
| 交付 | `deliver` |
| 变更确认 | `mutate` |

公共可选：`name`、`objective`。`id` 创建后只读（建议前端生成稳定短 id，如 `read_1`）。

### 5.2 获取数据 `read`

| UI | 字段 | 校验 |
|----|------|------|
| 读工具多选 | `slots.readToolIds` | 与识图 **至少一个** |
| 开启图片识别 | `capabilities.images.enabled` | |
| 图片来源 | `capabilities.images.from` | 开了才显示：`upstream` \| `page_context` \| `all` |
| 识别说明 | `capabilities.images.hint` | 开了才显示 |

### 5.3 判定分流 `judge`

| UI | 字段 |
|----|------|
| 判定说明 | `capabilities.policyHint` |

**状态边**见 §6（不在节点表单里手写 key）。

### 5.4 交付 `deliver`

| UI | 字段 | 校验 |
|----|------|------|
| 口头 / 填页 | `channel`: `speak` \| `fill` | 必选 |
| Host 多选 | `slots.fillHostToolIds` | `fill` 时必填 |

### 5.5 变更确认 `mutate`

**标准路径**：组参 → 审批卡 → 执行（无散文说明）。

| UI | 字段 | 主表单 |
|----|------|--------|
| 写工具 | `slots.writeToolId` | ✅ 必填 |
| 写前预读 | `slots.readToolIds` | ✅ 可选 |
| 确认前说明 | `explainBeforeConfirm` | ❌ 仅「高级」，默认不传 / false |
| 写后口头说明 | `summarizeAfter` | ❌ 仅「高级」，默认不传 / false |

不要把 mutate 拆成多颗「确认链」节点。

---

## 6. 连线与 judge 分支

### 6.1 边类型

| kind | 文案 | 规则 |
|------|------|------|
| `always` | 然后 | 任意 from→to |
| `state` | 当… | **仅**从 `judge`；必填 `state.key` + `state.description` |
| `default` | 其他情况 | **仅**从 `judge`；有任意 state 时必须恰好 1 条 |

### 6.2 画布操作

```text
1. 拖入「判定分流」
2. 从判定拉出多条「当…」到不同后继
3. 每条填：状态名称 + 判定说明
4. 再拉一条「其他情况」到兜底
5. 保存前校验（见 §8）
```

```text
获取数据 → 判定 ┬─ 当「可回答」→ 口头说明
               ├─ 当「需变更」→ 变更确认
               └─ 其他情况   → 口头说明
```

### 6.3 状态 key（禁止运营手写技术 key）

| 运营填写 | 写入 Intent |
|----------|-------------|
| 状态名称（如「可回答」） | `state.key` |
| 判定说明（如「信息足够可直接答」） | `state.description`（**必填**，进 LLM） |

**推荐**：失焦 / 保存前调用：

```http
POST /admin/flow/intent/state-keys
{ "labels": ["可回答", "需变更", "可回答"] }
```

```json
{ "keys": ["s_xxxx", "s_yyyy", "s_xxxx_2"] }
```

同批冲突自动 `_2` / `_3`。也可本地实现与服务端相同的 slug（`workflow-intent-state-key.util.ts`），但以 API 为准更省事。

**不要**省掉 `description`（否则模型只能看到无意义 key）。

### 6.4 Intent 边示例

```json
{
  "id": "e_can_answer",
  "from": "judge",
  "to": "answer",
  "kind": "state",
  "state": {
    "key": "can_answer",
    "description": "信息足够，可直接口头回答"
  }
}
```

运行时：`judge` → 按边上的 key/description 判定；命中走对应分支，零命中走 `default`。

---

## 7. Intent 保存与回显

### 7.1 创建 / 更新（画布）

```json
{
  "appClientId": 2,
  "flowKey": "skill.order.branch",
  "name": "订单分流",
  "profile": "shared",
  "intent": {
    "version": 1,
    "profile": "shared",
    "entryStepId": "read",
    "steps": [
      {
        "id": "read",
        "operation": "read",
        "name": "获取数据",
        "slots": { "readToolIds": [101] }
      },
      {
        "id": "judge",
        "operation": "judge",
        "capabilities": { "policyHint": "按是否可直接回答分流" }
      },
      {
        "id": "answer",
        "operation": "deliver",
        "channel": "speak",
        "name": "口头说明"
      },
      {
        "id": "change",
        "operation": "mutate",
        "slots": { "writeToolId": 9 }
      }
    ],
    "edges": [
      { "id": "e0", "from": "read", "to": "judge", "kind": "always" },
      {
        "id": "e1",
        "from": "judge",
        "to": "answer",
        "kind": "state",
        "state": {
          "key": "can_answer",
          "description": "信息足够，可直接口头回答"
        }
      },
      {
        "id": "e2",
        "from": "judge",
        "to": "change",
        "kind": "state",
        "state": {
          "key": "need_mutate",
          "description": "需要用户确认后提交变更"
        }
      },
      { "id": "e3", "from": "judge", "to": "answer", "kind": "default" }
    ]
  }
}
```

更新画布：`PATCH /admin/flow/:id`，body 带 `intent`（不要同时带 `preset`）。

### 7.2 回显

`GET /admin/flow/:id` → 用 `data.intent` 还原节点与边；`data.ir` 只读折叠。  
编辑回填：`state.description` 显示为「判定说明」；`state.key` 可隐藏或只读展示。

### 7.3 TypeScript 形状（前端可抄）

```ts
type Operation = 'read' | 'judge' | 'deliver' | 'mutate';
type EdgeKind = 'always' | 'state' | 'default';

type Intent = {
  version: 1;
  profile: 'shared'; // 产品固定
  entryStepId: string;
  steps: Array<{
    id: string;
    operation: Operation;
    name?: string;
    objective?: string;
    channel?: 'speak' | 'fill'; // deliver
    slots?: {
      readToolIds?: number[];
      fillHostToolIds?: number[];
      writeToolId?: number;
    };
    capabilities?: {
      images?: { enabled: boolean; from?: string; hint?: string };
      policyHint?: string;
    };
    explainBeforeConfirm?: boolean; // mutate 高级
    summarizeAfter?: boolean;       // mutate 高级
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    kind?: EdgeKind;
    state?: { key: string; description: string };
  }>;
};
```

完整类型以仓库 `workflow-intent.types.ts` 为准。

---

## 8. 前端校验（保存前必挡）

| 规则 | 提示建议 |
|------|----------|
| `steps` 非空；`entryStepId` 存在于 steps | 请设置入口 |
| step / edge `id` 不重复 | ID 冲突 |
| `read`：无 `readToolIds` 且未开识图 | 请选择读工具或开启识图 |
| `deliver` + `fill`：无 Host | 请选择 Host 工具 |
| `mutate`：无 `writeToolId` | 请选择写工具 |
| `state` / `default` 的 `from` 必须是 `judge` | 分支只能从判定拉出 |
| 某 judge 有 `state` ⇒ 恰好 1 条 `default` | 请添加「其他情况」 |
| 某 judge 仅有 `default` 无 `state` | 请先添加「当…」或去掉默认边 |
| `state` 缺 `key` 或 `description` | 请填写状态名称与判定说明 |

服务端可能返回的 code（对齐展示）：

- `judge_missing_default`
- `judge_default_without_state`
- `branch_edge_not_from_judge`
- `missing_state`

---

## 9. 绑定入口

### Skill / PageAction

```json
{ "flowId": 12, "flowVersion": null }
```

- `flowVersion: null` → 跟随 Flow head  
- 禁止新绑 `workflowId`（旧字段仅迁移清空）  
- UI **不**提供 profile / deliverable /「选 Workflow」  

创建 Flow 与绑定可分两步：先建 Flow，再在 Skill/PageAction 表单选该 `flowId`。

---

## 10. 禁止项（Code Review 打回）

- UI 展示 / 选择 `profile`、`deliverable`
- 页内 Preset 自动加口头说明（产品已去掉）
- 编辑 IR / 旧 action 节点 /「加载 pageContext」节点
- mutate 拆成多颗确认链节点
- 非 judge 上配 `state` / `default`
- 运营手写技术 `state.key`、省掉 `description`
- 节点坐标写入 `intent`
- 同时传 `preset` 与 `intent`

---

## 11. 前端接入检查清单

- [ ] `GET presets/catalog` 渲三卡；表单跟 `required/optionalConfig`
- [ ] 页内回填：无自动 speak；Host 必填、读 Tool 可选
- [ ] 变更：说明开关在高级区，默认关
- [ ] 创建固定 `profile: "shared"`
- [ ] 画布四节点 + always / state / default
- [ ] judge：多状态 + 默认；`POST state-keys`；description 必填
- [ ] 保存前前端校验对齐 §8
- [ ] Skill / PageAction 只绑 `flowId`
- [ ] 详情可编辑画布；Preset 重建有二次确认
- [ ] layout 坐标不进 intent

服务端已具备：三卡目录、state-keys、judge description 贯通、Plan A native-direct（回填/作答/judge）。

---

## 12. 一句话

| 问 | 答 |
|----|----|
| Preset？ | 回填 / 作答 / 变更 三张 |
| 页内回填？ | 只填页，可选拉数 |
| 变更？ | 组参 → 审批 → 执行 |
| 分支？ | 画布 `judge` + state/default（description 必填） |
| 绑定？ | 只 `flowId`，profile 固定 `shared` |

### 运行时（研发，前端可忽略）

Plan A：`Intent → IR → execute`。1:1 节点（回填 / 作答 / judge / **标准变更**）走 `ir_native_direct`；`explainBeforeConfirm` 等多子步仍 materialize。
