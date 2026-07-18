## 为什么

配置面曾把业务动作直接暴露成 `WorkflowActionKind`，IR 正在再次滑向业务 DSL。需要两层分离：**Intent = 业务语言（配置 SSOT）**；**IR = 机器语言（少而稳，给编译器 / runtime / 研发排障）**。保留 IR，但对旧节点做减法并收成统一协议词表（≤30）。

## 变更内容

- Intent 仍为 Admin/B 端唯一可编辑真源（`operation` + capability，非退款/客服专用节点）。
- **IR 重新定位**：研发可见的执行图；统一 `WorkflowIrNode` 协议；按 6 类收束词表。
- **BREAKING / 淘汰出 IR 词表**：`load_page_context`、`summarize_images`、`detect_clues`、`generate_and_push`（拆 generate + message/host action）、业务名节点。
- Compiler：Intent → 新 IR 词表（策略展开）；Revision 存 IR 快照。
- Runtime：`execute(node, context)`；pageContext / session 走 **Runtime Context**，非节点。
- 旧 `WorkflowActionKind` 过渡期仅作编译目标别名，目标词表以本变更 IR catalog 为准。

## 功能 (Capabilities)

### 新增功能

- `workflow-intent-model`: Intent SSOT
- `workflow-ir-catalog`: 六类 IR 节点目录 + 统一节点协议（≤30）
- `workflow-strategy-compiler`: Intent → IR 策略编译
- `workflow-intent-admin-api`: Admin 只写 Intent/Preset

### 修改功能

- （以本变更 specs 为准）

## 影响

- `src/core/workflow/**` IR 类型 / executor / compile
- DB `intent` + `ir`
- Admin API、Preset、文档
- 禁止再在 IR 增加垂直业务节点
