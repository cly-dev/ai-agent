# Skill 数据模型与关联

## 关系图

```text
AppClient
  ├── Agent
  │     ├── AgentTool → Tool
  │     └── Skill (agentId, @@unique([agentId, name]))
  │           └── SkillTool → Tool（须 ∈ AgentTool）
  └── Tool

Role
  └── RoleSkill → Skill（可选；运行时未接入）
```

## 管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/agent/:agentId/app-client/:appClientId/skills` | 创建 Skill |
| GET | `/agent/:agentId/skills/client` | C 端：按 Agent + 用户角色返回可见 Skill 摘要（见 [agent-skill-client-api-frontend.md](./agent-skill-client-api-frontend.md)） |
| GET | `/agent/:agentId/app-client/:appClientId/skills` | Agent 下分页列表 |
| GET | `/skill/by-app-client/:appClientId?agentId=` | App 维度汇总列表 |
| GET | `/skill/:skillId` | 详情 |
| PATCH | `/skill/:skillId` | 更新元数据 |
| PUT | `/skill/:skillId/tools` | 全量替换 SkillTool |
| DELETE | `/skill/:skillId` | 删除 |

## 风险等级与写操作确认

- **Skill.riskLevel**、**Tool.riskLevel** 使用同一枚举 `L1 | L2 | L3`。
- 创建/替换 SkillTool 时，若未传 `riskLevel`，按关联 Tool 的最高档自动推断。
- 响应字段 **`requiresWriteConfirmation`**：`riskLevel` 为 L2/L3 时为 true（Skill）；Tool 另计 `isMutation` 元数据。
- **运行时**：拟执行写操作 Tool 时暂停；Redis 存 `resumeContext`（steps、observations、scopedToolIds、`skillApplied`、`activeSkillPrompt` 等）+ 待写 `toolCalls`；SSE `confirmation_required` 仅含 `message`。
  - 确认：`confirmWrite: true` → `resumeAfterWriteConfirm`：先执行写 Tool，再开第二轮 graph（`llm ⇄ tools ⇄ summarize`，同一 turn 下 `worker` run）。
  - 新消息：仅 `run()`，并 `clear` 未确认 pending。
  - 取消：`cancelWrite: true`；过期确认：`WRITE_CONFIRMATION_EXPIRED`。

## 响应展示字段

列表/详情除 `appClientId`、`agentId` 外，提供 **`appClientName`**、**`agentName`**，前端「所属项目」列请用 `appClientName`（如 `PMS`），勿直接展示 `appClientId`。完整对象见嵌套 `appClient`、`agent`。

## 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 同一 Agent 内唯一 |
| `prompt` | 是 | 命中后注入 `<active_skill>` |
| `description` | 否 | 召回与 Plan goal 摘要 |
| `capabilityKey` | 否 | 同一 Agent 内唯一 |
| `riskLevel` | 否 | `L1`/`L2`/`L3`；含写建议 `L2`+ |
| **`config`** | **否** | **可选 JSON**（`Skill.config`）。可含 `deliverable`、`workflow.steps` 显式 Plan；**管理端未接入时可为 `null`，运行时按 gated 工具角色自动推断**（如 read-detail + write → read→write→summarize） |
| `tools` | 否 | 创建时初始 SkillTool 绑定 |

`GET/PATCH /skill/:id` 响应均含 `config`（无配置时为 `null`）。

## 校验约定

1. **Tool 权限（运行时）**：`AgentTool ∩ RoleTool ∩ allowToolLevel`（不变）。
2. **SkillTool 配置**：`toolId` 必须已绑定到该 Agent 的 `AgentTool`，且 Tool 属于同一 `appClientId`。
3. **`capabilityKey`**：可选，同一 Agent 内唯一；供后续 Role 按能力键授权（未接运行时）。
4. **删除 Agent**：级联删除其下全部 Skill。

## 运行时（LangGraph）

```text
START → intent（收窄 scopedTools）
     → plan（外层编排：kind=skill | tool | summarize）
     → readiness → llm ⇄ resultCheck ⇄ tools → summarize
```

完整 Plan 节点原理与配置见 **[plan-node.md](./plan-node.md)**。

### Skill 如何进入执行（无独立 skill 图节点）

1. **intent** 按类目召回收窄 `scopedTools`。
2. **plan** 调用 `listAvailableSkillsForScopedTools`：`SkillTool ∩ scopedTools` + 可选 `RoleSkill` 白名单 → `availableSkills` 写入 Plan LLM prompt。
3. 外层 Plan LLM 输出 `kind=skill` 步 + `skillId`（须 ∈ `availableSkills`）；校验失败则整份 outer plan 作废并 minimal 兜底。
4. **`expandPendingSkillStepIfNeeded`**（在 plan/readiness/llm/resultCheck 入口）：`getAvailableSkillById` → `bindSkillToScopedTools` → `resolveTaskPlan` 生成内层步序 → `pushPlanFrame`。
5. 内层帧执行完毕 → `popPlanFrameIfInnerComplete`，外层下一 `kind=skill` 步重复上述展开。

**不做向量召回选 skill**；由 Plan LLM 在 `availableSkills` 列表中编排 `kind=skill` 步。

### 关键 API（`SkillService`）

| 方法 | 用途 |
|------|------|
| `listAvailableSkillsForScopedTools` | Plan 外层候选列表 |
| `getAvailableSkillById` | 展开 skill 帧时二次校验 |
| `bindSkillToScopedTools` | 将 scopedTools 收窄到 skill 工具子集 |
| `listAgentSkillsForUser` | Session prepare 预热（不按 tool 过滤） |

- 写确认续跑：Redis `resumeContext` 含 `skillApplied` / `activeSkillPrompt` / `taskPlan`（含 `frames`）等，确认后 graph 恢复 Plan 栈状态。

## 模板样例

| 场景 | 文件 |
|------|------|
| 评论分析（列表 + content 解读） | [skill-templates/review-analyze-skill.example.md](./skill-templates/review-analyze-skill.example.md) |
| 评论回复（与评论分析配对） | [skill-templates/review-reply-skill.example.md](./skill-templates/review-reply-skill.example.md) |

## 迁移

- `20260603120000_skill_app_client_relations`：历史 Skill 按 App 隔离。
- `20260603140000_skill_agent_owned`：Skill 改归属 `agentId`，移除 `appClientId` 与 `AgentSkill` 表。
