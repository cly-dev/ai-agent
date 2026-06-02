# Skill 数据模型与关联

## 关系图

```text
AppClient
  ├── Skill (appClientId, @@unique([appClientId, name]))
  │     ├── SkillTool → Tool (同 appClientId；isRequired 用于 gate)
  │     ├── AgentSkill → Agent (同 appClientId)
  │     └── RoleSkill → Role (全局角色；Skill 仍按应用隔离)
  ├── Agent → AgentSkill / AgentTool
  └── Tool → SkillTool / RoleTool / AgentTool

Role
  ├── RoleTool → Tool        （用户能调哪些 API，主授权）
  └── RoleSkill → Skill      （用户能激活哪些 Skill，可选）
```

## 运行时约定（下一步实现）

1. **Tool 权限**：`AgentTool ∩ RoleTool ∩ allowToolLevel`（不变）。
2. **Skill 候选**：`Agent 的 AgentSkill`；若启用 `RoleSkill` 再与 `UserApp.role` 求交。
3. **Skill 激活**：意图召回 + `SkillTool ∩ allowedTools` gate；通过则注入 `Skill.prompt`。
4. **同应用约束**：绑 `AgentSkill` / `SkillTool` 时校验 `skill.appClientId === agent.appClientId === tool.appClientId`。

## 迁移

`20260603120000_skill_app_client_relations`：已有 Skill 行回填为首个 `AppClient.id`。
