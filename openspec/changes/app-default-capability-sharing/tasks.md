## 1. Schema 与迁移

- [x] 1.1 `Agent` 增加 `restrictTools`、`restrictHostTools`、`restrictSkills`（默认 `false`）
- [x] 1.2 `Skill` 增加 `appClientId`；编写回填脚本（由 `agent.appClientId` 推导）
- [x] 1.3 新建 `AgentSkill` 表；自旧 `Skill.agentId` 回填关联
- [x] 1.4 迁移脚本：对存在 `AgentTool`/`AgentHostTool` 的 Agent 设置对应 `restrict*=true`
- [x] 1.5 迁移脚本：对存在 `AgentSkill` 的 Agent 设置 `restrictSkills=true`
- [x] 1.6 调整 `Skill` 唯一索引为 `appClientId+name` / `appClientId+capabilityKey`；删除或废弃 `Skill.agentId`
- [x] 1.7 生成并验证 Prisma migration

## 2. 统一候选解析模块

- [x] 2.1 新增 `capability-candidate.util.ts`（或 `src/core/runtime-cache/` 下等价模块），实现 Tool/HostTool/Skill 三套 `resolve*Candidates`
- [x] 2.2 实现 `CAPABILITY_APP_DEFAULT` 特性开关与旧行为分支
- [x] 2.3 单元测试：默认模式、收紧模式、空白名单、Role 交集

## 3. Catalog 服务改造

- [x] 3.1 改造 `agent-tool-catalog.service.ts` `buildFromDb` / `resolveAllowedToolsFromCatalog`
- [x] 3.2 改造 `agent-host-tool-catalog.service.ts` 与 `host-tool-catalog-resolve.util.ts`
- [x] 3.3 改造 `agent-skill-catalog.service.ts` `querySkills`（`appClientId` + `AgentSkill`）
- [x] 3.4 更新 `runtime-cache-invalidator.service.ts` App 级扇出失效策略
- [x] 3.5 更新 catalog revision 指纹包含 App 级实体变更

## 4. 引擎与 Host 运行时

- [x] 4.1 改造 `host-tool.service.ts` `resolvePreferredHostToolIds` 使用新 HostTool 候选池
- [x] 4.2 改造 `core/skill/skill.service.ts` 全部 `queryAgentSkills` / `queryPureHostSkills` 路径
- [x] 4.3 移除或替换 `modules/skill/skill.service.ts` 中 `assertToolsBoundToAgent`
- [x] 4.4 改造 `agent.service.ts` `findClientAvailableAgentsForUser`
- [x] 4.5 改造 `intent-scope.service.ts`：`unclear` 与 `bind_recall_error` 禁止全量 fallback
- [x] 4.6 验证 `requested-skill-run.service.ts` 显式 Skill 路径不受影响

## 5. 管理 API

- [x] 5.1 新增 `POST /app-client/:appClientId/skills`（及必要 PATCH 路由）
- [x] 5.2 调整 Skill DTO：创建时 `agentId` 可选；校验 `SkillTool` ⊆ App tools
- [x] 5.3 Agent 管理 API：暴露 `restrictTools` / `restrictHostTools` / `restrictSkills` 读写
- [x] 5.4 保留旧 Agent 路径并标记 deprecated（响应头或文档）

## 6. 文档与变更说明

- [x] 6.1 更新 `docs/skill-data-model.md` 关系图与 API 表
- [x] 6.2 更新 `docs/agent-skill-client-api-frontend.md`（`client/available` 行为）
- [x] 6.3 新增 `docs/frontend-changelog-app-default-capability-sharing.md`（BREAKING 说明）
- [x] 6.5 新增 `docs/app-default-capability-sharing-admin-frontend.md`（B 端配置对接）

## 7. 验证

- [x] 7.1 集成场景：单 Agent + 仅 App Tool/RoleTool，无 AgentTool 可正常 Chat
- [x] 7.2 集成场景：多 Agent + restrictTools 分片，各自候选池正确
- [x] 7.3 集成场景：Skill 迁移后原 Agent 可见集合不变
- [ ] 7.4 集成场景：大候选池 + unclear intent，bind 数量 ≤ `bindToolsMax`
- [x] 7.5 `npm run build` 通过
- [x] 7.6 本地 `prisma migrate deploy` 已执行（`20260630120000_app_default_capability_sharing`）
