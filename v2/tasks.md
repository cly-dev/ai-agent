## 1. 契约与核心库（PR0）

- [x] 1.1 创建 `src/core/workflow/workflow.types.ts`：`WorkflowActionKind`（8 种，见 `v2/workflow-action-kinds.md`）、`WorkflowNodeDef`、`WorkflowNodeStatus`、`WorkflowRunState`、`WorkflowProfile`
- [x] 1.2 创建 `src/core/workflow/workflow-node-input.types.ts` + `workflow-action-registry.ts`：8 种 action 的 `input` 类型；`WORKFLOW_ACTION_REGISTRY` 含 `implemented` 与 `allowedProfiles`
- [x] 1.3 实现 `src/core/workflow/validate-workflow.util.ts`：nodes 结构、action/input、profile 允许列表、绑定占位校验接口
- [x] 1.4 实现 `src/core/workflow/workflow-run.util.ts`：`initWorkflowRun`、`startWorkflowNode`、`completeWorkflowNode`、`failWorkflowNode`、`skipWorkflowNode`、`advanceWorkflowRun`、`finalizeWorkflowRun`
- [x] 1.5 实现 `src/core/workflow/apply-workflow-overrides.util.ts`：按 `workflowOverrides` 合并单节点 `objective`
- [x] 1.6 `src/core/workflow/compile-task-plan-from-workflow.util.ts`：Workflow → `TaskPlanStep[]`（Skill.workflowId 内层帧）
- [x] 1.7 实现 `src/core/workflow/legacy/import-skill-config-workflow.util.ts`：`parseSkillPlanConfig` → `WorkflowNodeDef[]`（迁移用）
- [x] 1.8 创建 `src/core/harness/harness.types.ts`：`HarnessContext`、`HarnessHook`、`HarnessSensor`、`HarnessPolicy`、`HarnessSensorResult`
- [x] 1.9 实现 `src/core/harness/harness-runner.ts`：`runNode` 编排 before/execute/after/onError
- [x] 1.10 实现 `src/core/harness/sensors/empty-fill.sensor.ts`、`tool-empty.sensor.ts`、`workflow-binding.sensor.ts`
- [x] 1.11 实现 `src/core/harness/policies/fail-fast.policy.ts`（Page 默认）与 `degrade.policy.ts`（Chat 占位）
- [x] 1.12 实现 `src/core/harness/trace/harness-trace.util.ts`：标准 trace 事件结构
- [x] 1.13 为 `workflow-run.util` 与 `validate-workflow` 添加单元测试（用户明确要求）
  - `workflow-run.util.spec.ts`
  - `validate-workflow.util.spec.ts`
  - `apply-workflow-overrides.util.spec.ts`
  - `workflow-action-registry.spec.ts`
  - PR2+ 待补：`compile-plan-to-workflow.util.spec.ts`、`workflow-plan-sync.util.spec.ts`、`validate-workflow-against-scope.util.spec.ts`（见 §8）

## 2. 数据层与 Admin API（PR1）

- [ ] 2.1 Prisma：新增 `Workflow`、`WorkflowRevision`、`WorkflowTool`、`WorkflowHostTool` 枚举与表
- [ ] 2.2 Prisma：`Skill` / `PageAction` 增加 `workflowId`、`workflowVersion`、`workflowOverrides`
- [ ] 2.3 Prisma：`PageActionRun` 增加 `workflowId`、`workflowVersion`、`workflowRun`（字段先落库，PR3 写入）
- [ ] 2.4 生成并执行 migration；`prisma generate`
- [ ] 2.5 新建 `src/modules/workflow/`：DTO、mapper、service、controller（`/admin/workflow` CRUD + revision 列表）
- [ ] 2.6 Workflow 保存时调用 `validateWorkflow` + binding 校验（toolId/hostToolId 存在于绑定表）
- [ ] 2.7 `Skill` create/update：可选 `workflowId`，校验 profile 与 Skill 能力一致
- [ ] 2.8 `PageAction` create/update：可选 `workflowId`，校验与 `hostToolId` / workflow 绑定一致
- [ ] 2.9 Admin 列表/详情返回「引用方」：关联的 Skill / PageAction 数量

## 3. Executors + LangGraph 改造（PR2）★ 底子优先

> **目标**：Chat Agent Graph 以 `workflowRun` 为 L1 主轴；ReAct 收入 executor；`taskPlan` 双写过渡。

### 3.A 共享 Executors（Graph 与 Page 共用）— 批次 A

- [x] 3.1 新建 `src/core/workflow/executors/load-page-context.executor.ts`
- [x] 3.2 新建 `src/core/workflow/executors/fetch-data.executor.ts`（委托 `workflow_react`）
- [x] 3.3 新建 `src/core/workflow/executors/generate-and-push.executor.ts`
- [x] 3.4 新建 `src/core/workflow/executors/summarize.executor.ts`（委托 `summarize` 节点）
- [x] 3.5 新建 `src/core/workflow/executors/executor-registry.ts`：按 `WorkflowActionKind` 分发；未实现 action fail-fast

### 3.A′ 批次 B（Chat mutation，PR2 末或 PR4 前）

- [x] 3.5b `compose-mutation.executor.ts`、`present-mutation.executor.ts`、`write-data.executor.ts`、`await-user-confirm.executor.ts`

### 3.B AgentGraphState

- [x] 3.5 扩展 `AgentGraphState`：`workflowRun` / `workflowNodeDefs` / `workflowNodeOutputs` / `workflowAwaitingReact`（嵌套分区后续 PR）
- [x] 3.6 更新 `graph-state.annotation.ts`：上述字段 + `planRunContext`
- [x] 3.7 实现 `workflow-plan-sync.util.ts`：`workflowRun` SSOT + `projectTaskPlanFromWorkflowAdvance` 投影 taskPlan；`syncWorkflowRunAfterPlanAdvance` 仅 workflow_react 内镜像
- [ ] 3.7b 实现节点 `outputRef` / `execution.nodeOutputs`：节点完成时归档 observation，下一步按 ref 读取

### 3.C 新 Graph 节点

- [x] 3.8 新建 `workflow-init.node.ts`：委托 `plan.node` + `compileTaskPlanToWorkflow`
- [x] 3.8b 新建 `compile-plan-to-workflow.util.ts` + 单测
- [ ] 3.8c 新建 `validate-workflow-against-scope.util.ts`
- [x] 3.8d 契约未通过时不 init（`plan` / `turnRoute` 前置逻辑保留）
- [x] 3.9 新建 `execute-node.node.ts`（load_page_context / summarize / ReAct 委托）
- [x] 3.10 新建 `workflow-advance.node.ts`
- [ ] 3.11 收窄 `plan.node.ts`：降级为 legacy 入口或委托 `workflow_init`（保留兼容开关）

### 3.D 改图边与内聚 ReAct

- [x] 3.12 修改 `build-agent-graph.ts`：workflow 主轴 `turnRoute → workflow_init → execute_node → workflow_advance`（`WORKFLOW_GRAPH_AXIS` 已恒为 on）
- [x] 3.13 保留 `intent` / `turnRoute` / smalltalk 短路；`direct_answer` 不进 workflow 环
- [x] 3.14 收窄 `readiness.node`：已移除顶层节点，收入 `workflow_react`
- [x] 3.15 `llm` / `resultCheck` / `tools`：顶层环已移除；`fetch_data` 等经 `workflow_react` 内聚
- [x] 3.16 `summarize.node`：workflow 轴下完成后回 `workflow_advance` / `__end__`
- [x] 3.17 `plan_sync` 审计：新增 `type: 'workflow'` step

### 3.E Chat 验收（PR2 完成标准）

> 细则见 **tasks.md §8.A–8.E**；下列为 PR2 节点级勾选项。

- [ ] 3.18 Skill 绑定 `workflowId` 后，Chat run 的 `workflowRun.nodes` 与配置动作数一致
- [ ] 3.19 无 `workflowId`、未选 Skill 时：Plan LLM 推断 plan 并 compile 为 `workflowRun`（`compiledFrom=plan_llm`）；仅 LLM 失败时 fallback template
- [ ] 3.20 AgentRun steps / SSE 可看到 workflow 节点事件（与 plan_sync 并存可接受）
- [ ] 3.21 `write_intent_vs_http_only_skill` 等 clarify 场景：不进入 `workflow_init`（与现网 skill mismatch summarize 一致）
- [ ] 3.22 `intent_first` 场景：忽略 `Skill.workflowId`，Plan LLM compile 的 `workflowRun` 与显式资产路径 executor 一致
- [ ] 3.23 `WORKFLOW_GRAPH_AXIS` 灰度：flag=0/1 对账通过（§8.E 夹具）

## 4. PageAction 接入（PR3）

> **不新建独立编排分叉**；invoke 调用与 Graph 相同的 executor-registry + HarnessRunner（无 intent/turnRoute/session）。

- [x] 4.1 新建 `src/core/page-action/page-workflow.runner.ts`：薄封装 executors 线性调度
- [ ] 4.2 `page-action.service.ts` invoke：`workflowId` 存在时走 runner；否则保留单步 fill
- [ ] 4.3 扩展 `page-action-run-steps.util.ts`：`type: 'workflow'`
- [ ] 4.4 扩展 `page-action-inline-sse.util.ts`：节点级 `page_action` 字段
- [ ] 4.5 持久化 `PageActionRun.workflowRun` 快照
- [ ] 4.6 更新 `docs/page-action-admin-run-frontend.md`

## 5. GOA / Session（PR4）

- [ ] 5.1 `session-goa.types.ts`：`ActiveTask` 增加 `workflowRun`；`StoredTaskPlan` 标 deprecated
- [ ] 5.2 `session-goa-projection.util.ts`：从 `workflowRun` 构建 `stepProgress`
- [ ] 5.3 `session-goa-full-projection.util.ts`：prompt pending 读 workflow 节点
- [ ] 5.4 `session-graph-resume.util.ts`：resume 读 `workflowRun`
- [ ] 5.5 `session-goa-run-snapshot.util.ts`：`AgentRunGoaSnapshot` 增加 `workflowRun`
- [ ] 5.6 `session-task-resume-followup.service.ts`：续跑基于 `currentNodeId`
- [ ] 5.7 写确认：`await_user_confirm` 节点 + L2 `session.awaitingWriteConfirmation` 联动；确认后从下一节点继续

## 6. Legacy 清理（PR5）

- [ ] 6.1 Skill 不再写入 `config.workflow`
- [ ] 6.2 `resolveTaskPlan` 优先 `skill.workflowId`
- [ ] 6.3 host_tool 静默 prune 改为 Harness skip + trace
- [ ] 6.4 产品层移除 `phase/kind` 展示依赖
- [ ] 6.5 文档：V2 迁移指南
- [x] 6.5a B 端 Workflow/Skill 对接与 `config.workflow` 迁移 runbook（`v2/docs/b-end-workflow-skill-migration.md`）
- [x] 6.6 `npm run db:migrate:skill-config-workflow`：`config.workflow` → `Workflow` + `Skill.workflowId`（`migrate-skill-config-workflow.util.ts`）

## 7. Harness Eval（PR6，可选）

- [ ] 7.1 `fixtures/workflows/campaign-auto-fill.json`
- [ ] 7.2 sensor 回归脚本
- [ ] 7.3 CI smoke job

## 8. 验收清单（全阶段）

> 与 [design.md §重构防跑偏](./design.md#重构防跑偏合规检查) 一一对应。PR2 合入前 **§8.A + §8.B** 为必过项。

### 8.A 图结构与合规（PR2 必过）

- [x] 8.A.1 `orchestrated_task` 主环仅为 `workflow_init → execute_node → workflow_advance`（节点链见 `workflow-graph.integration.spec.ts`）
- [ ] 8.A.2 `direct_answer` / `smalltalk` / `terminalRespond` 不创建 `workflowRun`
- [x] 8.A.3 `workflow_advance` 只读 `workflowRun` 驱动画边，不用 `taskPlan.pendingStepIds`
- [ ] 8.A.4 仅 `workflow-plan-sync.util.ts` 可写 `taskPlan`；executor / graph node 禁止直写（投影已集中，仍有零星直写待收敛）
- [ ] 8.A.5 节点间数据走 `outputRef`；节点完成后 L3 `execution` 观测可归档/清空
- [x] 8.A.6 V2 主轴固定；已删除 `WORKFLOW_GRAPH_AXIS` 灰度与顶层 plan→readiness→llm 主环

### 8.B 步序来源与意图冲突（PR2 必过）

- [x] 8.B.1 无 Skill + `orchestrated_task`：compile 夹具见 `workflow-plan-source.fixtures.spec.ts`
- [x] 8.B.3 `alignment=clarify`：夹具覆盖 clarify → 无 workflowRun
- [x] 8.B.4 `alignment=intent_first`：夹具覆盖 intent_first
- [ ] 8.B.2 Skill + `workflowId` + aligned：load DB + overrides；`compiledFrom=workflow_db`（待 DB E2E）
- [ ] 8.B.5 mutation + Plan LLM 非合规步序：`shouldReplacePlanWithMutationTemplate` 后 compile
- [x] 8.B.6 显式 Workflow 与 scope 不兼容：保存期 Skill↔Workflow 校验；运行时 scope_incompatible 回退 plan_compile，资产缺失仍 skip
- [ ] 8.B.7 `resumeFromWriteConfirm` / GOA resume：`currentNodeId` 连续，不重新 Plan LLM

### 8.C 现网 parity（PR2–PR4）

- [ ] 8.C.1 skill mismatch clarify 文案与路径与 flag=0 现网一致
- [ ] 8.C.2 `abandonActiveTaskOnFreshPlan` 在 `workflow_init` 仍生效
- [ ] 8.C.3 写确认：`await_user_confirm` + session 暂停，确认后续下一节点
- [ ] 8.C.4 EMPTY tool 轮次：节点/workflow 中断，非假 `succeeded` advance
- [ ] 8.C.5 Harness `skipped` 必有 trace，禁止仅 warn

### 8.D 端到端（PR3–PR5）

- [x] 8.D.1 Chat：load→summarize 全图 E2E（`build-agent-graph.integration.spec.ts`）；Skill+workflowId 节点数对账待 DB 层
- [ ] 8.D.2 Page：同一 Workflow 定义，invoke 与 Chat 共用 executor-registry，行为一致
- [ ] 8.D.3 `STREAM_EMPTY` 经 Harness sensor，Page fail-fast
- [ ] 8.D.4 GOA resume 可续跑未完成 workflow 节点（读 `ActiveTask.workflowRun`，非 `StoredTaskPlan`）
- [ ] 8.D.5 无 `workflowId` 时 Chat 与 flag=0 现网输出等价（允许 `workflowRun` 形态差异，语义等价）
- [ ] 8.D.6 Page 无 `workflowId`：仍单步 host fill，不破坏现网 API

### 8.E 灰度对账（PR2c，同一 fixture 跑 flag=0 vs flag=1）

| 夹具 | 断言 |
|------|------|
| 无 Skill + orchestrated | flag=1：`compiledFrom=plan_llm`；最终答复与 flag=0 语义等价 |
| Skill + workflowId + aligned | flag=1：节点数=DB；执行结果等价 |
| write vs http skill | 两端均无 `workflowRun`；澄清类回复一致 |
| read vs host-only skill | flag=1 非 DB load；与 flag=0 intent_first 路径等价 |
| mutation + 非合规 LLM plan | 均走 mutation 模板；compile 后节点等价 |
| resume 未完成 workflow | `currentNodeId` 与暂停前一致 |
| minimal 仅 summarize | 单节点；flag=1 无顶层 tools 环 |
