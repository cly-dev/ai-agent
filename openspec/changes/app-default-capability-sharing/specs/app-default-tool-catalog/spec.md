## 新增需求

### 需求:HTTP Tool 候选池默认采用 App 级全集

当 Agent 未启用 Tool 收紧时，系统必须将 App 下全部 `isActive=true` 且属于该 `appClientId` 的 HTTP Tool 作为该 Agent 的 Tool 候选池基础集合。

#### 场景:Agent 无 AgentTool 绑定且未收紧

- **当** Agent 的 `restrictTools=false` 且 `AgentTool` 表无该 Agent 记录
- **那么** Tool 候选池必须包含该 App 下所有 `isActive` 的 HTTP Tool（在后续 Role 过滤之前）

#### 场景:Agent 启用 Tool 收紧

- **当** Agent 的 `restrictTools=true` 或存在至少一条 `AgentTool` 记录（兼容期）
- **那么** Tool 候选池必须仅为 `AgentTool` 白名单与 App active Tool 的交集

#### 场景:收紧模式下白名单为空

- **当** `restrictTools=true` 且 `AgentTool` 无记录
- **那么** 该 Agent 的 HTTP Tool 候选池必须为空

### 需求:用户 Role 必须在 Tool 候选池之后过滤

系统必须在 Tool 候选池确定后，应用 `RoleTool` 与 `allowToolLevel` 规则，禁止用户调用未授权或超风险等级的 Tool。

#### 场景:Role 未授权 Tool

- **当** Tool 在 Agent 候选池中但不在用户 `RoleTool` 白名单内
- **那么** `resolveAllowedTools` 必须排除该 Tool

#### 场景:Tool 风险等级超过 Role 上限

- **当** Tool 的 `riskLevel` 高于用户 Role 的 `allowToolLevel` 允许范围
- **那么** 该 Tool 不得进入用户可用集合

### 需求:HostTool 候选池默认采用 App 级全集

当 Agent 未启用 HostTool 收紧时，系统必须将 App 下全部 `isActive=true` 的 HostTool 作为该 Agent 的 HostTool 候选池基础集合。

#### 场景:Agent 无 AgentHostTool 绑定且未收紧

- **当** Agent 的 `restrictHostTools=false` 且 `AgentHostTool` 表无该 Agent 记录
- **那么** HostTool 候选池必须包含该 App 下所有 `isActive` 的 HostTool

#### 场景:Agent 启用 HostTool 收紧

- **当** Agent 的 `restrictHostTools=true` 或存在至少一条 `AgentHostTool` 记录（兼容期）
- **那么** HostTool 候选池必须仅为 `AgentHostTool` 白名单与 App active HostTool 的交集

### 需求:AgentTool 与 AgentHostTool 表保留为可选收紧手段

系统禁止删除 `AgentTool` 与 `AgentHostTool` 表；在收紧模式下必须继续使用其作为白名单来源。

#### 场景:多 Agent 同 App 差异化工具面

- **当** 运营 Agent 配置 `restrictTools=true` 且 `AgentTool` 仅含写操作 Tool
- **那么** 客服 Agent 在默认模式下可见 App 全量 Tool，运营 Agent 仅可见白名单 Tool

### 需求:C 端可用 Agent 列表必须基于新候选池规则

`findClientAvailableAgentsForUser` 必须使用新 Tool 候选池与 `RoleTool` 交集判断 Agent 是否对用户可用，禁止仅因 `AgentTool` 为空而排除 Agent。

#### 场景:单 Agent App 仅配置 App Tool 与 RoleTool

- **当** App 有 active Tool、用户 Role 有 `RoleTool`、Agent 无 `AgentTool`
- **那么** 该 Agent 必须出现在 `GET /agent/client/available` 结果中

## 修改需求

## 移除需求
