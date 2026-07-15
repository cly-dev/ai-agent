# Agent Workflow & Harness V2

本目录为 **V2 底子改造** 的 OpenSpec 风格文档，涵盖 Workflow 资产、Harness Engineering、LangGraph 重组与 PageAction/Chat 统一运行态。

**在确认本文档集无问题之前，不开始实现代码。**

## 文档索引

| 文件 | 说明 |
|------|------|
| [proposal.md](./proposal.md) | 为什么做、做什么、影响范围、成功标准 |
| [design.md](./design.md) | 架构、数据模型、Harness/LangGraph 设计、阶段规划 |
| [workflow-action-kinds.md](./workflow-action-kinds.md) | **动作节点类型定稿**（含 `summarize_images`、input、profile、Plan 映射） |
| [docs/b-end-workflow-node-structure.md](./docs/b-end-workflow-node-structure.md) | **B 端心智：节点五层结构 / Preset vs 原子** |
| [docs/b-end-workflow-summarize-images.md](./docs/b-end-workflow-summarize-images.md) | **B 端对接：图片识别节点** |
| [tasks.md](./tasks.md) | 分 PR 实现清单（可勾选） |

## 规格（Specs）

| 能力 | 路径 |
|------|------|
| Workflow 资产（表、动作节点、校验、版本） | [specs/workflow-asset/spec.md](./specs/workflow-asset/spec.md) |
| 动作节点注册表（8 种定稿） | [workflow-action-kinds.md](./workflow-action-kinds.md) · [specs/workflow-action-registry/spec.md](./specs/workflow-action-registry/spec.md) |
| WorkflowRunState（L1 运行态、SSE、run 快照） | [specs/workflow-run-state/spec.md](./specs/workflow-run-state/spec.md) |
| Harness Engineering（Hook/Sensor/Policy/trace） | [specs/harness-engineering/spec.md](./specs/harness-engineering/spec.md) |
| PageAction Workflow Runner | [specs/page-action-workflow-runner/spec.md](./specs/page-action-workflow-runner/spec.md) |
| LangGraph 以 Workflow 为轴 | [specs/langgraph-workflow-orchestration/spec.md](./specs/langgraph-workflow-orchestration/spec.md) |
| GOA / Session ActiveTask | [specs/session-active-task/spec.md](./specs/session-active-task/spec.md) |
| Admin Workflow API | [specs/admin-workflow-api/spec.md](./specs/admin-workflow-api/spec.md) |

## 实施顺序

```text
PR0 → 契约（core/workflow + core/harness）
PR1 → 落表 + Admin API
PR2 → Executors + LangGraph 改造（底子优先 ★）
PR3 → PageAction 接入同一 executors
PR4 → GOA / Session
PR5 → Legacy 清理
PR6 → Golden eval（可选）
```

## 确认后执行

确认 proposal / design / specs / tasks 后，从 **tasks.md §1（PR0）** 开始实现，或使用 OpenSpec apply 流程跟踪进度。

## 待定项（确认时请拍板）

见 [design.md §待定问题](./design.md#待定问题)。
