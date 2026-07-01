# Skill ↔ Workflow 绑定校验与运行时 Scope 对齐

> 对应 V2 步序来源 `workflow_db` 与 C 端运行白名单（SkillTool / SkillHostTool）的一致性要求。  
> 实现：`validate-skill-workflow-binding.util.ts`、`WorkflowService.assertSkillWorkflowBindingsCompatible`。

---

## 1. 问题背景

Skill 绑定 `workflowId` 后，`workflow_init` 从 DB 加载 Workflow 并做 **scope 校验**（`validate-workflow-against-scope`）：

- 节点 `fetch_data.input.toolId` 须在 `scopedAllowedToolIds`（来自 **SkillTool**）
- 节点 `generate_and_push.input.hostToolId` 须在 `scopedHostTools`（来自 **SkillHostTool** + 页面 scope）

若 B 端只配了 WorkflowHostTool（如 `fillReplyDraft id=4`）但未在 Skill 上绑 `SkillHostTool`，或 C 端页面 scope 只有 `fillNoteDraft id=3`，会出现：

| 阶段 | 旧行为 | 现行为 |
|------|--------|--------|
| B 端保存 | 无校验，配置可入库 | **拒绝保存**，返回 `SKILL_WORKFLOW_BINDING_INCOMPATIBLE` |
| C 端 `workflow_init` | `db_load_failed` → 误导 summarize | **scope_incompatible** → 回退 `plan_compile`；资产缺失仍硬失败 |
| summarize | step 名 `plan:step_0` + plan 上下文 | skip 时 step 名 `workflow_init_skipped:*`，专用引导语 |

---

## 2. 保存期校验规则

### 2.1 校验函数

`validateSkillWorkflowBinding()` 检查四类约束：

1. 每个 **WorkflowTool** 的 `toolId` ∈ **SkillTool**
2. 每个 **WorkflowHostTool** 的 `hostToolId` ∈ **SkillHostTool**
3. 每个节点引用的 **toolId**（fetch / compose / write）∈ **SkillTool**
4. 每个节点引用的 **hostToolId**（generate_and_push）∈ **SkillHostTool**

与 Workflow 自身保存校验（节点引用须在 WorkflowTool/WorkflowHostTool 表内）互补：Workflow 管节点级绑定，Skill 管 C 端运行白名单。

### 2.2 触发入口

| API | 时机 |
|-----|------|
| `POST /admin/.../skills` | 创建且带 `workflowId` |
| `PATCH /admin/skill/:id` | 更新 `workflowId` / `workflowVersion` |
| `PUT /admin/skill/:id/tools` | Skill 已绑 `workflowId` |
| `PUT /admin/skill/:id/host-tools` | Skill 已绑 `workflowId` |
| `PATCH /admin/workflow/:id` | 修改 nodes / tools / hostTools 后，检查所有引用该 Workflow 的 active Skill |

### 2.3 错误码

```json
{
  "code": "SKILL_WORKFLOW_BINDING_INCOMPATIBLE",
  "message": "Skill tool bindings do not cover Workflow requirements...",
  "workflowId": 1,
  "issues": [
    {
      "path": "skillHostTools",
      "code": "workflow_host_tool_not_in_skill",
      "message": "WorkflowHostTool hostToolId=4 must be bound on Skill (SkillHostTool)"
    }
  ]
}
```

Workflow 更新破坏已有 Skill 时：

```json
{
  "code": "WORKFLOW_CHANGE_BREAKS_SKILL_REFERENCES",
  "skillId": 3,
  "issues": [ ... ]
}
```

---

## 3. 运行时加载（`loadWorkflowForRunDetailed`）

| 失败原因 | 含义 | `workflow_init` 行为 |
|----------|------|----------------------|
| `asset_missing` | Workflow 不存在或未激活 | 硬失败 `db_load_failed` |
| `revision_missing` | pin 的 `workflowVersion` 无 revision | 硬失败 |
| `empty_nodes` | nodes 为空 | 硬失败 |
| `scope_incompatible` | 节点 tool/host 不在当前 run scope | **回退 `plan_compile`** |
| 加载成功 | — | `source=workflow_db` |

`resolveSkillWorkflowForInit()` 三分支 + scope 细分，不再把 scope 问题与资产缺失混为同一 `load_failed`。

---

## 4. B 端配置建议（Skill #3 类问题修复清单）

1. **SkillHostTool** 包含 Workflow 所有 `generate_and_push` 用到的 hostTool（如 `fillReplyDraft`）。
2. **SkillTool** 包含 Workflow 所有 `fetch_data` 用到的 HTTP tool。
3. **WorkflowTool / WorkflowHostTool** 与节点 `input` 一致（Workflow 保存期已校验）。
4. C 端页面 `pageContext` 须能解析到对应 Host Tool（页面 scope 是运行时第二层过滤，B 端 Skill 绑定是必要非充分条件）。
5. 若 intentionally 只用 prompt 步序：不要绑 `workflowId`，或确保上述对齐后再绑。

---

## 5. 相关文件

| 文件 | 职责 |
|------|------|
| `src/core/workflow/validate-skill-workflow-binding.util.ts` | 保存期纯函数校验 |
| `src/core/workflow/load-workflow-definition.util.ts` | `loadWorkflowForRunDetailed` 失败原因 |
| `src/core/workflow/workflow-init-skill.util.ts` | init 解析 `scope_incompatible` |
| `src/core/agent-engine/.../workflow-init.node.ts` | scope 回退 plan_compile |
| `src/core/workflow/workflow-init-skip.util.ts` | skip 原因与 summarize 引导语 |
| `src/modules/workflow/workflow.service.ts` | Admin 保存入口 |
| `src/modules/skill/skill.service.ts` | Skill CRUD / tools |
| `src/modules/host-tool/host-tool.service.ts` | SkillHostTool 替换 |

---

## 6. 测试

```bash
npm run build
npx jest src/core/workflow --no-cache
```

关键单测：

- `validate-skill-workflow-binding.util.spec.ts`
- `workflow-init-skill.util.spec.ts`（含 `scope_incompatible`）
- `workflow-init-skip.util.spec.ts`
