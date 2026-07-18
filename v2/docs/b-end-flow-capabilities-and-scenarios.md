# Flow 节点能力与场景使用说明

> **受众**：B 端产品 / 运营 / 前端 / 实施  
> **配置真源**：Intent 的 **operation**（业务步骤），不是 IR / 旧画布 action  
> **配套文档**：  
> - Intent **画布**交互 → [`b-end-flow-intent-editor-ux.md`](./b-end-flow-intent-editor-ux.md)  
> - 前端整体 → [`b-end-flow-frontend-ux.md`](./b-end-flow-frontend-ux.md)  
> - API 字段 → [`b-end-flow-admin-guide.md`](./b-end-flow-admin-guide.md)  
> - C 端 PageAction → [`c-end-page-action-integration.md`](./c-end-page-action-integration.md)  
> - **实体物化 / 识图 / Evidence** → [`entity-materialization-architecture.md`](./entity-materialization-architecture.md)  
> - **物化 C/B 对接与排障** → [`entity-materialization-integration.md`](./entity-materialization-integration.md)

本文说明：**四种业务节点能干什么、怎么配、六种场景 Preset 怎么用、端到端怎么跑通**。

---

## 0. 读本文前先记住

```text
运营看到的「节点」= Intent operation（read / judge / deliver / mutate）
         ↓ 保存时服务端 compile
内部 IR（data_query / llm / host_effect …）—— 详情只读，禁止当表单
         ↓ lower（过渡）
运行时执行（对配置者不可见）
```

| 不要再配 | 现在怎么表达 |
|----------|----------------|
| `fetch_data` 画布节点 | `read` + `readToolIds` |
| `summarize_images` 识图节点 | `read` + `capabilities.images` |
| `generate_and_push` | `deliver` + `channel: fill` |
| `summarize` 说话 | `deliver` + `channel: speak` |
| `detect_clues` | `judge` + 状态边 |
| 一长串确认/写节点 | 单步 `mutate`（编译自动展开确认链） |
| `load_page_context` | **永不配置**；C 端请求自带 |

---

## 1. 入口定策略（先定「用在哪」）

创建 Flow：`profile` **固定 `shared`**（UI 不展示）。写入策略由 **绑定入口** 派生，不是 profile / 说明开关：

| 绑定入口 | 写入怎么做 |
|----------|------------|
| **Skill（Chat）** | 可用 `mutate` / `mutation_submit` → **必确认** |
| **PageAction** | **不配 mutate**；页内写用 `deliver(fill)` |

存量 `profile` 字段仅兼容；不要再教运营「先选 page_action 才能禁 mutate」。详见产品画布指南 §1.1。

---

## 2. 节点能力总表（Intent operation）

### 2.1 一览

| operation | 业务含义 | 必配要点 | 编译成什么（概念） | 运行时在做什么 |
|-----------|----------|----------|--------------------|----------------|
| **`read`** | 取证：HTTP 拉数和/或识图 | `readToolIds` 和/或 `images.enabled` | `data_query`、可选 vision `llm` | 调读 Tool；或 IMAGE_PANEL 识图成文字证据 |
| **`judge`** | 结构化判定后走不同分支 | 常配 `policyHint` + 状态边 | `structured_output` | LLM 按线索 key 路由 |
| **`deliver`** | 对人交付 | `channel`；fill 必填 Host | fill→`host_effect`；speak→`message_send` | 填页推 Host，或聊天总结说话 |
| **`mutate`** | Chat 写确认链 | `writeToolId`；仅绑 Skill | 组参→审批→写 | Chat 确认门后调写 Tool |

### 2.2 `read` — 拉数 / 图证据

**什么时候用**

- 要先调 HTTP 接口拿业务数据再回答或填页  
- 要识别页内 / 上游结果里的图片（原「图片识别」能力）

**字段**

| 字段 | 必填 | 说明 |
|------|------|------|
| `slots.readToolIds` | 与 images 二选一或同时 | 正整数 Tool id 列表 |
| `completeWhen` | 否 | `first_success`（默认）\| `fetch_all_pages` |
| `objective` | 否 | 本步目标文案 |
| `capabilities.images` | 否 | 见 §2.2.1 |

保存时：若既没有 `readToolIds` 又没开 `images`，**编译失败**。

#### 2.2.1 图片识别（`capabilities.images`）

挂在 **`read` 上**，不是独立节点。

| 字段 | 说明 |
|------|------|
| `enabled` | `true` 才启用识图 |
| `from` | `page_context`：页内图；`upstream`：本步拉数结果里的图；`all`：两边。默认：有读 Tool 则 `upstream`，否则 `page_context` |
| `hint` | 给视觉模型的提示 |
| `onFailure` | `degrade`（失败继续）\| `fail`（失败打断） |
| `maxCells` / `maxGroups` / `maxCellsPerGroup` | 拼图网格上限 |
| `cacheTtlSec` | 识别缓存秒数 |

运行时：收集 URL → 按实体归组 → 识图 → **Image Evidence**（见 [`entity-materialization-architecture.md`](./entity-materialization-architecture.md)）。  
依赖环境：`ENABLE_IMAGE_PANEL_VISION`、镜像 `sharp` 等（关闭时按 `onFailure` 处理）。

**注意**：当前实现仍部分为扁平 `cells`；`invoke.context` 内图片需进入物化层后才可被识图。目标架构见上文链接。

**现有 Preset 都不会自动打开识图**；要识图请在 Intent 步骤编辑器里打开 `read` →「图片识别」。

### 2.3 `judge` — 判定分流

**什么时候用**

- 「先判断属于哪类情况，再走不同后续」  
- 需要运营可理解的状态 key（不是写死业务 if 代码）

**字段**

| 字段 | 说明 |
|------|------|
| `capabilities.policyHint` | 判定口径补充，进结构化输出 hint |
| `objective` / `name` | 可选 |

**边（关键）**

从 `judge` 出发：

| `kind` | 含义 |
|--------|------|
| `state` | 命中某状态；必须带 `state: { key, description }` |
| `default` | 未命中任一 state 时的兜底 |
| `always` | 无条件（一般不用在 judge 出边） |

规则：只要出边里有任意 `state`，就必须有 **恰好一条** `default`，否则校验失败。

### 2.4 `deliver` — 交付（说话 / 填页）

**`channel: speak`** — 对用户说话（Chat 总结、页内说明文案等）

| 字段 | 说明 |
|------|------|
| `summarizeMode` | `brief` \| `detailed` \| `draft` \| `final` |
| `stream` | 是否流式 |
| `objective` | 说什么、语气 |

**`channel: fill`** — 往页面表单 / Host 推送

| 字段 | 说明 |
|------|------|
| `slots.fillHostToolIds` | **必填**，至少一个 HostTool id |
| `objective` | 生成并推送的目标 |

运行时：LLM 结合证据生成内容，经 HostTool 写回页面（页内）或经 Chat 侧 Host 能力执行。

### 2.5 `mutate` — 变更提交（Chat 确认链）

**什么时候用**

- **Skill / Chat** 里要调写 Tool，且用户必须确认后再提交  
- **禁止**绑到 PageAction：页内写入用 `deliver(fill)`，不要给 mutate 加「免确认」

**字段**

| 字段 | 必填 | 说明 |
|------|------|------|
| `slots.writeToolId` | 是 | 写 HTTP Tool |
| `slots.readToolIds` | 否 | 写前预读 |
| `objective` | 否 | 写步骤目标 |

产品面 **不配** `explainBeforeConfirm` / `summarizeAfter` / `presentMode` / `confirmKind`（写入策略由绑定入口派生，不是开关）。

配置面只看到 **一步 mutate**；编译固定展开为：

```text
（可选预读）→ 组装变更草稿 → 等待确认 → 调写 Tool
```

（无散文说明、无写后 speak。）

写 Tool 的可编辑字段策略见仓库 `docs/draft-review-b-end-integration.md`（`agentMetadata.draftReview`）。

### 2.6 边（edges）通用规则

| `kind` | 何时用 |
|--------|--------|
| `always` | 顺序执行（Preset 全部是这种） |
| `state` | 从 judge 按状态走 |
| `default` | judge 兜底 |

- 多步时必须有 edges（不能空）  
- `from` / `to` 必须是已有 step `id`  
- Preset 自动生成相邻 `always` 边，高级模式才手动画分支

### 2.7 能力对照：Intent → 旧画布词（仅排障）

| Intent | 旧 action / 概念（勿再当配置） |
|--------|--------------------------------|
| read + tools | `fetch_data` |
| read + images | `summarize_images` |
| judge | `detect_clues` |
| deliver fill | `generate_and_push` |
| deliver speak | `summarize` |
| mutate | `compose_mutation` + `present_mutation` + `await_user_confirm` + `write_data` + 可选 summarize |

详情页 IR 折叠区可能看到新 IR type（`data_query`、`host_effect` 等），同样只读。

---

## 3. 场景 Preset 说明书

Preset = 服务端把「场景 + 几个 ID」展开成完整 Intent。  
**DB 不保存 Preset 名**；想重建须再次提交 `preset` + `presetConfig`。

### 3.1 选型决策表

| 你想达成的效果 | 选 Preset | 建议 profile | 入口 |
|----------------|-----------|--------------|------|
| 页内一键：可选拉数 → 填表 → 口头说明 | `page_auto_fill` | `page_action` | PageAction |
| 页内一键：不拉 HTTP，只靠页上下文填表 | `page_context_push` | `page_action` | PageAction |
| 明确要 HTTP 拉数再填页再说明 | `fetch_push_summarize` | `page_action` 或 `shared` | PageAction / Skill |
| Chat：拉数后文字回答（不填页） | `fetch_and_answer` | `chat_skill` | Skill |
| Chat：写操作 + 确认门 | `mutation_submit` | `chat_skill` | Skill |
| Chat：写操作主要依赖页上下文 | `page_context_mutation_submit` | `chat_skill` | Skill |
| 要识图 | **无现成 Preset** | 任意合法 | 用 Intent 开 `images` |

### 3.2 `page_auto_fill` — 页内自动回填

| 项 | 内容 |
|----|------|
| 目录文案 | （可选）拉数 → Host 推送 → 总结。pageContext 隐式 |
| 必填 | `hostToolId` |
| 可选 | `readToolId`、`fetchCompleteWhen`、`summarizeMode`、`objectives` |
| 展开步骤 | `read?` → `deliver(fill)` → `deliver(speak)` |

**配法要点**

- 有稳定读接口 → 填 `readToolId`  
- 数据已在 pageContext → 可不填 `readToolId`，变成 fill → speak  
- `objectives.push` / `summarize` 建议写清，减少胡填

**端到端**

1. `POST /admin/flow`（本 Preset，`profile=page_action`）  
2. 创建/更新 PageAction：`flowId` + `actionKey` + `pageScope` + `systemPrompt`  
3. C 端 `POST /page-action/invoke`（带 `pageContext`）+ 订阅 run 流 / 任务中心

### 3.3 `page_context_push` — 页内推送

| 项 | 内容 |
|----|------|
| 目录文案 | Host 推送 → 总结（依赖请求内 pageContext，无 HTTP 读） |
| 必填 | `hostToolId` |
| 可选 | `summarizeMode`、`objectives` |
| 展开步骤 | `deliver(fill)` → `deliver(speak)` |

适用：页面已带齐实体/正文，只需生成并回填。  
**不要**指望再调读 Tool；要读数请改用 `page_auto_fill` 或 `fetch_push_summarize`。

### 3.4 `fetch_push_summarize` — 拉数并推送

| 项 | 内容 |
|----|------|
| 目录文案 | HTTP 拉数 → Host 推送 → 总结 |
| 必填 | `readToolId`、`hostToolId` |
| 可选 | `fetchCompleteWhen`、`summarizeMode`、`objectives` |
| 展开步骤 | `read` → `deliver(fill)` → `deliver(speak)` |

与 `page_auto_fill` 的差别：**强制**有读 Tool，适合「一定先查接口再填」。

### 3.5 `fetch_and_answer` — 拉数作答

| 项 | 内容 |
|----|------|
| 目录文案 | HTTP 拉数 → 文字总结 |
| 必填 | `readToolId` |
| 可选 | `fetchCompleteWhen`、`summarizeMode`、`objectives` |
| 展开步骤 | `read` → `deliver(speak)` |

适用：Chat 问答、查订单/状态后口头回复。  
**无 Host、不填页。**

**端到端**

1. Flow 本 Preset，`profile=chat_skill`（或 shared）  
2. Skill 绑 `flowId`  
3. C 端会话命中 Skill 后跑编排

### 3.6 `mutation_submit` — 变更提交

| 项 | 内容 |
|----|------|
| 目录文案 | 单步 mutate（编译展开确认链）。可选预读。仅 chat/shared |
| 必填 | `writeToolId` |
| 可选 | `readToolId`、`presentMode`、`confirmKind`、`summarizeMode`、`objectives` |
| 展开步骤 | 仅一步 `mutate` |

适用：Chat 里提交、驳回、改状态等写操作。  
`page_action` **不能**选本 Preset。

写 Tool 请同时配好 `agentMetadata.draftReview`（可改哪些草稿字段）。

### 3.7 `page_context_mutation_submit` — 页内写确认（Chat）

与 `mutation_submit` **展开出的 Intent 相同**；语义强调写参数主要来自运行时 pageContext。  
仍只能挂 `chat_skill` / `shared`，经 **Skill** 跑确认链，**不是** PageAction 上直接 mutate。

### 3.8 PresetConfig 键 → 步骤字段

| `presetConfig` | 落到 Intent |
|----------------|-------------|
| `readToolId` | `read.slots.readToolIds[0]` 或 `mutate.slots.readToolIds[0]` |
| `hostToolId` | `deliver(fill).slots.fillHostToolIds[0]` |
| `writeToolId` | `mutate.slots.writeToolId` |
| `fetchCompleteWhen` | `read.completeWhen` |
| `summarizeMode` | speak / mutate 的总结模式（Preset 侧枚举无 `draft`，默认常为 `final`） |
| `presentMode` / `confirmKind` | mutate 展示与确认门 |
| `objectives.fetch` | read.objective |
| `objectives.push` | fill.objective |
| `objectives.write` | mutate.objective |
| `objectives.summarize` | speak.objective |

---

## 4. 场景使用手册（按业务路径）

### 4.1 页内自动回填（最常见）

**目标**：用户在业务页点按钮 → 任务中心跑编排 → 表单被填 → 可选说明。

| 步骤 | 谁 | 做什么 |
|------|----|--------|
| 1 | B | 建 Flow：`page_auto_fill` + `hostToolId`（+ 可选 `readToolId`） |
| 2 | B | PageAction 绑 `flowId`，配 `actionKey`、`pageScope`、`systemPrompt` |
| 3 | C | `invoke` 带齐 `pageContext`（page / entity / metadata 等协议字段） |
| 4 | 验收 | Host 收到推送；任务中心状态成功；无 Chat 假加载替代任务中心 |

**常见坑**

- 只绑了旧 `workflowId` → `FLOW_REQUIRED`，须迁 Flow  
- `pageScope` 与 C 端 `pageContext.page` 对不齐 → 动作匹配失败  
- 期望识图但用了纯 Preset → 需 Intent 开 `images`

### 4.2 页内仅推送（强依赖上下文）

用 `page_context_push`。确保 C 端 pageContext 已含生成所需正文/实体；否则填空或胡填。

### 4.3 Chat 查询作答

| 步骤 | 做什么 |
|------|--------|
| 1 | Flow：`fetch_and_answer` + `readToolId` |
| 2 | Skill 绑 `flowId`，配 Skill 提示词 |
| 3 | 用户点 Skill / 命中后应出现拉数再总结 |

需要「查完填回某页」→ 改用 `fetch_push_summarize` 或 `page_auto_fill`，并确保有 Host 通道。

### 4.4 Chat 变更确认

| 步骤 | 做什么 |
|------|--------|
| 1 | Flow：`mutation_submit` + `writeToolId`，`profile=chat_skill` |
| 2 | 写 Tool 配 `draftReview` |
| 3 | Skill 绑 `flowId` |
| 4 | 会话：出草稿 → 用户确认 → 真正写入 |

**不要**试图用 PageAction + mutate Preset 做同一件事。

### 4.5 页内图识别后再说明 / 回填

1. Intent 高级：`read` 开 `capabilities.images`（`from: page_context`）  
2. 后接 `deliver(speak)` 和/或 `deliver(fill)`  
3. 入口仍用 PageAction 或 Skill 绑该 Flow  
4. 确认 vision 环境变量与 C 端图 URL 可访问

示例见 [`b-end-flow-frontend-ux.md`](./b-end-flow-frontend-ux.md) §5.3.1。

### 4.6 判定分支（高级）

1. Intent **画布**：`read`（可选）→ `judge`（填 policyHint）→ 从 judge 拉出多条 `state` + 一条 `default`  
2. 各分支接到不同 `deliver` / `mutate`  
3. **不要**用「让运营贴 JSON」或旧 IR 条件节点顶上  

前端逐步配置、校验与验收见 [`b-end-flow-judge-branch-guide.md`](./b-end-flow-judge-branch-guide.md)。

---

## 5. 入口与运行时对照

| 入口 | 触发 | 进度呈现 | 典型 Flow |
|------|------|----------|-----------|
| PageAction | `POST /page-action/invoke` | 任务中心 / run SSE | `page_auto_fill` 等 |
| Skill（Chat） | 会话命中 Skill | Chat 消息流 / 确认卡片 | `fetch_and_answer`、`mutation_submit` |

钉版本：入口可设 `flowVersion`；钉死后 **不会**自动跟最新 Flow 头版本。

可选覆盖：Skill / PageAction 的 `workflowOverrides` 可按节点覆写 `objective`（高级）。

---

## 6. 配置检查清单（场景级）

### 页内回填

- [ ] Flow `profile` 为 `page_action` 或 `shared`  
- [ ] Preset 含 `hostToolId`，且 Host 属于同一 AppClient  
- [ ] PageAction 有 `flowId`，无残留正数 `workflowId`  
- [ ] C 端 pageContext 含图/文所需字段  
- [ ] 若识图：Intent 已开 `images`，且 vision 环境可用  

### Chat 作答

- [ ] 有 `readToolId`  
- [ ] Skill 已绑 `flowId`  
- [ ] 不需要 Host（本场景）  

### Chat 变更

- [ ] `profile` 非 `page_action`  
- [ ] 有 `writeToolId` + draftReview  
- [ ] 入口是 Skill，不是 PageAction mutate  

---

## 7. 禁止与易错

1. 在配置面编辑 IR / 旧 action 名  
2. PageAction 配 mutate / mutation Preset，或给 mutate 加免确认 / 说明开关
3. Intent 增加「加载 pageContext」步骤  
4. 把识图做成独立画布节点（应挂 `read.capabilities.images`）  
5. 以为选了 Preset 就会永久回显 Preset 名（不会；只存 Intent）  
6. 钉 `flowVersion` 后仍以为会自动升级  

---

## 8. 文档与代码索引

| 主题 | 位置 |
|------|------|
| Intent 类型 | `src/core/workflow/workflow-intent.types.ts` |
| Intent 校验 | `src/core/workflow/validate-workflow-intent.util.ts` |
| Intent → IR | `src/core/workflow/compile-workflow-ir.util.ts` |
| Preset 展开 / catalog | `src/core/workflow/workflow-preset.util.ts` |
| 识图执行 | `src/core/workflow/executors/summarize-images.executor.ts`、`src/core/image-panel/` |
| **实体物化 / Evidence** | [`entity-materialization-architecture.md`](./entity-materialization-architecture.md) · `src/core/entity-materialization/` |
| 草稿评审 | `docs/draft-review-b-end-integration.md` |
| 前端向导 | `v2/docs/b-end-flow-frontend-ux.md` |
| Admin API | `v2/docs/b-end-flow-admin-guide.md` |
