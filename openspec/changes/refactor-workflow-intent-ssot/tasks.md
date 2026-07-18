## 0. 原则

- [x] 0.1 Intent = 业务语言；IR = 机器语言
- [x] 0.2 六类 IR 目录 + `workflow-ir.types.ts`
- [x] 0.3 淘汰伪 IR type（配置面）
- [x] 0.4 **Flow 新表** 与 legacy **Workflow** 分表

## 1. Intent + Compiler

- [x] 1.1 Intent 类型与校验
- [x] 1.2 Preset → Intent
- [x] 1.3 Compiler 输出 `WorkflowIrDocument`
- [x] 1.4 `lowerIrToLegacy` 过渡桥

## 2. 持久化分表

- [x] 2.1 Prisma `Flow` / `FlowRevision` / `FlowTool` / `FlowHostTool`
- [x] 2.2 Workflow 恢复 `nodes`（legacy）
- [x] 2.3 Skill/PageAction `flowId`
- [x] 2.4 `FlowService` + `POST /flow`
- [x] 2.5 跑迁移 `20260715140000_flow_intent_ir_separate_tables`
- [x] 2.6 workflow_init / PageAction 优先 `flowId` → `loadFlowForRun`

## 3. Admin / 运行审计收尾

- [x] 3.1 过时原子配置文档清理（结构文档改写）
- [x] 3.2 Skill Admin 支持绑 flowId
- [x] 3.3 PageAction Admin 支持绑 flowId
- [x] 3.4 Runtime channels / skill catalog / requested-skill 优先 Flow
- [x] 3.5 Flow revision Admin（list/get）
- [x] 3.6 PageActionRun / ApprovalRequest 分 `flowId`（禁 Workflow FK 冒充）
- [x] 3.7 HostTool Skill 绑定校验覆盖 Flow
- [x] 3.8 Legacy `/workflow` create/update 路由移除

## 4. 后续（原生 IR 执行；推进终态）

> 目标：去掉 lower，Runtime 只按 IR `type` 调度。分阶段落地，不挡现网 Flow。

- [x] 4.1a IR→legacy action 分发表 `map-ir-type-to-legacy-action.util.ts`（direct 五类）
- [x] 4.1b `WORKFLOW_IR_IMPLEMENTED_TYPES` 去掉仅边语义的 condition/router
- [x] 4.1c **双分发**：lower 打标 `irType`；Chat/Page runner 经 `resolveWorkflowNodeExecutor`；channels 认 `irType`
- [x] 4.1d **expand IR 物化**：`materializeExpandIrNode`（llm / data_transform / human_task）
- [x] 4.1e **partial**：IR 拓扑校验；channels 从 IR 推导；`LoadedWorkflowForRun.ir`；`irNodeId` 打标
- [x] 4.1f **热路径去 lower**：`materializeWorkflowGraphFromIr` 为唯一物化入口；`lower*` 仅 deprecated 别名
- [x] 4.1e **run 投影**：`initWorkflowRun` 携带 irNodeId/irType；`projectIrRunNodeStatuses`；Chat/Page 观测与 SSE 暴露
- [x] 4.1e **native input**：`irConfig` 打标；`deriveWorkflowNodeInputFromIr` + `resolveWorkflowNodeRuntimeInput`；executor 优先读 IR config
- [ ] 4.2 Trigger / Parallel 等按自动化需求再开

### 4.3 Plan A：Runtime 以 IR 为图真源（Intent 配置面不变）

> 终态：`Intent → IR → execute(irNode)`；materialize 仅作 expand 过渡 / 废弃。
> 首片：direct-only Page 车道（无 llm / data_transform / human_task / tool_call）。

- [x] 4.3a `isWorkflowIrNativeDirectEligible` + `buildNativeDirectGraphFromIr`（IR 边→路由；仅 `materializeDirectIrNode`）
- [x] 4.3b `loadFlowForRun` 对 eligible Flow 走 native-direct（`executionMode: ir_native_direct`）
- [x] 4.3c `executeWorkflowIrNode`：按 `irNode.type` 分发（底层可暂桥接现有 page executor）
- [x] 4.3d Page orchestrator / runner 优先 IR 节点调度；debug 打 executionMode
- [x] 4.3e Chat direct-only 同车道
- [x] 4.3f **相位原生化**：present→await / draft 无 `__present`/`__draft`；`completeWorkflowNodeOrAdvancePhase`
- [x] 4.3g 审批 resume 快照 **v2**（flow + irNodeId/phase；defs 可选缓存；v1 仍可读）

> advance 仍按物化子步调度（present→await 需顺序执行）；IR 粒度投影/观测；input 真源已切到 irConfig。
## 5. 老版 Workflow 改造（本阶段收尾）

- [x] 5.1 删除旧 B 端 Workflow 文档；新唯一指南 `v2/docs/b-end-flow-admin-guide.md`
- [x] 5.2 `inferWorkflowIntentFromLegacyNodes` + `POST /admin/flow/migrate-from-workflow/:workflowId`
- [x] 5.3 可选改绑 Skill/PageAction、停用源 Workflow
- [x] 5.4 迁移 preview API；legacy Workflow 响应 `deprecated` / `configWritable: false`
- [x] 5.6 `GET /flow/migration-candidates` 待迁移列表
- [x] 5.7 migrate 创建+改绑+停用同事务；preview 增加 `lossy`
- [x] 5.9 配置面禁止新绑 workflowId（Skill/PageAction）；Workflow Admin 明确为归档
- [x] 5.10 运行时去掉 legacy Workflow 加载（resume / init / channels / PageAction / approval）；只认 Flow；Flow 删除加引用守卫
- [x] 5.11 新建审批只写 `flowId`；`loadWorkflowForRun*` 标记 deprecated
