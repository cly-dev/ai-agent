## 为什么

当前能力配置链路为 **App 注册 Tool/HostTool → Agent 再绑一遍 → Skill 再绑 Tool/HostTool**，且 `AgentTool` / `AgentHostTool` 为空时运行时 **无任何工具**。`Skill` 又通过 `agentId` 强归属某个 Agent，多 Agent 场景需重复建能力包。三层重复绑定导致 B 端配置心智负担重、易漏配，与「租户边界在 App、用户权限在 Role、编排在 Skill」的实际语义不一致。

## 变更内容

- 引入统一的 **App 默认共享 + Agent 可选收紧** 能力解析策略，适用于 HTTP `Tool`、`HostTool`、`Skill`。
- **BREAKING（行为升级）**：`AgentTool` / `AgentHostTool` 为空时，候选池改为 App 下全部 `isActive` 能力（再与 `Role*` 求交），不再视为「无工具」。
- **BREAKING（Schema）**：`Skill` 增加 `appClientId` 归属；恢复可选 `AgentSkill` 白名单；`Skill.agentId` 迁移后废弃或改为可空遗留字段。
- 新增 Agent 级收紧开关（`restrictTools` / `restrictHostTools` / `restrictSkills`），或非空 `Agent*` 绑定表时自动进入白名单模式；存量有绑定的 Agent 保持原行为。
- 放宽 Skill 创建校验：`SkillTool` / `SkillHostTool` 须为 **App 候选池** 子集，不再要求先绑 `AgentTool`。
- 大工具集：收紧 intent `unclear` / 召回失败时的 **全量兜底**，禁止将数百 Tool 直接 bind 给 LLM。
- B 端 API / 文档：Skill 以 App 为主路径创建与列表；Agent 绑定移入「高级 / 多 Bot 隔离」。
- **不变**：`RoleTool` / `RoleHostTool` / `RoleSkill` 用户授权；`SkillTool` / `SkillHostTool` 编排；`PageAction` one-shot 直连。

## 功能 (Capabilities)

### 新增功能

- `app-default-tool-catalog`: HTTP Tool 与 HostTool 的 App 级默认可见性、Agent 可选白名单、catalog 构建与 C 端 Agent 列表规则。
- `app-level-skill-library`: Skill 归属 App、可选 `AgentSkill` 收紧、管理 API 与 C 端可见性规则。
- `capability-resolution-runtime`: 运行时统一解析（catalog、session scope、intent bind、Skill gate）、大工具集策略与兼容迁移。

### 修改功能

- 无（项目根目录尚无归档的 `openspec/specs/` 基线规范）

## 影响

- **数据库**：`prisma/schema.prisma`（`Skill.appClientId`、`AgentSkill` 表、`Agent.restrict*` 字段）；数据迁移脚本。
- **运行时缓存**：`agent-tool-catalog.service.ts`、`agent-host-tool-catalog.service.ts`、`agent-skill-catalog.service.ts` 及 resolve util。
- **Agent 引擎**：`intent-scope.service.ts`、`skill.service.ts`、`host-tool.service.ts`、`requested-skill-run.service.ts`、session prepare / turn contract。
- **管理模块**：`skill.service.ts`、`agent.service.ts`、Tool/HostTool/Skill 控制器与 DTO。
- **文档**：`docs/skill-data-model.md`、`docs/agent-skill-client-api-frontend.md`、B 端 skill/tool 管理文档；需新增 breaking changelog。
- **前端 B 端**：配置流程从「三级绑满」改为「App 能力库 + Role + Skill 编排 + 可选 Agent 收紧」。
