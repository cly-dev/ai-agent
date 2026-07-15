# B 端对接：图片识别节点（`summarize_images`）

> **受众**：B 端管理台前端、联调、实施配置  
> **action**：`summarize_images`（展示名建议：**图片识别**）  
> **定位**：**显式 opt-in** —— 画布上有该节点才识图；有图片 URL 也不会自动识别  
> **相关**：[动作一览](../workflow-action-kinds.md) · [状态识别](./b-end-workflow-detect-clues-edges.md) · [多工具绑定](./b-end-workflow-node-multi-tool-binding.md) · [前端编排总览](./frontend-workflow-config-guide.md)

---

## 1. 产品定调（先记住）

| 本节点负责 | 不负责 |
|------------|--------|
| 从上游观测 / 页上下文里 **扫描图片 URL** | 替 `fetch_data` 调业务 API |
| 拼多图面板 + 多模态摘要 | 意图路由、分支（那是 `detect_clues`） |
| 把分格摘要写入节点 output 供下游读 | 强制绑 Tool / HostTool |

**心智模型：把节点拖上画布 = 打开识图开关。**  
未拖上 → 服务端完全不跑拉图 / vision（部署也无需 sharp）。

### 典型链路

```text
fetch_data / load_page_context
        ↓
  summarize_images     ← 仅画布配置时执行
        ↓
  detect_clues / summarize / …
```

---

## 2. B 端要改什么（清单）

| # | 项 | 说明 |
|---|----|------|
| 1 | **节点库 / palette** | 新增 action=`summarize_images`，展示「图片识别」 |
| 2 | **Profile** | `page_action` / `chat_skill` / `shared` **均可**（批次 A） |
| 3 | **节点表单** | 见 §3；**不需要** Tool / HostTool 下拉 |
| 4 | **边** | 普通线性 `always` 边即可；**无** clue / default 特殊边 |
| 5 | **保存** | 随 Workflow `nodes[]` 提交；无独立绑定表 |
| 6 | **校验** | 保存失败时展示 `issues[].code`（§5） |

---

## 3. 管理台推荐交互

### 3.1 放置

1. 节点库选 **图片识别**（`summarize_images`）  
2. 放在 **已有观测之后**（通常紧跟 `fetch_data` 或 `load_page_context`）  
3. 下游接 `detect_clues` / `summarize` / `generate_and_push` 均可  
4. **不要**放在流程最开头（除非 `from=page_context` 且确定页内已有图）

### 3.2 节点面板字段

| UI 文案 | 字段 | 控件 | 必填 | 默认 | 说明 |
|---------|------|------|------|------|------|
| 名称 | `name` | 文本 | 是* | — | 如「附件图片识别」 |
| 目标说明 | `objective` | 多行文本 | 是* | — | 注入运行时；如「识别附件中的运单号与金额」 |
| 图片来源 | `input.from` | 单选 | 否 | `upstream` | 见下表 |
| 最多识别张数 | `input.maxCells` | 数字 1–6 | 否 | `6` | 生产可默认先给 **4** |
| 单图清晰度 | `input.cellPx` | 数字 128–1024 或档位 | 否 | `512` | 读小字用 512；仅概览可 384 |
| 识别提示 | `input.hint` | 多行文本 | 否 | 空 | 业务关注点；**不要**写死语种问候词表 |
| 失败策略 | `input.onFailure` | 单选 | 否 | `degrade` | `degrade`=继续流程；`fail`=节点失败 |
| 摘要缓存(秒) | `input.cacheTtlSec` | 数字 / **建议放高级折叠** | 否 | `86400` | 进程内同 URL 摘要 TTL；`0`=禁用。**有条数硬顶（默认 256）**，满则 LRU 驱逐；非跨实例 Redis |

\* `name` / `objective` 与其它节点同样走通用校验。

#### `from` 选项文案建议

| 值 | 展示 | 何时选 |
|----|------|--------|
| `upstream` | 仅上游节点输出 | Chat 拉完邮件/评论详情后识图（最常见） |
| `page_context` | 仅当前页上下文 | PageAction：页上已带图，未再 fetch |
| `all` | 上游 + 页上下文 | 两边都可能有图 |

### 3.3 不需要的控件

- ❌ HTTP Tool / HostTool 绑定（本节点无工具白名单）  
- ❌ 状态 / clue 边编辑器（那是 `detect_clues`）  
- ❌「是否启用识图」第二开关（有节点=启用）

---

## 4. 保存 payload 示例

```json
{
  "id": "enrich_images",
  "action": "summarize_images",
  "name": "附件图片识别",
  "objective": "识别上游观测中的图片并写入分格摘要",
  "input": {
    "from": "upstream",
    "maxCells": 4,
    "cellPx": 512,
    "hint": "关注运单号、金额、签收状态等文字",
    "onFailure": "degrade",
    "cacheTtlSec": 86400
  }
}
```

最小合法（全靠默认值）：

```json
{
  "id": "enrich_images",
  "action": "summarize_images",
  "name": "图片识别",
  "objective": "识别上游中的图片",
  "input": {}
}
```

### 完整 Workflow 片段（Chat）

```json
{
  "nodes": [
    {
      "id": "fetch_mail",
      "action": "fetch_data",
      "name": "拉邮件详情",
      "objective": "拉取邮件正文与附件元数据",
      "input": { "toolIds": [101] }
    },
    {
      "id": "enrich_images",
      "action": "summarize_images",
      "name": "附件图片识别",
      "objective": "识别附件图片文字",
      "input": { "from": "upstream", "maxCells": 4, "onFailure": "degrade" }
    },
    {
      "id": "route_intent",
      "action": "detect_clues",
      "name": "邮件意图识别",
      "objective": "判断物流/商品/垃圾等状态",
      "input": { "hint": "可结合图片摘要判断" }
    }
  ],
  "edges": [
    { "id": "e1", "from": "fetch_mail", "to": "enrich_images", "kind": "always" },
    { "id": "e2", "from": "enrich_images", "to": "route_intent", "kind": "always" }
  ]
}
```

---

## 5. 保存校验（`issues`）

服务端对 `summarize_images` 的常见 code（路径形如 `nodes[i].input.*`）：

| `code` | 含义 | 前端处理 |
|--------|------|----------|
| `invalid_enum` | `from` / `onFailure` 非法 | 拦在表单，勿提交非法值 |
| `invalid_max_cells` | `maxCells` 非 1..6 整数 | 数字框限制 |
| `invalid_cell_px` | `cellPx` 非 128..1024 整数 | 数字框或档位 |
| `invalid_hint` | `hint` 非 string | — |
| `invalid_cache_ttl` | `cacheTtlSec` 非 0..604800 整数 | 高级区校验 |

本节点 **不会** 报 `missing_tool_ids` / `missing_host_tool_ids`。

通用：`action` 不在注册表 / `implemented=false` → 节点级拒绝（与其它 action 相同）。

---

## 6. 运行时（给联调 / 实施）

### 6.1 何时真正识图

| 条件 | 结果 |
|------|------|
| 画布无本节点 | 永不识图 |
| 有节点，但扫描结果 0 张 URL | 节点成功，`cells: []`，不调 VL |
| 有 URL，且环境允许 | 拉图 → 拼 IMAGE_PANEL → 多模态 → 写 output |
| `ENABLE_IMAGE_PANEL_VISION=0` 或 sharp 缺失 | 默认 **succeeded + `visionError`**（`onFailure=degrade`） |

### 6.2 节点 output（下游可读）

`outputRef`：`obs:summarize_images:{nodeId}`

```json
{
  "panelVersion": 1,
  "layout": { "rows": 2, "cols": 2, "cellPx": 512, "fit": "contain" },
  "cells": [
    {
      "index": 1,
      "url": "https://…",
      "status": "ok",
      "summary": "运单号 SF123…",
      "legible": true,
      "cached": false
    }
  ],
  "omittedCount": 0,
  "omittedUrls": [],
  "timing": { "fetchMs": 120, "renderMs": 40, "visionMs": 8000, "totalMs": 8200 },
  "visionError": null
}
```

- Chat 执行中会推 think：**「正在识别图片（N 张）…」**  
- Page 走 workflow 节点 start/complete SSE（与其它节点一致）  
- Chat：`summarize` 会把 `workflowNodeOutputs`（含精简后的识图 cells）并入观测  
- `detect_clues`：priorOutputs **优先保留** `obs:summarize_images:*` 预算，避免被大体积 fetch 截掉  
- 下游 **无需改** clue 协议  

### 6.3 URL 从哪来（配置提示文案）

服务端 **协议级** 扫描 JSON 中的图片 URL（扩展名 / mime 像图），**不写死** `attachment` / `emailImage` 等业务键名。  
若业务要稳定出现在扫描结果里，C 端 / Tool 响应应使用通用形态，例如：

```json
{ "url": "https://cdn.example.com/a.png", "mimeType": "image/png" }
```

管理台帮助文案可写：「请确保上游 Tool 或 pageContext 中图片以可识别的 URL 形式返回。」

---

## 7. TypeScript（可直接给管理台）

```typescript
export type SummarizeImagesFrom = 'upstream' | 'page_context' | 'all';
export type SummarizeImagesOnFailure = 'degrade' | 'fail';

/** Workflow 节点 input：action === 'summarize_images' */
export type SummarizeImagesNodeInput = {
  from?: SummarizeImagesFrom;
  maxCells?: number;      // 1..6，默认 6
  cellPx?: number;        // 128..1024，默认 512
  hint?: string;
  onFailure?: SummarizeImagesOnFailure; // 默认 degrade
  cacheTtlSec?: number;   // 0..604800，默认 86400；0=关缓存
};

/** 节点库条目建议 */
export const SUMMARIZE_IMAGES_PALETTE = {
  action: 'summarize_images' as const,
  label: '图片识别',
  description: '扫描上游/页内图片并多模态摘要（需拖入画布才开启）',
  profiles: ['page_action', 'chat_skill', 'shared'] as const,
  requiresToolBinding: false,
  requiresHostToolBinding: false,
};
```

`WorkflowActionKind` 并集中需包含 `'summarize_images'`（见 [frontend-workflow-config-guide.md](./frontend-workflow-config-guide.md) §10）。

---

## 8. FAQ

**Q：不配这个节点，环境要不要装 sharp / VL？**  
A：不用。未配节点不会调用；进程启动也不强制加载 sharp。

**Q：能不能做成 Skill 级开关，而不是节点？**  
A：第一期以 **画布节点 = 开关** 为准，便于审核「这一步会不会识图、多贵」。

**Q：Plan / 动态编排会自动加识图吗？**  
A：**不会。** 无 Workflow 资产时 Plan LLM 不会推断本节点；只有资产里配置了才会跑。

**Q：`onFailure` 选什么？**  
A：默认 **`degrade`**（识图挂了流程还能答）；仅当「没图摘要就不能继续」时选 `fail`。

**Q：和 `detect_clues` 谁先谁后？**  
A：一般 **先识图再状态识别**，让线索判定能读到图片摘要；也可识图后直接 `summarize`。

---

## 9. 附录：拼图 / 环境（实施参考）

| 项 | 说明 |
|----|------|
| 面板协议 | IMAGE_PANEL/v1；最多 6 格；固定 `cellPx` + contain |
| 环境开关 | `ENABLE_IMAGE_PANEL_VISION`（默认开；`0` 则 degrade） |
| 摘要缓存 | 进程内 Map；`cacheTtlSec` + 硬顶 `IMAGE_PANEL_SUMMARY_CACHE_MAX`（默认 256）+ 单条摘要 ≤2000 字 |
| 模型 | 需后台启用的 **多模态** chat 配置（支持 `image_url`） |
| 部署 | 要用识图时基础镜像需含 sharp；仅推 dist 不够 |

更多服务端细节见仓库实现：`src/core/image-panel/*`、`src/core/workflow/executors/summarize-images.executor.ts`。
