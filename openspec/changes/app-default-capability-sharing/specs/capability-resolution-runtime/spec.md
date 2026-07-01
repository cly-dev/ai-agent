## 新增需求

### 需求:运行时必须使用统一能力候选解析策略

Agent 引擎、catalog 服务与 HostTool 解析路径必须共用同一套「App 默认 + Agent 收紧 + Role 授权」语义，禁止在 Tool、HostTool、Skill 上实现相互矛盾的可见性规则。

#### 场景:Tool catalog 与 session allowed tools 一致

- **当** 同一 `appClientId`、`agentId`、`userId` 请求 Tool catalog 与会话 allowed tools
- **那么** 两者使用的 HTTP Tool 候选池规则必须一致

#### 场景:HostTool resolvePreferred 与 catalog 一致

- **当** `resolvePreferredHostToolIds` 与 `AgentHostToolCatalog` 对同一 Agent 解析
- **那么** Agent 级 HostTool 候选池必须一致

### 需求:显式 Skill 运行路径必须仅使用 Skill 绑定工具

当用户或 Plan 指定 `skillId` 时，系统必须仅将 `SkillTool` / `SkillHostTool`（与用户权限、Host 候选池 gate 后）作为本轮 scoped tools，禁止回退到 App 全量 Tool 进行 intent bind。

#### 场景:请求带 skillId 的 Chat

- **当** `POST /chat` 或消息体传入合法 `skillId`
- **那么** scoped HTTP tools 必须来自 `SkillTool ∩ 用户可用 Tool`，且不得对全量候选池执行 intent bind 替换该集合

### 需求:Intent 主循环在候选池较大时必须限制 bind 数量

当进入 intent 主循环且未锁定 Skill 时，系统必须通过 metadata 过滤与 bind 召回将 bind 给 LLM 的 Tool 数量限制在配置上限内。

#### 场景:候选 Tool 数量超过 AGENT_BIND_FULL_MAX

- **当** metadata 过滤后候选 Tool 数量大于 `AGENT_BIND_FULL_MAX`
- **那么** 系统必须执行 `recallTopToolsForBind` 并将结果数量限制在 `min(AGENT_BIND_RECALL_MAX, bindToolsMax)` 以内

### 需求:Intent 不清晰时禁止全量 bind 大候选池

当用户意图被判定为 `unclear` 时，系统禁止将完整 Tool 候选池（未截断）bind 给 LLM；必须使用与 intent 主循环相同的截断策略或返回空 bind 集合并走澄清路径。

#### 场景:候选池 50 个 Tool 且意图 unclear

- **当** Agent 候选池含 50 个 Tool 且 `isUserIntentClear` 为 false
- **那么** bind 给 LLM 的 Tool 数量不得超过 `bindToolsMax`，禁止 50 个全量 bind

### 需求:Bind 召回失败时禁止无界 fallback 到全候选池

当 `recallTopToolsForBind` 抛出异常或返回空且候选池大于 `AGENT_BIND_FULL_MAX` 时，系统禁止 fallback 到完整候选池；必须返回空集或受限只读子集并记录 `fallbackReason`。

#### 场景:向量召回失败且候选 100 个 Tool

- **当** bind 召回失败且候选池数量为 100
- **那么** 系统不得 bind 100 个 Tool；必须返回受限结果并写入可观测日志字段 `fallbackReason=bind_recall_error`

### 需求:Catalog 缓存必须在 App 级资源变更时失效

当 App 下 Tool、HostTool 或 Skill 发生创建、更新、`isActive` 切换或删除时，系统必须使该 `appClientId` 下相关 Agent catalog 缓存失效，确保默认共享模式下不出现陈旧全集或缺失新资源。

#### 场景:App 新增 Tool 后 Agent 无 AgentTool

- **当** 在 App 下新增 active Tool 且 Agent 处于默认 Tool 模式
- **那么** 下一次 `resolveAllowedTools` 必须包含新 Tool（在 Role 允许前提下）

### 需求:必须提供运行时特性开关以支持回滚

系统必须提供环境变量或配置项（如 `CAPABILITY_APP_DEFAULT`），在关闭时恢复变更前的「空 Agent 绑定 = 无能力」解析行为，用于迁移期回滚。

#### 场景:生产事故回滚

- **当** 运维将 `CAPABILITY_APP_DEFAULT=false`
- **那么** 空 `AgentTool` 的 Agent 必须恢复为无 HTTP Tool 候选池的旧行为

## 修改需求

## 移除需求

### 需求:AgentTool 为空时 Tool catalog 返回空集

**Reason**: 由 App 默认共享策略取代。

**Migration**: 启用 `CAPABILITY_APP_DEFAULT`；对需保持「无工具」的 Agent 设置 `restrictTools=true` 且清空白名单。

### 需求:AgentHostTool 为空时 HostTool 候选池为空

**Reason**: 由 App 默认共享策略取代。

**Migration**: 同上，使用 `restrictHostTools`。
