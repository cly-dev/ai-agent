# B 端心智：Workflow 节点结构（怎么配才不晕）

> **受众**：B 端前端 / 实施 / 后端联调  
> **目的**：先建立「层 → 节点 → 数据流」结构，再动手拖画布。  
> **权威契约**：动作字段仍以 [workflow-action-kinds.md](../workflow-action-kinds.md) 为准。  
> **入口配置**：[b-end-config-guide.md](./b-end-config-guide.md) · Preset：[b-end-workflow-preset-admin-guide.md](./b-end-workflow-preset-admin-guide.md)

---

## 0. 先记住三句话

1. **日常配场景用 Preset，不要从空白画布拖满原子节点。**  
2. **节点只干一类事**：进数据 / 补证据 / 分支 / 对人说话或写回页面 / 写库。  
3. **边 = 顺序与分支**；节点 **input** 只配「这一步自己的参数」，不要在脑里维护隐藏全局状态。

若这两层分不清，画布会越拖越难懂——这是产品问题，不是你笨。

---

## 1. 两层配置（强烈建议按这层用）

```text
┌─────────────────────────────────────────┐
│  L0 场景层（日常）                       │
│  Preset：页内回填 / 拉数作答 / 写确认…     │
│  人选场景 + 绑 Tool/HostTool + 改文案     │
└──────────────────┬──────────────────────┘
                   │ 服务端展开
                   ▼
┌─────────────────────────────────────────┐
│  L1 原子层（高级 / 审图 / 定制）          │
│  nodes[] + edges[]                       │
│  仅在 Preset 不够或要看清分支时打开       │
└─────────────────────────────────────────┘
```

| 你是谁 | 该看哪层 |
|--------|----------|
| 运营 / 实施常规配置 | **只配 Preset + Skill/PageAction 绑定** |
| 要做状态分支、识图、特例流 | 展开原子层，按下面「五层」组装 |
| 写管理台 | Preset 向导默认；原子画布进「高级」 |

**不要**一上来教人记住 10 种 action；先让人选「场景」。

---

## 2. 原子节点：按「五层职责」看，不要按编号背

把 10 个 action 记成五层。同层通常互斥或串联一种即可。

```text
① 进场（上下文从哪来）
   load_page_context

② 取证（业务数据从哪来）
   fetch_data
   summarize_images     ← 可选：给实体补「图侧证据」

③ 分流（要不要分成多条路）
   detect_clues         ← 可选：多状态 + 多边

④ 交付（对人 / 对页）
   summarize            ← 说话 / 说明
   generate_and_push    ← 写回页面（HostTool）

⑤ 变更（写库，仅 Chat）
   compose_mutation → present_mutation → await_user_confirm → write_data
   （常接 summarize）
```

### 2.1 对照表（配的时候只看「读什么 / 写什么」）

| 层 | action | 配置者心里的一句话 | 主要读 | 主要写（给下游） | 必绑 |
|----|--------|-------------------|--------|------------------|------|
| ① | `load_page_context` | 用当前页已有上下文 | C 端 `pageContext` | 页内观测 | 无 |
| ② | `fetch_data` | 调接口拉数据 | Tool 响应 | `obs:fetch_data:{id}` | `toolIds` |
| ② | `summarize_images` | （可选）把图变成文字证据 | 上游/页里的图 | `obs:summarize_images:{id}` | 无 |
| ③ | `detect_clues` | （可选）判断处于哪些状态并走边 | 用户话 + 上游观测 | 命中 clue + 扇出 | 边上楼 clue |
| ④ | `summarize` | 用已有证据回答/说明用户 | 上游观测 | 用户可见文案 | 无 |
| ④ | `generate_and_push` | 生成并填到页面控件 | 上游观测 | Host 推送结果 | `hostToolIds` |
| ⑤ | `compose_mutation` | 组装要提交的写参数 | 上游观测 | compose 产物 | `toolId` |
| ⑤ | `present_mutation` | 给用户看草稿 | compose 产物 | 展示文案 | 无 |
| ⑤ | `await_user_confirm` | 卡一下等人点确认 | — | 暂停/恢复 | 无 |
| ⑤ | `write_data` | 真的提交 | compose 参数 | 写结果 | `toolId` |

### 2.2 Profile 怎么记

| profile | 你能用的层 |
|---------|------------|
| `page_action` | ①②③④（批次 A）；**不要**⑤ |
| `chat_skill` | ①～⑤ 都可以 |
| `shared` | 保存可并集；Page 入口运行时仍只跑 A |

---

## 3. 数据流心智（比节点名更重要）

运行时真相是 **`workflowRun` + 各节点 `outputRef`（obs:…）**。

```text
load / fetch / summarize_images / detect …
        │
        ▼ 写入 obs:{action}:{nodeId}
下游节点（及 Chat 总结）读取「上游观测」做判断或说话
```

配置时自问三句：

1. **这一步缺什么？** → 缺页数据就 `load`/`fetch`；缺图证据再考虑识图；缺分支才 `detect_clues`。  
2. **结果给谁用？** → 给人看用 `summarize`；给页上填用 `generate_and_push`；给写库用⑤链。  
3. **要不要分叉？** → 不要就直线 `always` 边；要再挂状态识别 + clue 边。

**反模式**：为「显得完整」每个 Workflow 都挂识图、状态识别——只会加重心智，也无数据时等于空跑。

---

## 4. 推荐拓扑（照抄比自学快）

### 4.1 页内回填（最常见 Page）

```text
load_page_context → fetch_data? → generate_and_push → summarize
```

Preset：`page_auto_fill` / `page_context_push`

### 4.2 Chat 只读问答

```text
fetch_data → summarize
```

Preset：`fetch_and_answer`

### 4.3 要分支（邮件/评论意图等）

```text
fetch_data →（可选 summarize_images）→ detect_clues ──clue──► 各业务下游
                              └─default─► 兜底 summarize
```

专项：[b-end-workflow-detect-clues-edges.md](./b-end-workflow-detect-clues-edges.md)  
识图：[b-end-workflow-summarize-images.md](./b-end-workflow-summarize-images.md)（**有图且需要图证才加**）

### 4.4 Chat 写操作确认

```text
fetch_data? → compose_mutation → present_mutation → await_user_confirm → write_data → summarize
```

Preset：`mutation_submit`

---

## 5. 节点之间「连线」怎么理解

| 边 kind | 含义 | 谁配 |
|---------|------|------|
| `always` | 做完 A 一定去 B（直线） | 默认拓扑 |
| `clue` | 状态 X 命中时去 B | 只出在 `detect_clues` |
| `default` | 状态全未命中 | 每个有 clue 的 detect **必须有** |

心智：**先保证直线能跑通，再加分叉。**  
不要一上来画蜘蛛网。

---

## 6. 每个节点表单：只暴露「真会影响运行」的字段

| action | 日常必配 | 可折叠进高级 | 已废弃 / 勿再配 |
|--------|----------|--------------|-----------------|
| `load_page_context` | —（可默认） | `materialize` | — |
| `fetch_data` | `toolIds` | `completeWhen` | 仅写 `toolId` 的旧习惯逐步迁数组 |
| `summarize_images` | 默认即可；有业务口径再写 `hint` | `from` / `maxCells` / `onFailure` / 缓存 | 不要指望它替代 fetch |
| `detect_clues` | 出边状态（key+描述+去向） | `hint` | **状态不要塞进 input** |
| `generate_and_push` | `hostToolIds` | — | ~~`stream`~~ 已删除 |
| `summarize` | `mode`（常用 final） | `stream`（Page prose） | ~~hostToolId~~ |
| mutation 链 | 各步 `toolId` / confirmKind | — | — |

管理台 UI：**默认 Preset 字段 ↔ 进高级才露出原子表单。**

---

## 7. Skill / PageAction 和 Workflow 怎么接（仍属「结构」）

```text
选好 Workflow（或 Preset 生成）
        │
        ├─ Skill：绑 workflowId + 写 prompt（角色）
        └─ PageAction：绑 workflowId + systemPrompt
```

| 别再维护 | 原因 |
|----------|------|
| Skill 上再抄一遍全部 Tool | 节点 input 已是 SSOT |
| PageAction 内联新建 HostTool | 先建 HostTool，节点再选 id |

细节仍见 [b-end-config-guide.md](./b-end-config-guide.md)。

---

## 8. 何时才需要「高级画布」

| 情况 | 建议 |
|------|------|
| 标准回填 / 问答 / 写确认 | **只用 Preset** |
| 多个业务状态走不同下游 | Preset 展开后加 `detect_clues` |
| 评论/邮件必须看图再判 | 在取证层加 `summarize_images`（按实体理解，见专项文档） |
| 完全自定义 DAG | 原子画布；控制在 6～8 节点内，超过就重新拆场景 |

---

## 9. 给开发者的排查顺序

1. Workflow 是否来自预期 Preset / 版本？  
2. 直线边是否通？`currentNodeId` 卡在哪？  
3. 该节点 **读的 obs** 上游有没有成功写入？  
4. 才查 input（toolIds / hostToolIds / clue 边）。

不要从「某个高级开关」倒着查。

---

## 10. 相关文档索引

| 主题 | 文档 |
|------|------|
| action 字段 SSOT | [workflow-action-kinds.md](../workflow-action-kinds.md) |
| Preset 运营向导 | [b-end-workflow-preset-admin-guide.md](./b-end-workflow-preset-admin-guide.md) |
| 状态识别与边 | [b-end-workflow-detect-clues-edges.md](./b-end-workflow-detect-clues-edges.md) |
| 图片识别 | [b-end-workflow-summarize-images.md](./b-end-workflow-summarize-images.md) |
| 多 Tool 绑定 | [b-end-workflow-node-multi-tool-binding.md](./b-end-workflow-node-multi-tool-binding.md) |
| 总配置入口 | [b-end-config-guide.md](./b-end-config-guide.md) |

---

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-15 | 初稿：五层职责 + Preset/原子两层心智，缓解节点配置认知负担 |
