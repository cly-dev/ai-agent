# Judge 分支 — 前端配置指南

> **受众**：B 端 Flow 画布前端  
> **范围**：仅 `judge` 节点 + `state` / `default` 出边的配置、校验、回显与保存  
> **总览**：[`b-end-flow-product-canvas-guide.md`](./b-end-flow-product-canvas-guide.md)  
> **类型真源**：`src/core/workflow/workflow-intent.types.ts`  
> **校验真源**：`src/core/workflow/validate-workflow-intent.util.ts`  
> **key 算法**：`src/core/workflow/workflow-intent-state-key.util.ts`

路径前缀以环境为准；下文写 **`/admin/flow`**。若网关无 `/admin`，则对应 `/flow`。

---

## 0. 一句话

运营不写 if / 不写表达式：拖一颗 **判定分流**，从它拉出多条「当…」+ 恰好一条「其他情况」；每条「当…」填 **状态名称** 与 **判定说明**；保存前用 `POST …/state-keys` 把名称换成稳定 `state.key`。

```text
（可选）read ──always──▶ judge ┬─ state:可回答 ──▶ deliver(speak)
                               ├─ state:需变更 ──▶ mutate
                               └─ default ──────▶ deliver(speak)
```

Preset **不含**分支；需要分流必须走画布。

---

## 1. 心智模型

| 概念 | 运营看到 | Intent 真源 | 说明 |
|------|----------|-------------|------|
| 判定节点 | 「判定分流」 | `operation: "judge"` | 只做结构化判定，不执行读/写 |
| 状态分支 | 「当…」连线 | `kind: "state"` + `state.{key,description}` | description **进 LLM**，必填 |
| 兜底 | 「其他情况」 | `kind: "default"` | 零命中才走；有 state 时必须恰好 1 条 |
| 判定口径 | 节点上「判定说明」 | `capabilities.policyHint` | 可选，补充总口径 |

```text
运营填「状态名称」──▶ POST state-keys ──▶ state.key（技术标识）
运营填「判定说明」──▶ 原样写入            ──▶ state.description（模型判定依据）
```

**禁止**：让运营手写 `can_answer` 这类技术 key、省掉 description、在非 judge 上配 state/default、把分支写进 Preset 表单。

---

## 2. 何时用 judge

| 适合 | 不适合 |
|------|--------|
| 先判「属于哪类情况」再走不同后续 | 纯线性「读 → 答 / 填 / 改」（用 Preset） |
| 运营要能读懂的分支名（可回答 / 需变更） | 业务 if 写死在前端代码里 |
| 分支后继是不同 `deliver` / `mutate` | 在节点表单里嵌套条件表达式 |

典型拓扑：

```text
获取数据 → 判定 ┬─ 当「可回答」→ 口头说明
               ├─ 当「需变更」→ 变更确认 →（可选）口头说明
               └─ 其他情况   → 口头说明（或追问类 deliver）
```

---

## 3. 节点：判定分流 `judge`

### 3.1 节点库

| 项 | 约定 |
|----|------|
| 文案 | 判定分流 |
| `operation` | `judge` |
| 建议 `id` | 创建时生成稳定短 id：`judge_1`、`judge_2`…（之后只读） |
| 视觉 | 橙 / 分支图标；摘要如 `3 状态 + 默认` |

### 3.2 属性面板

| UI 文案 | 字段 | 必填 | 控件 |
|---------|------|------|------|
| 名称 | `name` | 否 | 单行 |
| 目标（可选） | `objective` | 否 | 多行 |
| 判定说明 | `capabilities.policyHint` | 否 | 多行：「判定时注意…」 |

面板底部固定提示（不可关）：

> 请从本节点拉出至少一条「当…」边，以及恰好一条「其他情况」边。

### 3.3 节点 JSON 形状

```json
{
  "id": "judge",
  "operation": "judge",
  "name": "判定分流",
  "capabilities": {
    "policyHint": "按是否信息足够可直接回答，或需要用户确认后变更来分流"
  }
}
```

`policyHint` / `objective` 会编译进 IR `structured_output` 的 hint/objective；**分支条件本身在边上**，不在节点里。

### 3.4 节点上不要出现的控件

- 条件表达式、脚本、JSON if
- 状态列表（状态只在出边上配）
- Tool / Host 选择（judge 不读不写）

---

## 4. 连线：从 judge 拉出的边

### 4.1 三种边（画布全局）

| `kind` | 运营文案 | 线型建议 | 何时允许 |
|--------|----------|----------|----------|
| `always` | 然后 | 实线 | 任意 from→to（含进入 judge） |
| `state` | 当… | 虚线 + 状态名 | **仅** `from` 为 `judge` |
| `default` | 其他情况 | 点线 +「其他」 | **仅** `from` 为 `judge` |

进入 judge 的边几乎总是 `always`（例如 `read → judge`）。  
从 judge 出去：**不要用 `always` 当分支**（产品上一般不提供该选项）；用 `state` + `default`。

### 4.2 从 judge 拉线的交互

```text
1. 从 judge 出边锚点拖到目标节点
2. 弹出边类型：
   · 状态分支（state）
   · 其他情况（default）
3. 若选「状态分支」→ 立刻弹出/聚焦边属性：状态名称 + 判定说明
4. 若选「其他情况」→ 无额外字段；同 judge 已有 default 则禁止再建第二条
```

| 手势 | 行为 |
|------|------|
| 从 **judge** 拉出 | 提供 state / default 二选一 |
| 从 **非 judge** 拉出 | **只**提供「然后」(always)；UI 不出现 state/default |
| 点选边 | 打开边属性；`always`↔`state` 仅当 from 仍是 judge 时允许升级 |
| 删除边 | 同步清校验状态；删到只剩 default 无 state 时标红 |

出边锚点：judge 右侧允许多次拉出；非 judge 出边 >1 条时弱警告「通常只需一条『然后』」。

### 4.3 `state` 边字段

| 运营填写 | Intent 字段 | 必填 | UI |
|----------|-------------|------|-----|
| 状态名称（如「可回答」） | `state.key` | 是 | 输入框；**失焦/保存前**经 state-keys 转成技术 key |
| 判定说明（如「信息足够可直接答」） | `state.description` | **是** | 多行；进 LLM，不可省 |

边属性面板建议：

- 展示「状态名称」为主编辑项  
- `state.key`：**只读**展示在次要位置（或完全隐藏，仅排障折叠可见）  
- 「判定说明」必填校验，空则边上标红并禁止保存  

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

### 4.4 `default` 边字段

无额外字段。旁注文案：

> 以上状态都未命中时走这里。

```json
{
  "id": "e_fallback",
  "from": "judge",
  "to": "answer",
  "kind": "default"
}
```

### 4.5 硬规则（与服务端一致）

| 规则 | 服务端 code | 前端提示建议 |
|------|-------------|--------------|
| `state` / `default` 的 `from` 必须是 judge | `branch_edge_not_from_judge` | 分支只能从判定拉出 |
| 某 judge 有 ≥1 条 state ⇒ **恰好 1** 条 default | `judge_missing_default` | 请添加「其他情况」 |
| 某 judge 仅有 default、无 state | `judge_default_without_state` | 请先添加「当…」或去掉默认边 |
| state 缺 `key` 或 `description`（空串也算缺） | `missing_state` | 请填写状态名称与判定说明 |
| 同一 judge **两条** default | （落在 `judge_missing_default`：defaults.length !== 1） | 每个判定只能有一条「其他情况」 |
| 边 from/to 不在 steps | `unknown_from` / `unknown_to` | 连线目标无效 |
| 自环 | 前端禁止 | 不能连回自己 |

**推荐产品策略**：画布上只要存在 `judge` 节点，保存时要求其已配齐「≥1 state + 1 default」（与面板提示一致）。服务端对「完全没有出边的 judge」当前不单独报错，但运行无意义——前端应挡。

弱提示（不挡保存）：运行时 state **可多选命中扇出**；default **仅零命中**时走。

---

## 5. 状态 key：`POST /admin/flow/intent/state-keys`

### 5.1 为何要调

运营填的是自然语言「可回答」；Intent 需要稳定、可去重的 `state.key`。  
**不要**让运营直接编辑技术 key；**不要**前端自创与服务端不一致的 slug（除非本地实现与 `slugWorkflowIntentStateKey` 完全一致——仍推荐走 API）。

### 5.2 请求 / 响应

```http
POST /admin/flow/intent/state-keys
Content-Type: application/json

{ "labels": ["可回答", "需变更", "可回答"] }
```

```json
{
  "status": 0,
  "message": "ok",
  "data": {
    "keys": ["s_xxxx", "s_yyyy", "s_xxxx_2"]
  }
}
```

（实际包络以现网为准；`data.keys` 与 `labels` **等长、同序**。）

同批重复 label 自动 `_2` / `_3`。纯中文等无 ASCII 时服务端生成 `s_<hash>`。

### 5.3 前端调用时机（推荐）

| 时机 | 做法 |
|------|------|
| 状态名称 **失焦** | 对该边单独 `labels: [name]`，写回该边 `state.key` |
| **保存前** | 收集本画布所有 state 边的状态名称，**一次批量** allocate，按序写回（避免同画布撞 key） |
| 仅改 description、名称未变 | 可跳过 allocate |

批量保存前示例：

```ts
const stateEdges = edges.filter((e) => e.kind === 'state');
const labels = stateEdges.map((e) => e._uiLabel /* 运营看到的名称 */);
const { keys } = await postStateKeys({ labels });
stateEdges.forEach((e, i) => {
  e.state = {
    key: keys[i]!,
    description: e.state!.description.trim(),
  };
});
```

**回显**：`GET` 回来的已有 `state.key`；若产品要显示「状态名称」，可：

- 把上次输入的 label 存在前端 layout/本地（**勿写入 intent**），或  
- 直接用 `state.key` 只读展示 + 完整展示 `description`（更简单、与 SSOT 一致）

产品 canvas 总指南推荐：description 显示为「判定说明」；key 隐藏或只读。

### 5.4 空名称

空 / 纯空白 label 不要请求；前端直接校验「请填写状态名称」。

---

## 6. 完整保存载荷示例

画布创建 / 更新时 body 带 `intent`（**不要**同时带 `preset`）。`profile` 固定 `"shared"`。

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
        "name": "判定分流",
        "capabilities": {
          "policyHint": "按是否可直接回答分流"
        }
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
      {
        "id": "e3",
        "from": "judge",
        "to": "answer",
        "kind": "default"
      }
    ]
  }
}
```

| API | 路径 |
|-----|------|
| 创建 | `POST /admin/flow` |
| 更新画布 | `PATCH /admin/flow/:id` + `intent` |
| 回显 | `GET /admin/flow/:id` → `data.intent` |

节点坐标 / 缩放：**禁止**写入 `intent`；放前端 layout 或独立字段。

---

## 7. 前端可抄类型（judge 相关）

```ts
type JudgeStep = {
  id: string;
  operation: 'judge';
  name?: string;
  objective?: string;
  capabilities?: { policyHint?: string };
};

type StateEdge = {
  id: string;
  from: string; // 必须是某 judge 的 id
  to: string;
  kind: 'state';
  state: { key: string; description: string };
};

type DefaultEdge = {
  id: string;
  from: string; // 必须是某 judge 的 id
  to: string;
  kind: 'default';
};
```

完整 `Intent` 以 `workflow-intent.types.ts` 为准。

---

## 8. 保存前校验函数（建议前端实现）

对每个 `operation === 'judge'` 的 step：

```ts
function validateJudgeFanout(steps, edges) {
  const issues = [];
  const judgeIds = new Set(
    steps.filter((s) => s.operation === 'judge').map((s) => s.id),
  );

  for (const e of edges) {
    if (e.kind !== 'state' && e.kind !== 'default') continue;
    if (!judgeIds.has(e.from)) {
      issues.push({ code: 'branch_edge_not_from_judge', edgeId: e.id });
    }
  }

  for (const judgeId of judgeIds) {
    const outs = edges.filter((e) => e.from === judgeId);
    const states = outs.filter((e) => e.kind === 'state');
    const defaults = outs.filter((e) => e.kind === 'default');

    if (states.length === 0) {
      issues.push({ code: 'judge_needs_branches', judgeId }); // 产品层推荐
    } else if (defaults.length !== 1) {
      issues.push({ code: 'judge_missing_default', judgeId });
    }

    if (states.length === 0 && defaults.length > 0) {
      issues.push({ code: 'judge_default_without_state', judgeId });
    }

    for (const e of states) {
      if (!e.state?.key?.trim() || !e.state?.description?.trim()) {
        issues.push({ code: 'missing_state', edgeId: e.id });
      }
    }
  }
  return issues;
}
```

校验失败：禁止保存；节点/边标红；顶栏汇总条可点击定位到问题 judge 或边。

服务端仍会二次校验；对齐展示 `data.issues[].code`。

---

## 9. 回显与编辑

| 来源 | 做法 |
|------|------|
| `GET …/flow/:id` → `intent.steps` | `operation==="judge"` → 判定节点 + policyHint |
| `intent.edges` | `kind===state|default` 且 from 为该 judge → 出边 |
| `data.ir` | 只读折叠；可见 `structured_output` + `when`/`default` 边，**禁止反编编辑** |

编辑已有 Flow：

1. 改 policyHint → 直接改 step  
2. 改判定说明 → 改 `state.description`  
3. 改状态名称 → 更新 UI label → 再 allocate key（注意同画布去重）  
4. 增删分支 → 维护 default 唯一性后再保存  

「用 Preset 重建」会覆盖整个 Intent（含 judge）；二次确认文案需写明分支会丢失。

---

## 10. 运行时（前端只需知道结果）

编译大致：

```text
judge step
  → IR node: structured_output（hint = policyHint）
  → 出边: state → IR kind=when（when=key, whenDescription=description）
  → 出边: default → IR kind=default
```

运行：模型按各边的 key + description（及 policyHint）做结构化判定 → 命中走对应分支；**全部未命中**走 default。

前端配置面 **不要** 暴露 `detect_clues` / `structured_output` / `when` 等旧词或 IR 词。

---

## 11. UI 文案对照表

| 位置 | 推荐文案 |
|------|----------|
| 节点库 | 判定分流 |
| 节点摘要 | `{n} 状态 + 默认` / `未配置分支` |
| 边类型 · state | 当… |
| 边类型 · default | 其他情况 |
| 边标签 · state | 状态名称（或 description 截断） |
| 边标签 · default | 其他 |
| 边字段 | 状态名称 / 判定说明 |
| 节点字段 | 判定说明（policyHint） |
| 缺 default | 请添加「其他情况」连线 |
| 缺 description | 请填写判定说明（模型需要） |
| 非 judge 分支 | （不提供入口） |

---

## 12. 验收清单

- [ ] 节点库有且仅有 Intent 四节点之一的「判定分流」=`judge`
- [ ] judge 属性仅 name / objective / policyHint；无表达式编辑器
- [ ] 从 judge 拉线可选「当…」/「其他情况」；非 judge 只有「然后」
- [ ] state：状态名称 + 判定说明；description 空禁止保存
- [ ] 失焦或保存前调用 `POST /admin/flow/intent/state-keys`
- [ ] 有 state 时强制恰好 1 条 default；两条 default 禁止
- [ ] 仅 default 无 state 禁止保存
- [ ] 校验 code 与服务端对齐并可定位到节点/边
- [ ] 保存 / 回显完整 intent；layout 不进 intent
- [ ] 详情只读拓扑可看到多条虚线 + 一条「其他」
- [ ] 不在 Preset 三卡里做分支配置

---

## 13. 禁止项（Review 打回）

1. 非 judge 配置 `state` / `default`  
2. 运营手写技术 `state.key`、省掉 `state.description`  
3. judge 出边用多条 `always` 冒充分支  
4. 条件表达式 / 脚本节点 / 旧 `detect_clues` 配置面  
5. 节点坐标写入 `intent`  
6. 同时提交 `preset` 与含 judge 的 `intent`  
7. 把 IR `when` / `structured_output` 当编辑真源  

---

## 14. 相关文档

| 文档 | 内容 |
|------|------|
| [`b-end-flow-product-canvas-guide.md`](./b-end-flow-product-canvas-guide.md) | 画布总接入（含 §5.3 / §6 摘要） |
| [`b-end-flow-intent-editor-ux.md`](./b-end-flow-intent-editor-ux.md) | 画布 UX 分期与交互细节 |
| [`b-end-flow-capabilities-and-scenarios.md`](./b-end-flow-capabilities-and-scenarios.md) | 能力与场景（§2.3 / §4.6） |
| [`b-end-flow-admin-guide.md`](./b-end-flow-admin-guide.md) | Admin API 细节 |
