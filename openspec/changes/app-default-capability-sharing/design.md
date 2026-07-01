## 上下文

### 当前状态

| 资源 | 存储归属 | Agent 关系 | 空绑定时的运行时 |
|------|----------|------------|------------------|
| HTTP `Tool` | `appClientId` | `AgentTool` 白名单 | **无 Tool** |
| `HostTool` | `appClientId` | `AgentHostTool` 白名单 | **无 HostTool** |
| `Skill` | `agentId`（FK） | 无中间表（`AgentSkill` 已删） | 仅该 Agent 名下 Skill |

配置路径：`POST /tool` → `PUT agent/tools` → `POST /agent/:id/skills` + `PUT skill/tools` + `PUT skill/host-tools`。

运行时收窄已有：显式 Skill → `SkillTool`；主循环 → `filterToolsByAgentMetadata` + bind 召回（默认 Top-5）；Host → `pageScope` + `SkillHostTool`。但 **候选池** 仍被 Agent 白名单卡死。

历史：`20260603140000_skill_agent_owned` 将 Skill 从 App+`AgentSkill` 改为 Agent 独占；本次在 App 共享原则下 **部分回滚 Skill 归属**，但保留可选 `AgentSkill` 作收紧手段。

### 约束

- 用户授权继续由 `RoleTool` / `RoleHostTool` / `RoleSkill` + `allowToolLevel` 承担，不弱化。
- `PageAction` 不走 Agent 能力图，保持不变。
- 遵守仓库规则：不在引擎代码硬编码意图短语；bind 档位继续走 env / `IntentRecallConfig`。
- 存量租户需可迁移，多 Agent 差异化能力需可保留。

## 目标 / 非目标

**目标：**

- B 端默认心智：**在 App 注册能力 → 配 Role → 配 Skill 编排**；Agent 绑定为可选高级项。
- 统一三套资源的解析函数签名与语义（`resolveAgentToolCandidates`、`resolveAgentHostToolCandidates`、`resolveAgentSkillCandidates`）。
- 存量「已绑 Agent 白名单」的租户行为不变；「空绑定导致无工具」的单 Agent 租户获得 **行为升级**（自动可用 App 能力）。
- 大工具集下 LLM bind 仍保持个位数；修复 unclear / 召回失败全量兜底。

**非目标：**

- 不删除 `AgentTool` / `AgentHostTool` / `AgentSkill` 表。
- 不在本次实现 Skill 的 Agent 级 prompt overlay（可后续增量）。
- 不改造 `PageAction`、Workflow 入口契约。
- 不调整 `Role*` 授权模型语义。

## 决策

### 决策 1：统一解析策略 — App 默认 + 可选收紧

```
候选池(agent, user, app) =
  if agent.restrict{X} OR agent{X}Bindings.nonEmpty:
    appActive{X} ∩ agent{X}Bindings
  else:
    appActive{X}
  then ∩ roleAllowed{X}(user)
  then ∩ skillBindings (编排/运行时阶段)
```

`{X}` ∈ `Tools` | `HostTools` | `Skills`。

**收紧判定：**

- 显式字段优先：`Agent.restrictTools`、`restrictHostTools`、`restrictSkills`（默认 `false`）。
- 兼容期：若对应绑定表非空且 `restrict*` 未显式设置，视为 `true`（与存量一致）。

**备选：**

- 仅依赖绑定表非空、不加 `restrict*` 字段：无法表达「收紧模式下故意空列表」，放弃。
- 彻底删除 Agent 绑定表：无法多 Bot 粗分域，放弃。

### 决策 2：Skill 迁回 App 归属 + 恢复 `AgentSkill`

- `Skill` 增加 `appClientId`（NOT NULL），`@@unique([appClientId, name])`、`@@unique([appClientId, capabilityKey])`。
- 恢复 `AgentSkill(agentId, skillId)`，仅收紧模式使用。
- `Skill.agentId`：迁移后 **删除** 或保留可空只读一版本；新代码不再写入。

**备选：**

- 保留 `Skill.agentId` 作所有权：与 App 共享心智冲突，放弃。
- 仅 `appClientId` 无 `AgentSkill`：多 Agent 无法分 Skill 域，放弃。

### 决策 3：SkillTool gate 改为 App 候选池

创建/更新 Skill 时：

```
assertSkillToolsSubset(skillToolIds) ⊆ resolveAgentToolCandidates(agentId, adminUserOrBypass)
```

管理端创建 Skill 时若无 `agentId` 上下文，校验 `toolId ⊆ appActiveTools`。

移除 `assertToolsBoundToAgent` 对 `AgentTool` 的硬依赖。

### 决策 4：Catalog 缓存键与 revision

- Tool/HostTool catalog：仍以 `(appClientId, agentId)` 为缓存键，但 `buildFromDb` 在默认模式下加载 **App 全量 active** 再套收紧规则。
- Skill catalog：键改为 `(appClientId, agentId, roleId)`；`querySkills` 改为 `appClientId` + 可选 `AgentSkill` 过滤。
- Revision 指纹需包含 App 级 Tool/Skill revision，避免某 Agent 空绑定时缓存陈旧。

### 决策 5：C 端 `findClientAvailableAgentsForUser`

当前：`RoleTool ∩ AgentTool` 非空才列出 Agent。

改为：`RoleTool ∩ resolveAgentToolCandidates(agent)` 非空才列出。  
默认模式下 Agent 空绑定不再导致从列表消失（只要 Role 有 Tool 且 App 有 Tool）。

### 决策 6：大工具集运行时

| 场景 | 现行为 | 新行为 |
|------|--------|--------|
| intent unclear | 全集 bind | 必须走 metadata 过滤 + bind 召回 Top-K；禁止 > `bindToolsMax` |
| bind 召回失败 | fallback 全集 | fallback 为空或 Top-K 只读类 Tool，并打 observability |
| 显式 Skill | SkillTool only | 不变 |
| 候选池 > 80 | 无特殊处理 | 文档建议 `restrictTools` 分 Agent 或强化 Category/Skill |

环境变量保持：`AGENT_BIND_FULL_MAX`、`AGENT_BIND_RECALL_MAX`、`AGENT_BIND_TOOLS_MAX`。

### 决策 7：B 端 API 面

| 现路径 | 新路径 / 行为 |
|--------|----------------|
| `POST /agent/:agentId/.../skills` | 保留；新增 **`POST /app-client/:appClientId/skills`** 为主推荐 |
| `GET /agent/:agentId/.../skills` | 保留；默认列表改 App 级 `GET /skill/by-app-client/:id` |
| Agent Tool 绑定 UI | 默认隐藏；`restrictTools=true` 时展示 |
| Skill 创建必填 agentId | App 级创建，`agentId` 可选（仅用于兼容或立即建 `AgentSkill`） |

## 风险 / 权衡

| 风险 | 缓解 |
|------|------|
| 空 `AgentTool` 的 Agent 从「无工具」变为「全 App 工具」 | 迁移说明 + changelog；需「零工具」的设 `restrictTools=true` 且白名单为空 |
| 多 Agent 下 Skill 迁 App 后串可见 | 迁移时为原 `agentId` 写入 `AgentSkill` 并设 `restrictSkills=true` |
| 候选池变大导致召回漏工具 | Skill 编排优先；调 bind 参数；大库用 Agent 分片 |
| Catalog 缓存失效范围变大 | App revision 驱动；变更 Tool 时按 app 扇出 invalidation |
| 与 `skill_agent_owned` 文档冲突 | 更新 `docs/skill-data-model.md` 与前端 changelog |

## 迁移计划

### Phase 1 — Schema

1. `Agent` 增加 `restrictTools`、`restrictHostTools`、`restrictSkills` BOOLEAN DEFAULT false。
2. `Skill` 增加 `appClientId`；回填 `UPDATE skill SET appClientId = agent.appClientId FROM agent`。
3. 创建 `AgentSkill`；`INSERT` 原 `skill.agentId` 关系。
4. 对「曾有 `AgentTool`/`AgentHostTool` 行」的 Agent 设 `restrictTools`/`restrictHostTools = true`。
5. 对「曾有 Skill 归属」的 Agent 设 `restrictSkills = true`（通过存在 `AgentSkill` 推断亦可）。
6. 删除 `Skill.agentId` 列（或保留一版只读后删）。

### Phase 2 — 运行时切换

1. 实现统一 `capability-candidate.util.ts`（或三文件共用一个 policy 模块）。
2. 改三个 catalog service + `host-tool-catalog-resolve.util` + `resolvePreferredHostToolIds`。
3. 改 `skill.service` query / assert / client list。
4. 改 `intent-scope.service` unclear 与 fallback 分支。
5. 改 `agent.service` `findClientAvailableAgentsForUser`。

### Phase 3 — 管理 API & 文档

1. App 级 Skill CRUD 路由。
2. B/C 文档与 breaking changelog。
3. 可选：管理端 feature flag 控制 UI 露出。

**回滚：** 保留 migration 前快照；运行时 feature flag `CAPABILITY_APP_DEFAULT=false` 切回旧解析（实现期保留 1 个版本）。

## 待确认问题

- `Skill.agentId` 列是迁移后立刻删除，还是保留一个版本仅只读展示？
- 新 Agent 默认 `restrictSkills=false`（可见 App 全部 Skill）是否可接受，还是新 Agent 默认 `true`？
- App 级 Skill 创建是否强制要求至少一个 `SkillTool` 或 `SkillHostTool`？
- `findClientAvailableAgentsForUser` 是否在「仅 HostTool、无 HTTP Tool」时也列出 Agent（需单独规则）？
