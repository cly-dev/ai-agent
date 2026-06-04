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
- **运行时**：拟执行写操作 Tool 时暂停；SSE `action: confirmation_required` 仅含 `message`（不返回 Tool 列表），前端弹窗「确认 / 取消」即可。
  - 确认：`POST .../messages` 且 `confirmWrite: true`（`content` 可为空）
  - 取消：`cancelWrite: true`（清除待执行缓存，不调用 Tool；无 pending 时不推送 SSE）
  - 过期确认：无 pending 时 SSE `error`，`code: WRITE_CONFIRMATION_EXPIRED`
  - 用户改问其它问题（普通新消息）：服务端自动清除未确认的 pending

## 响应展示字段

列表/详情除 `appClientId`、`agentId` 外，提供 **`appClientName`**、**`agentName`**，前端「所属项目」列请用 `appClientName`（如 `PMS`），勿直接展示 `appClientId`。完整对象见嵌套 `appClient`、`agent`。

## 校验约定

1. **Tool 权限（运行时）**：`AgentTool ∩ RoleTool ∩ allowToolLevel`（不变）。
2. **SkillTool 配置**：`toolId` 必须已绑定到该 Agent 的 `AgentTool`，且 Tool 属于同一 `appClientId`。
3. **`capabilityKey`**：可选，同一 Agent 内唯一；供后续 Role 按能力键授权（未接运行时）。
4. **删除 Agent**：级联删除其下全部 Skill。

## 迁移

- `20260603120000_skill_app_client_relations`：历史 Skill 按 App 隔离。
- `20260603140000_skill_agent_owned`：Skill 改归属 `agentId`，移除 `appClientId` 与 `AgentSkill` 表。
