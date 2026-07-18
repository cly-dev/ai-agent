# Agent Workflow & Harness V2

本目录为 V2 架构与规格文档。

## B 端对接（现行）

| 文件 | 说明 |
|------|------|
| [docs/b-end-flow-product-canvas-guide.md](./docs/b-end-flow-product-canvas-guide.md) | **产品精简版（推荐）**：三 Preset + 画布四节点；页内回填无 speak |
| [docs/b-end-flow-capabilities-and-scenarios.md](./docs/b-end-flow-capabilities-and-scenarios.md) | 节点能力 + 场景（长文，保留） |
| [docs/b-end-flow-intent-editor-ux.md](./docs/b-end-flow-intent-editor-ux.md) | Intent 画布编排（长文，保留） |
| [docs/b-end-flow-frontend-ux.md](./docs/b-end-flow-frontend-ux.md) | 前端整体交互（长文，保留） |
| [docs/b-end-flow-admin-guide.md](./docs/b-end-flow-admin-guide.md) | API / 心智 / 错误码 / 对接清单 |

编排配置写路径为 **`/admin/flow`**；legacy `/admin/workflow` 仅只读与清理。  
**新产品对接优先读 product-canvas-guide**；长文作补充；接口 → **admin-guide**。

## 规格与设计（研发）

| 文件 | 说明 |
|------|------|
| [proposal.md](./proposal.md) | 早期 V2 提案（历史） |
| [design.md](./design.md) | 架构与阶段规划（历史 + 运行时底子） |
| [workflow-action-kinds.md](./workflow-action-kinds.md) | Legacy executor action 词表（lower 目标；非 B 端配置） |
| [tasks.md](./tasks.md) | 早期实现清单（历史） |
| [specs/](./specs/) | 能力规格（部分仍描述 legacy Workflow 表） |

Intent / Flow 分表的现行 OpenSpec 变更：

`openspec/changes/refactor-workflow-intent-ssot/`
