"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentGraphSkillFrameHelpers = void 0;
const skill_frame_expand_util_1 = require("../../skill/skill-frame-expand.util");
const plan_stack_util_1 = require("../../plan/plan-stack.util");
const host_tool_plan_util_1 = require("../../host-tool/host-tool-plan.util");
const host_tool_llm_util_1 = require("../../host-tool/host-tool-llm.util");
const turn_execution_contract_util_1 = require("../../../turn/turn-execution-contract.util");
const turn_execution_contract_util_2 = require("../../../turn/turn-execution-contract.util");
const skill_intent_alignment_util_1 = require("../../../turn/skill-intent-alignment.util");
const page_context_execution_policy_util_1 = require("../../../../../host-bridge/page-context-execution-policy.util");
const plan_sync_util_1 = require("../../plan/plan-sync.util");
const workflow_plan_transition_util_1 = require("../../../../../workflow/workflow-plan-transition.util");
const plan_observation_scope_util_1 = require("../../plan/plan-observation-scope.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
function createAgentGraphSkillFrameHelpers(deps, ctx, runHelpers) {
    const applySkillFrameContext = async (state) => {
        var _a, _b, _c, _d, _e, _f;
        if (!state.taskPlan) {
            return state;
        }
        const pageContext = (_b = (_a = state.pageContext) !== null && _a !== void 0 ? _a : ctx.input.pageContext) !== null && _b !== void 0 ? _b : null;
        const pendingStepId = (_c = state.taskPlan.pendingStepIds[0]) !== null && _c !== void 0 ? _c : null;
        const pendingStep = pendingStepId
            ? state.taskPlan.steps.find((row) => row.id === pendingStepId)
            : null;
        const skillIdForHost = (_f = (_e = (_d = state.activeSkillId) !== null && _d !== void 0 ? _d : ((pendingStep === null || pendingStep === void 0 ? void 0 : pendingStep.kind) === 'skill' && pendingStep.skillId != null
            ? pendingStep.skillId
            : null)) !== null && _e !== void 0 ? _e : ctx.input.requestedSkillId) !== null && _f !== void 0 ? _f : null;
        const hostBundle = await runHelpers.loadScopedHostTools(ctx.input, pageContext, skillIdForHost);
        const availableHostTools = hostBundle.scopedHostTools.map((tool) => ({
            name: tool.name,
            description: tool.description,
        }));
        const contract = (0, turn_execution_contract_util_2.resolveTurnExecutionContract)(state, undefined, deps.logger);
        const enforceRequestedSkill = (0, skill_intent_alignment_util_1.shouldEnforceRequestedSkillFromContract)({
            scopedToolsSource: contract.plan.scopedToolsSource,
        });
        if ((0, page_context_execution_policy_util_1.isPageContextOuterPlanActive)(contract.plan.pageContextPlan)) {
            return Object.assign(Object.assign({}, state), { scopedHostTools: hostBundle.scopedHostTools, scopedHostLangChainTools: hostBundle.scopedHostLangChainTools });
        }
        const expanded = await (0, skill_frame_expand_util_1.expandPendingSkillStepIfNeeded)({
            plan: state.taskPlan,
            scopedTools: state.scopedTools,
            toolBuildCtx: ctx.input.toolBuildCtx,
            skillService: deps.skillService,
            llmService: deps.llmService,
            promptRegistry: deps.promptRegistry,
            scope: ctx.promptScope,
            agentId: ctx.input.agentId,
            userId: ctx.input.userId,
            appClientId: ctx.input.appClientId,
            enforceRequestedSkill,
            availableHostTools,
            scopedHostToolIds: hostBundle.scopedHostTools.map((tool) => tool.id),
        });
        const skillCtx = (0, plan_stack_util_1.resolveSkillContextFromPlan)(expanded.plan);
        let taskPlan = expanded.plan;
        let contractSkippedObservations = [];
        if (hostBundle.scopedHostTools.length > 0) {
            const enriched = (0, host_tool_plan_util_1.enrichPlanStepsWithHostTools)(expanded.plan, hostBundle.scopedHostTools);
            taskPlan = enriched.plan;
            if (enriched.prunedHostToolStepIds.length > 0) {
                deps.logger.warn(`host_tool plan steps pruned after enrich runId=${ctx.input.runId} stepIds=${enriched.prunedHostToolStepIds.join(',')}`);
            }
        }
        if (!contract.plan.allowHostToolSteps) {
            const skipped = (0, host_tool_llm_util_1.skipPendingHostToolStepsByContract)({
                taskPlan,
                pageContext,
                runId: ctx.input.runId,
                turnId: ctx.input.turnId,
            });
            taskPlan = skipped.plan;
            contractSkippedObservations = skipped.observations;
            if (skipped.skippedStepIds.length > 0) {
                deps.logger.warn(`host_tool plan steps skipped by turn contract runId=${ctx.input.runId} stepIds=${skipped.skippedStepIds.join(',')}`);
            }
        }
        return Object.assign(Object.assign({}, state), { taskPlan, toolObservations: contractSkippedObservations.length > 0
                ? [
                    ...state.toolObservations,
                    ...contractSkippedObservations.map((row) => ({
                        name: row.name,
                        output: row.output,
                    })),
                ]
                : state.toolObservations, scopedTools: expanded.scopedTools, scopedLangChainTools: expanded.scopedToolBundle.tools, scopedToolBundle: expanded.scopedToolBundle, scopedAllowedToolIds: expanded.scopedAllowedToolIds, scopedHostTools: hostBundle.scopedHostTools, scopedHostLangChainTools: hostBundle.scopedHostLangChainTools, skillApplied: skillCtx.skillApplied, activeSkillId: skillCtx.activeSkillId, activeSkillPrompt: skillCtx.activeSkillPrompt, activeSkillName: skillCtx.activeSkillName, activeSkillDescription: skillCtx.activeSkillDescription, activeSkillConfig: skillCtx.activeSkillConfig, activeSkillRiskLevel: skillCtx.activeSkillRiskLevel });
    };
    const withPlanSyncStep = (graphState, planAdvance, fromStepId, site) => {
        if (!planAdvance) {
            return graphState;
        }
        if ((0, workflow_plan_transition_util_1.isWorkflowBoundRun)(graphState.workflowRun)) {
            return graphState;
        }
        return Object.assign(Object.assign({}, graphState), { steps: [
                ...graphState.steps,
                (0, plan_sync_util_1.toPlanSyncAgentStep)({
                    step: (0, agent_run_steps_util_1.nextRunStepNumber)(graphState.steps),
                    planAdvance,
                    fromStepId,
                    site,
                    planRunContext: (0, plan_observation_scope_util_1.planRunContextFromState)(graphState),
                    normalizeOutput: (value) => runHelpers.normalizeJsonLike(value),
                }),
            ] });
    };
    const prepareReActPlanState = async (state) => {
        var _a, _b, _c;
        let graphState = await applySkillFrameContext(state);
        const fromStepId = (_b = (_a = graphState.taskPlan) === null || _a === void 0 ? void 0 : _a.currentStepId) !== null && _b !== void 0 ? _b : null;
        const synced = (0, plan_sync_util_1.syncTaskPlanBeforeReAct)({
            taskPlan: graphState.taskPlan,
            scopedTools: graphState.scopedTools,
            skillConfig: graphState.activeSkillConfig,
            observationBuckets: (0, plan_observation_scope_util_1.planObservationBucketsFromState)(graphState),
            pageContextEntityId: (0, turn_execution_contract_util_1.pageContextEntityIdFromGraphState)(graphState),
            workflowRun: graphState.workflowRun,
            workflowNodeDefs: graphState.workflowNodeDefs,
            workflowAwaitingReact: graphState.workflowAwaitingReact,
        });
        if (synced.taskPlan && synced.taskPlan !== graphState.taskPlan) {
            graphState = Object.assign(Object.assign({}, graphState), { taskPlan: synced.taskPlan });
        }
        if (synced.workflowRun) {
            graphState = Object.assign(Object.assign(Object.assign({}, graphState), { workflowRun: synced.workflowRun }), (synced.workflowAwaitingReact !== undefined
                ? { workflowAwaitingReact: synced.workflowAwaitingReact }
                : {}));
        }
        if (((_c = synced.planAdvance) === null || _c === void 0 ? void 0 : _c.reason) === 'plan_advance_skill_step') {
            graphState = await applySkillFrameContext(graphState);
        }
        return {
            state: graphState,
            planAdvance: synced.planAdvance,
            fromStepId,
        };
    };
    return { applySkillFrameContext, withPlanSyncStep, prepareReActPlanState };
}
exports.createAgentGraphSkillFrameHelpers = createAgentGraphSkillFrameHelpers;
//# sourceMappingURL=skill-frame.util.js.map