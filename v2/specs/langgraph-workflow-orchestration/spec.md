## ADDED Requirements

### 需求:Chat LangGraph 必须以 Workflow 节点为调度主轴
系统必须将 Agent LangGraph 的主循环改为：`workflow_init` → `execute_node` → `workflow_advance`，且不得以 `llm ⇄ resultCheck ⇄ tools` 作为顶层业务步进环。

#### 场景:Orchestrated task 带 Workflow
- **当** Chat turn 进入 `orchestrated_task` 且 Skill/Page 上下文解析出 `workflowId`
- **那么** Graph 必须从 `workflow_init` 加载 Workflow 并初始化 `workflowRun`

#### 场景:节点推进
- **当** 当前节点 `succeeded` 且仍有 pending 节点
- **那么** `workflow_advance` 必须更新 `currentNodeId` 并返回 `execute_node`

### 需求:无显式 Workflow 资产时必须由 Plan LLM 推断步序
当 Chat turn 进入 `orchestrated_task` 且不存在可加载的 Workflow 资产（无 `workflowId`、无 resume 快照、无可用 legacy `skill.config.workflow`）时，系统**必须**调用 Plan LLM 根据用户意图与 scoped tools 推断 plan，并**必须**通过 `compilePlanToWorkflowRun` 初始化为 `WorkflowRunState` 后进入 `execute_node` 主轴。

#### 场景:用户未选 Skill 的开放编排
- **当** `requestedSkillId` 为空且 `turnRoute=orchestrated_task`
- **那么** `workflow_init` 必须调用 Outer Plan LLM（沿用 `resolveOuterPlan` / `tryBuildOuterPlanViaLlm`），不得默认跳过 LLM 直接使用 template/minimal

#### 场景:Plan LLM 成功产出合规 plan
- **当** Plan LLM 返回可校验通过的 `TaskPlanSnapshot`
- **那么** 系统必须 compile 为 `workflowRun`，且 `compiledFrom` 必须为 `plan_llm`，并与显式资产路径共用同一 `execute_node` 循环

#### 场景:Plan LLM 失败或不合规
- **当** Plan LLM 调用失败、输出无法 parse、或步序未通过 scoped/mutation 校验
- **那么** 系统**必须** fallback 至确定性模板或 minimal，且 `compiledFrom` 必须为 `template` 或 `minimal`，并必须记录 fallback 原因（如 `llmFallbackReason`）

### 需求:用户意图与 Workflow 冲突时必须保留现网澄清与默认执行逻辑
系统必须在 `workflow_init` **之前**完成 `buildTurnExecutionContract` 与 `resolveSkillIntentAlignment`；不得因存在 `workflowId` 而跳过澄清或强制执行与用户意图冲突的固定步序。

#### 场景:Skill 与意图冲突且策略为 clarify
- **当** 用户显式选择 Skill（含 `workflowId`）且 `alignment.status=clarify`（如 `write_intent_vs_http_only_skill`）
- **那么** 系统必须设置 `terminalRespond`（`skill_intent_mismatch`），经 summarize 返回澄清文案后结束本 turn，**不得**进入 `workflow_init` 或加载 Workflow 资产

#### 场景:Skill 与意图冲突且策略为 intent_first
- **当** `alignment.status=intent_first`（如 `read_intent_vs_host_only_skill`）
- **那么** 系统必须将 `skillSelect` 降为 `llm`，**不得**加载所选 Skill 的 `workflowId`，必须由 Plan LLM 推断并 compile `workflowRun`

#### 场景:Plan LLM 步序与 mutation 安全规则冲突
- **当** Plan LLM 产出含 write 但非合规 mutation 步序
- **那么** 系统必须沿用 `shouldReplacePlanWithMutationTemplate` 替换为确定性 mutation 模板后再 compile，行为与现网一致

#### 场景:显式 Workflow 与本轮 scoped tools 不兼容
- **当** 已加载 Workflow 节点引用的 tool/hostTool 不在本轮 `scope` 内
- **那么** 系统必须 fallback 至 Plan LLM 或确定性模板，并记录 audit；不得硬执行无效节点

#### 场景:回合级澄清与 direct_answer
- **当** `pendingRespond` 为 terminal turn respond，或 `routing.route=direct_answer`，或 `plan.enabled=false`
- **那么** 系统不得创建或推进 `workflowRun`；行为必须与现网 `plan.node` 短路一致

### 需求:workflow_init 必须替代 plan 节点的步序权威职责
系统必须将原 `plan.node` 中「产生待执行步序列表」的职责迁移至 `workflow_init`：从 DB 加载 Workflow；无资产时 **Plan LLM 推断** 并 compile；或 resume / legacy 路径。

#### 场景:Resume 续跑
- **当** session resume 携带未完成 `workflowRun`
- **那么** `workflow_init` 必须恢复该快照并继续 `currentNodeId`，不得重新 LLM 生成 plan

#### 场景:Legacy skill.config.workflow
- **当** Skill 无 `workflowId` 但 `config.workflow` 存在
- **那么** 系统必须编译为 `WorkflowRunState` 或 TaskPlan IR（双写期），且必须打 deprecate 日志

### 需求:ReAct 环必须内聚在 fetch_data executor
系统必须将顶层 `llm`、`resultCheck`、`tools` 节点调用限制为 `fetch_data` action executor 内部实现；其他 action 不得依赖顶层 ReAct 环推进。

#### 场景:仅 summarize 的 Workflow
- **当** Workflow 仅含 `summarize` 节点
- **那么** Graph 不得进入无意义的 `tools`/`resultCheck` 顶层循环

### 需求:AgentGraphState 必须包含 workflowRun 分区
系统必须在 `AgentGraphState`（及 LangGraph Annotation）中增加 `workflowRun` 字段，且节点推进逻辑必须优先读写该字段。

#### 场景:双写过渡期
- **当** feature 开启双写且 `taskPlan` 仍存在
- **那么** 系统必须保持 `workflowRun` 与 `taskPlan.pendingStepIds` 同步，且以 `workflowRun` 为 SSE/GOA 投影优先源

### 需求:smalltalk 与 direct_answer 不得进入 Workflow 主轴
系统必须在 `intent`/`turnRoute` 判定为 smalltalk 或 `direct_answer` 时，绕过 `workflow_init` 业务环，行为与现网一致。

#### 场景:寒暄
- **当** `intentKind=smalltalk`
- **那么** 系统必须走现有 summarize/respond 短路，且不得创建 WorkflowRunState

## MODIFIED Requirements

### 需求:plan_sync 审计步骤
系统可以继续写入 `plan_sync` 类型 AgentRunStep 作为引擎审计，但 B 端产品进度展示必须改为 Workflow 节点；`plan_sync` 不得作为用户可见「第几步」。

#### 场景:管理端查看 Chat run
- **当** run 含 Workflow
- **那么** 对外展示必须基于 `workflowRun.nodes`，而非 `taskPlan.steps` 的 phase/kind

## REMOVED Requirements

### 需求:plan 节点作为步序唯一入口
**原因**：由 `workflow_init` 替代。  
**迁移**：`plan.node.ts` 逻辑拆分迁入 `workflow-init.node.ts` 与 legacy adapter。
