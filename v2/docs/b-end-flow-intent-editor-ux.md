# Intent 画布编排交互指南

> **受众**：B 端管理台前端 / 产品  
> **范围**：Flow **Intent 画布**（高级路径；Preset 向导仍是主创建路径）  
> **配置真源**：Intent `steps` + `edges`（四种 operation），**禁止**拖 IR / 旧 action  
> **配套**：能力语义 → [`b-end-flow-capabilities-and-scenarios.md`](./b-end-flow-capabilities-and-scenarios.md)；整体页面 → [`b-end-flow-frontend-ux.md`](./b-end-flow-frontend-ux.md)；API → [`b-end-flow-admin-guide.md`](./b-end-flow-admin-guide.md)

---

## 0. 定调

| 正确 | 错误 |
|------|------|
| 画布节点 = `read` / `judge` / `deliver` / `mutate` | 画布节点 = `fetch_data` / `summarize_images` / `detect_clues`… |
| 边 = `always` / `state` / `default` | 边 = 任意表达式 / 代码 if |
| 识图 = `read` 上的能力开关 | 独立「识图」节点 |
| pageContext 运行时注入 | 「加载上下文」节点 |
| `mutate` = 一颗业务节点（编译展开确认链） | 画布上拆 present / await / write |

一句话：

```text
运营从左侧拖业务节点 → 连线 → 点节点填右侧表单
→ 前端组装 intent → POST/PATCH → 服务端 compile
```

JSON / IR **仅研发排障**，不是主编辑面。

---

## 1. 何时进画布

| 入口 | 场景 |
|------|------|
| 创建向导「使用高级 Intent」 | Preset 不够（分支、识图、多 Host、自定义拓扑） |
| 详情「编辑 Intent」 | 改编排真源 |
| 「用 Preset 重建」 | **离开画布**，走 Preset 表单后整单覆盖 |

与 Preset **互斥**：Intent 模式只提交 `intent`；Preset 模式只提交 `preset` + `presetConfig`。  
`profile` 创建时选定，编辑时 **只读**。

---

## 2. 页面布局

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ 顶栏：名称 · profile(只读) · [设为入口] · 校验摘要 · [保存] · ⋮            │
├────────────┬─────────────────────────────────────────────┬───────────────┤
│ 节点库     │              画 布                          │ 属性面板      │
│            │                                             │               │
│ ▸ 获取数据 │   ○入口                                      │ 按选中节点    │
│   read     │    │                                        │ / 选中边      │
│ ▸ 判定分流 │   [read] ──always──▶ [judge]                │ 切换表单      │
│   judge    │                    ╱ state:ok               │               │
│ ▸ 交付     │                   ╱                         │               │
│   deliver  │              [speak]    [mutate]            │               │
│ ▸ 变更确认 │                   ╲                         │               │
│   mutate*  │                    ╲ default                │               │
│            │                                             │               │
│ *page_action│  空白双击 / 拖入放置                         │               │
│  库中隐藏  │  小地图 · 缩放 · 自动布局(可选)               │               │
└────────────┴─────────────────────────────────────────────┴───────────────┘
│ 底栏：未连线 / 缺 default / 校验 issues（可点定位到节点）                  │
│ ▸ 高级：原始 Intent（只读 JSON）· IR 预览（只读）                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 节点目录（画布上只这四种）

画布节点卡片展示：`name`（主标题）+ operation 徽章 + 一行摘要（工具数 / 通道 / 分支数）。

| 节点 | operation | 运营文案 | 何时用 | 出边规则 |
|------|-----------|----------|--------|----------|
| **获取数据** | `read` | 拉接口和/或识图 | 取证 | 通常 1 条 `always`；可多后继（少见） |
| **判定分流** | `judge` | 按状态走不同路 | 多分支 | **≥1 条 `state` + 恰好 1 条 `default`**（有 state 时） |
| **交付** | `deliver` | 说话或填页 | 对人输出 | 通常 0～1 条 `always`（终态常无后继） |
| **变更确认** | `mutate` | 确认后写业务 | **仅 Skill/Chat** | 通常 0～1 条 `always`；**PageAction 上下文节点库不出现** |

### 3.1 不要做成节点的东西

| 需求 | 做法 |
|------|------|
| 识图 | `read` 属性里开「图片识别」 |
| 口头说明 vs 填页 | `deliver` 属性里选 `channel`（`speak` / `fill`） |
| 确认 / 展示草稿 / 写入 | 全在 `mutate` 一颗节点内（服务端展开） |
| 加载页面上下文 | **无**；C 端请求自带 |
| 条件表达式 | **无**；用 `judge` + `state` 边的 key/description |

### 3.2 节点视觉建议

| operation | 色/图标语义 | 卡片摘要示例 |
|-----------|-------------|--------------|
| `read` | 蓝 / 数据 | `Tool×2 · 识图开` |
| `judge` | 橙 / 分支 | `3 状态 + 默认` |
| `deliver` speak | 绿 / 对话 | `说明 · final` |
| `deliver` fill | 青 / 推送 | `Host×1` |
| `mutate` | 紫 / 写入 | `写工具 #33` |

入口节点：左侧小圆点「入口」或描边强调；可用顶栏「设为入口」或节点右键。

---

## 4. 画布交互

### 4.1 添加 / 放置

| 操作 | 行为 |
|------|------|
| 从节点库拖入 | 落点创建；生成稳定 `id`（`read_1`、`judge_1`…） |
| 空白双击 | 弹出四选一（受 profile 过滤） |
| 复制节点 | 新 id；**不**复制入边；出边不复制 |
| 删除节点 | 删除节点 + 所有相关边；若删的是 entry → 自动把入度为 0 的候选或创建时间最早的设为 entry，并 toast 提示 |

### 4.2 选中与属性

| 选中 | 右侧面板 |
|------|----------|
| 节点 | §5 对应 operation 表单 |
| 边 | §6 边表单（类型、state key/description） |
| 空白 | 画布级：入口说明、校验总览 |

切换 `operation`：二次确认后清空不兼容字段（或禁止切换，只能删再建——推荐 **禁止切换**，避免边语义错乱）。

### 4.3 连线

| 手势 | 行为 |
|------|------|
| 从节点右侧锚点拖到另一节点左侧 | 创建边；默认 `kind: always` |
| 从 **judge** 拉出 | 弹出边类型：`状态分支` / `其他情况`；选状态则立刻填 key+description |
| 点边 | 可改 kind；`always`↔`state` 仅当 from 是 judge 时允许升为 state |
| 删除边 | Delete / 右键 |

**锚点约定（降低乱连）：**

- 每个节点：左 = 入，右 = 出  
- `judge` 右侧可多个出边锚点（或一个锚点多次拉）  
- 非 judge 节点：出边超过 1 条时弱警告「通常只需一条『然后执行』」

### 4.4 入口

- `entryStepId` = 画布标记的入口节点  
- 保存前：入口必须存在且在 steps 内  
- 建议：无入边的节点高亮为「可作为入口」；新建第一个节点自动当入口

### 4.5 布局与辅助

- 平移 / 缩放 / 对齐辅助线  
- 「整理布局」可选（Sugiyama 或简单分层：按从入口 BFS）  
- 小地图可选  
- **不要**自动把线性拓扑藏成列表——画布即真源；线性 Flow 也是一串 always

### 4.6 与「线性自动边」的关系

画布模式下：**边由用户连线产生**，不要在保存时按列表顺序悄悄重写 edges（会毁掉分支）。  
仅当「从 Preset 导入 / 一键转线性」时批量生成 always 链。

---

## 5. 节点属性面板（与 API 字段对齐）

### 5.1 公共

| 字段 | 控件 |
|------|------|
| `name` | 单行（卡片标题） |
| `id` | 创建后只读（或高级折叠可改，改前警告断边） |
| `objective` | 多行 |

### 5.2 `read`

| 字段 | 控件 |
|------|------|
| `slots.readToolIds` | Tool 多选（同 AppClient） |
| `completeWhen` | 首次成功 / 拉全部分页 |
| 图片识别 | 开关 + `from` / `hint` / `onFailure`；高级折叠网格与缓存 |

校验：无 Tool 且未开识图 → 节点标红，禁止保存。

### 5.3 `judge`

| 字段 | 控件 |
|------|------|
| `capabilities.policyHint` | 多行：「判定时注意…」 |

分支 **不在节点内写 if**：出边在画布上配置。  
面板底部固定提示：

> 请从本节点拉出「状态」边与一条「其他情况」边。

无 state 出边时：保存警告或禁止（推荐：**有 judge 就必须配齐 state+default**）。

### 5.4 `deliver`

先两大通道卡片：

| 卡片 | `channel` | 后续 |
|------|-----------|------|
| 口头说明 | `speak` | `summarizeMode`、`stream` |
| 填入页面 | `fill` | HostTool 多选（必填） |

卡片摘要随 channel 变色（§3.2）。

### 5.5 `mutate`（仅 Skill / Chat）

| 字段 | 控件 |
|------|------|
| `slots.writeToolId` | Tool 单选（必填） |
| `slots.readToolIds` | 写前预读，多选可选 |

说明条：系统固定展开「组参 → 审批卡 → 写入」。**无**确认前说明 / 写后总结 / 免确认开关（写入策略由绑定入口派生，见产品画布指南 §1.1）。

不要展示或提交：`explainBeforeConfirm`、`summarizeAfter`、`presentMode`、`confirmKind`、`skipConfirm`。

---

## 6. 边（连线）语义

| kind | 运营文案 | 标签展示 | 何时允许 |
|------|----------|----------|----------|
| `always` | 然后执行 | 实线无文案或「然后」 | 任意 from→to |
| `state` | 当状态为… | 虚线 + `key` | **仅** from=`judge`；必填 `state.key` + `state.description` |
| `default` | 其他情况 | 点线 +「其他」 | **仅** from=`judge`；每个 judge **恰好 0 或 1** 条；有 state 时必须 1 |

### 6.1 边属性面板

- `always`：只显示 from → to（只读）+ 删除  
- `state`：`key`（短标识，如 `can_answer`）+ `description`（给模型看的判定说明，必填）  
- `default`：无额外字段；文案说明「以上状态都未命中时走这里」

### 6.2 硬校验（前端先挡，与服务端一致）

| 规则 | code / 提示 |
|------|-------------|
| judge 有任意 state → 必须恰好 1 条 default | `judge_missing_default` |
| state 缺 key/description | `missing_state` |
| PageAction 画布出现 mutate | 产品约定打回（入口定策略）；勿用 profile 闸门凑合 |
| fill 无 Host | `missing_host_tools` |
| 边的 from/to 不存在 | 禁止保存 |
| 多节点但 edges 为空 | `missing_edges` |
| 自环 | 禁止 |
| 从非 judge 拉出 state/default | 禁止（UI 不提供选项） |

运行时提醒（弱提示即可）：`state` 可多选命中扇出；`default` 仅零命中时走。

---

## 7. 典型拓扑（给实施对照）

### 7.1 线性填页

```text
(entry) read ──always──▶ deliver(fill)
```

### 7.2 线性问答

```text
(entry) read ──always──▶ deliver(speak)
```

### 7.3 分支（核心）

```text
(entry) read ──always──▶ judge
                          ├─ state:can_answer ──▶ deliver(speak)
                          ├─ state:need_change ──▶ mutate ──always──▶ deliver(speak)
                          └─ default ──────────▶ deliver(speak)
```

### 7.4 仅识图后填页

```text
(entry) read(无 Tool，识图开，from=page_context) ──always──▶ deliver(fill)
```

---

## 8. 保存 / 回显 / 载荷

### 8.1 画布 → Intent

```typescript
// 伪结构：与 workflow-intent.types.ts 对齐
{
  version: 1,
  profile,           // 只读来自 Flow
  entryStepId,       // 入口节点 id
  steps: Node[],     // 每节点一个 step
  edges: Edge[],     // 画布每条边一条
}
```

节点位置（x/y）**不要**写入 Intent SSOT（服务端不存）；可另存 `ui.layout` 到前端本地 / 若后端要存需另开字段，**不得**塞进 `intent` 污染 compile。

### 8.2 API

- 创建：`POST /admin/flow` + `intent`  
- 更新：`PATCH /admin/flow/:id` + `intent`（+ 可选 `changeNote`）→ version+1  

### 8.3 回显

- `GET /flow/:id` 的 `intent` → 还原节点与边  
- layout：有则用；无则自动分层布局  
- IR 区只读折叠；禁止从 IR 反编编辑  

---

## 9. 分期验收（画布）

| 期 | 范围 | 验收 |
|----|------|------|
| **C0** | 四节点库 + always 连线 + 属性面板 + 保存回显 | 线性 read→deliver / mutate(chat) 可跑通 |
| **C1** | read 识图；PageAction 上下文隐藏 mutate | 页内识图 Flow 可配 |
| **C2** | judge + state/default 边 UI + 校验高亮 | 多分支可配且 default 强制 |
| **C3** | 校验定位、入口手势、自动布局、只读 JSON/IR | 实施与排障友好 |

---

## 10. 禁止事项（Review）

1. 节点库出现 IR / 旧 action 名  
2. 独立识图节点、加载 pageContext 节点  
3. 把 mutate 拆成多颗确认链节点  
4. 在非 judge 上配置 state/default  
5. 保存时用「列表顺序」覆盖用户画的边  
6. 主路径可编辑大段 JSON  
7. PageAction 上下文可拖出 mutate / 给 mutate 加免确认
8. 同时提交 `preset` 与 `intent`  

---

## 11. 类型真源

| 内容 | 路径 |
|------|------|
| Intent 类型 | `src/core/workflow/workflow-intent.types.ts` |
| 校验 | `src/core/workflow/validate-workflow-intent.util.ts` |
| 编译 | `src/core/workflow/compile-workflow-ir.util.ts` |
| 能力说明 | `v2/docs/b-end-flow-capabilities-and-scenarios.md` |

---

## 12. 相对旧「步骤列表」文档的变更

| 旧（列表优先） | 现（画布优先） |
|----------------|----------------|
| 拖拽排序生成 always | 用户画边；边即真源 |
| P3 才上简易流程图 | **画布即编辑器**；C0 起 always，C2 上分支 |
| 连线面板附属 | 连线是一等手势 |

Preset 向导、profile、四 operation 语义 **不变**；变的是编辑器形态。
