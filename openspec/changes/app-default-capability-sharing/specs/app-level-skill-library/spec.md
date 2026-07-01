## 新增需求

### 需求:Skill 必须归属 AppClient

每个 Skill 记录必须关联 `appClientId`；同一 App 内 `name` 与 `capabilityKey`（非空时）必须唯一。

#### 场景:App 级创建 Skill

- **当** 管理员通过 `POST /app-client/:appClientId/skills` 创建 Skill
- **那么** 系统必须将 Skill 写入该 `appClientId`，且不得要求指定 `agentId`

#### 场景:同 App 下 Skill 名称冲突

- **当** 创建与已有 Skill 相同 `name` 的 Skill（同一 `appClientId`）
- **那么** 系统必须拒绝并返回冲突错误

### 需求:Skill 默认对 App 内 Agent 可见且可通过 AgentSkill 收紧

当 Agent 未启用 Skill 收紧时，系统必须将 App 下全部 `isActive=true` 的 Skill 作为该 Agent 的 Skill 候选集；收紧时仅 `AgentSkill` 白名单可见。

#### 场景:Agent 未收紧且无 AgentSkill

- **当** Agent 的 `restrictSkills=false` 且无 `AgentSkill` 记录
- **那么** `listAgentSkillsForUser` 的候选集必须包含 App 下全部 active Skill（再应用 RoleSkill 规则）

#### 场景:Agent 启用 Skill 收紧

- **当** Agent 的 `restrictSkills=true` 或迁移遗留的 `AgentSkill` 记录存在（兼容期）
- **那么** 仅 `AgentSkill` 中的 Skill 可进入该 Agent 的候选集

### 需求:用户 RoleSkill 必须在 Skill 候选集之后过滤

当 Role 配置了 `RoleSkill` 时，系统必须仅返回 `RoleSkill` 白名单内的 Skill；未配置 `RoleSkill` 时不得按 Role 额外过滤 Skill。

#### 场景:Role 配置了 RoleSkill

- **当** 用户 Role 存在至少一条 `RoleSkill` 记录
- **那么** C 端 `GET /agent/:agentId/skills/client` 必须仅返回候选集与 `RoleSkill` 的交集

#### 场景:Role 未配置 RoleSkill

- **当** 用户 Role 无 `RoleSkill` 记录
- **那么** 系统必须返回 Agent Skill 候选集中全部 active Skill（subject to runnable 过滤）

### 需求:SkillTool 与 SkillHostTool 必须为 App 候选池子集

创建或更新 Skill 的 Tool / HostTool 绑定时，系统必须校验绑定目标属于 App 级可用资源，禁止要求事先配置 `AgentTool` / `AgentHostTool`。

#### 场景:创建 Skill 绑定 App Tool

- **当** Tool 属于该 App 且 `isActive=true`，且 Agent 处于默认 Tool 模式
- **那么** 必须允许将该 Tool 写入 `SkillTool`，无需存在 `AgentTool` 记录

#### 场景:绑定其他 App 的 Tool

- **当** `toolId` 不属于 Skill 所在 `appClientId`
- **那么** 系统必须拒绝绑定

### 需求:AgentSkill 表必须作为可选收紧手段保留

系统必须提供 `AgentSkill` 多对多关系，用于多 Agent 场景下限制可见 Skill 子集；禁止将 Skill 永久强绑定到单一 `agentId` 字段作为唯一可见性机制。

#### 场景:迁移后原 Agent 独占 Skill

- **当** 迁移脚本处理旧 `Skill.agentId` 数据
- **那么** 必须为每条旧关系创建对应 `AgentSkill` 记录，并将原 Agent 标记为 Skill 收紧模式，以保证可见 Skill 集合与迁移前一致

### 需求:B 端主路径必须以 App 能力库为中心

B 端文档与推荐 API 必须以 App 级 Skill 列表与创建为主路径；按 Agent 创建 Skill 的接口可保留但必须标注为兼容或高级用途。

#### 场景:运营配置新能力包

- **当** 管理员在 B 端新增「订单查询」Skill
- **那么** 推荐流程必须为：App 级创建 Skill → 绑定 SkillTool/SkillHostTool → 配置 RoleSkill（可选），无需先进入 Agent 绑定页

## 修改需求

## 移除需求

### 需求:Skill 通过 agentId 强归属单一 Agent

**Reason**: 与 App 内共享能力库目标冲突；由 `appClientId` + 可选 `AgentSkill` 替代。

**Migration**: 回填 `appClientId`；从 `agentId` 生成 `AgentSkill`；删除或废弃 `Skill.agentId` 列；更新 B 端创建表单默认不再选择 Agent。
