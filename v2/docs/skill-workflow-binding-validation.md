# Skill ↔ Workflow 绑定校验与运行时 Scope

> 对应 V2 步序来源 `workflow_db` 与 C 端运行权限的一致性要求。  
> 实现：`validate-skill-workflow-binding.util.ts`、`workflow-runtime-scope.util.ts`、`WorkflowService.assertSkillWorkflowBindingsCompatible`。

---

## 1. 两种 Skill 绑定模式

| 模式 | 配置 | 工具 SSOT | 保存期校验 | 运行时权限 |
|------|------|-----------|------------|------------|
| **workflow-only**（推荐） | `workflowId` + `prompt`，**可不绑** SkillTool / SkillHostTool | Workflow `nodes[].input` | 仅校验 Workflow 引用有效 | 节点 toolId / hostToolId ∩ 用户 Agent 权限 |
| **轻量 + 叠加层** | `workflowId` + SkillTool / SkillHostTool | Workflow 节点 + 可选 Skill 白名单收窄 | 若配置了 SkillTool，须 **覆盖** Workflow 节点引用 | 同上；ReAct scopedTools 可取叠加层 |

**原则：** 绑了 `workflowId` 后，Workflow 节点决定「执行哪些 toolId / hostToolId」；不再强制要求 SkillTool ⊇ Workflow。

---

## 2. 保存期校验规则

### 2.1 workflow-only Skill

`SkillTool` 与 `SkillHostTool` **均为空** 时：

- `assertSkillWorkflowBindingsCompatible` 只校验 `workflowId` 存在、同 App、激活、profile 与 `skill` 入口兼容；
- **不**调用 `validateSkillWorkflowBinding` 的四类覆盖检查；
- Workflow 更新时，`assertReferencingSkillsStillCompatible` **跳过** 该 Skill。

### 2.2 叠加层 Skill（显式 SkillTool / SkillHostTool）

若 Skill 上配置了任意 SkillTool 或 SkillHostTool，保存期仍执行完整覆盖校验：

1. 每个 **WorkflowTool** 的 `toolId` ∈ **SkillTool**
2. 每个 **WorkflowHostTool** 的 `hostToolId` ∈ **SkillHostTool**
3. 每个节点引用的 **toolId** ∈ **SkillTool**
4. 每个节点引用的 **hostToolId** ∈ **SkillHostTool**

用于「Workflow 固定步序 + Skill 额外收窄 ReAct 范围」场景。

### 2.3 触发入口

| API | 时机 |
|-----|------|
| `POST /admin/.../skills` | 创建且带 `workflowId` |
| `PATCH /admin/skill/:id` | 更新 `workflowId` / `workflowVersion` |
| `PUT /admin/skill/:id/tools` | Skill 已绑 `workflowId` 且 tools 非空 |
| `PUT /admin/skill/:id/host-tools` | Skill 已绑 `workflowId` 且 host-tools 非空 |
| `PATCH /admin/workflow/:id` | 修改 nodes 后，检查引用该 Workflow 的 **有叠加层** active Skill |

### 2.4 错误码

workflow-only Skill **不会**触发 `SKILL_WORKFLOW_BINDING_INCOMPATIBLE`（除非 Workflow 引用本身无效）。

叠加层不匹配时：

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

Workflow 更新破坏 **有叠加层** Skill 时：

```json
{
  "code": "WORKFLOW_CHANGE_BREAKS_SKILL_REFERENCES",
  "skillId": 3,
  "issues": [ ... ]
}
```

---

## 3. 运行时加载与权限

### 3.1 `workflow_init` scope

`workflow_init` 对 workflow-bound Skill 使用 **Agent 级** `ctx.input.allowedToolIds`（用户在该 Agent 下的 HTTP Tool 权限），不再用可能为空的 skill-scoped 列表。

Host Tool scope 仍来自当前页 `scopedHostTools`。

### 3.2 `loadWorkflowForRunDetailed`

| 失败原因 | 含义 | `workflow_init` 行为 |
|----------|------|----------------------|
| `asset_missing` | Workflow 不存在或未激活 | 硬失败 `db_load_failed` |
| `revision_missing` | pin 的 `workflowVersion` 无 revision | 硬失败 |
| `empty_nodes` | nodes 为空 | 硬失败 |
| `scope_incompatible` | 节点 tool/host 不在当前 run scope | **回退 `plan_compile`** |
| 加载成功 | — | `source=workflow_db` |

### 3.3 C 端 requestedSkill / 列表

| 阶段 | workflow-only Skill |
|------|---------------------|
| 技能列表 | 有 `workflowId` 即进入候选（不按空 SkillTool 过滤） |
| 发消息前 | `RequestedSkillRunService` 加载 Workflow，校验节点引用 ∩ 用户 HTTP + Agent Host 权限 |
| scopedTools | 取 Workflow 节点 toolId ∩ 用户 allowedTools（可为空，纯 Host Workflow） |

失败码：`SKILL_TOOLS_EMPTY`（用户无 Workflow 所需 tool / host 权限）。

---

## 4. PageAction ↔ Workflow（对照）

| 模式 | `hostToolId` | 保存期 | invoke |
|------|--------------|--------|--------|
| 轻量（无 Workflow） | 必填或自动创建 | — | 用 DB `hostToolId` |
| **workflow-only** | **可省略** | Workflow 须含 `generate_and_push` | 从 push 节点 `input.hostToolId` 推导 |
| 显式对齐 | 填写且须与 push 节点一致 | 同上 + hostToolId 匹配校验 | 优先 DB `hostToolId` |

实现：`validate-page-action-workflow-binding.util.ts`、`page-action-workflow-host.util.ts`。

---

## 5. B 端配置建议

### Skill

1. **固定步序**：只绑 `workflowId` + 写好 `prompt`，无需再维护 SkillTool（权限由 Agent 角色 + Workflow 节点决定）。
2. **需要收窄 ReAct**：额外配置 SkillTool / SkillHostTool 作为叠加层，保存时须覆盖 Workflow 节点引用。
3. C 端页面 Host 召回：纯 Host Workflow 仍依赖页面 `pageContext` 与节点 `hostToolId` 可 dispatch。

### PageAction

1. 绑 Workflow 后，`hostToolId` 可留空；UI 可展示 push 节点 hostTool 为只读预览。
2. 若手动填写 `hostToolId`，须与 push 节点一致。
3. 无 Workflow 时行为不变：须 `hostToolId` 或内联 `hostTool` 自动创建。

---

## 6. 相关文件

| 文件 | 职责 |
|------|------|
| `validate-skill-workflow-binding.util.ts` | 叠加层保存期校验 |
| `workflow-runtime-scope.util.ts` | 节点权限交集、scoped tool 收集 |
| `load-workflow-definition.util.ts` | `loadWorkflowForRunDetailed` |
| `workflow-init-skill.util.ts` | init 解析 |
| `workflow-init.node.ts` | Agent 级 allowedToolIds |
| `requested-skill-run.service.ts` | C 端 workflow Skill 可运行性 |
| `skill-runnable.util.ts` | 列表 / 召回 workflow 分支 |
| `page-action-workflow-host.util.ts` | invoke 推导 hostTool |
| `workflow.service.ts` | Admin 保存入口 |

---

## 7. 测试

```bash
npm run build
npx jest src/core/workflow --no-cache
```
