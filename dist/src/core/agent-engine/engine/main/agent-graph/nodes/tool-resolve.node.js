"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToolResolveNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const plan_tool_candidates_util_1 = require("../../plan/plan-tool-candidates.util");
const plan_gather_candidate_readiness_util_1 = require("../../plan/plan-gather-candidate-readiness.util");
const task_plan_util_1 = require("../../plan/task-plan.util");
const turn_respond_util_1 = require("../../../turn/turn-respond.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const agent_run_audit_util_1 = require("../../run/agent-run-audit.util");
function createToolResolveNode(bundle) {
    const { ctx, runHelpers } = bundle;
    return async (state) => {
        const pendingStep = (0, task_plan_util_1.getPendingPlanToolStep)(state.taskPlan, state.workflowRun);
        if (!pendingStep || pendingStep.kind !== 'tool') {
            return Object.assign(Object.assign({}, state), { planStepToolCandidates: [], planStepToolCandidateStrategy: null });
        }
        const resolved = (0, plan_tool_candidates_util_1.resolvePlanToolCandidates)({
            scopedTools: state.scopedTools,
            taskPlan: state.taskPlan,
            workflowRun: state.workflowRun,
            workflowNodeDefs: state.workflowNodeDefs,
        });
        const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps);
        const resolveStep = (0, agent_run_audit_util_1.maybeTagWorkflowReactInternalStep)({
            step: stepNum,
            type: 'tool_resolve',
            output: runHelpers.normalizeJsonLike({
                strategy: resolved.strategy,
                planStepId: resolved.planStepId,
                toolRole: resolved.toolRole,
                candidateCount: resolved.candidates.length,
                candidateNames: resolved.candidates.map((tool) => tool.name),
            }),
        }, state);
        const steps = [...state.steps, resolveStep];
        await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
        const candidateReadiness = (0, plan_gather_candidate_readiness_util_1.assessGatherToolCandidateReadiness)({
            taskPlan: state.taskPlan,
            workflowRun: state.workflowRun,
            candidates: resolved.candidates,
            strategy: resolved.strategy,
        });
        if (candidateReadiness.status === 'no_candidates') {
            return Object.assign(Object.assign({}, state), { steps, planStepToolCandidates: [], planStepToolCandidateStrategy: resolved.strategy, pendingRespond: (0, turn_respond_util_1.pendingRespondFromTurn)({
                    kind: 'unsupported_scope',
                    userMessage: ctx.input.latestUserMessage,
                    payload: { readinessReason: candidateReadiness.reason },
                }) });
        }
        if (candidateReadiness.status === 'blocked') {
            return Object.assign(Object.assign({}, state), { steps, planStepToolCandidates: resolved.candidates, planStepToolCandidateStrategy: resolved.strategy, pendingRespond: (0, turn_respond_util_1.pendingRespondFromTurn)({
                    kind: 'unsupported_scope',
                    userMessage: ctx.input.latestUserMessage,
                    payload: { readinessReason: candidateReadiness.reason },
                }) });
        }
        return Object.assign(Object.assign({}, state), { steps, planStepToolCandidates: resolved.candidates, planStepToolCandidateStrategy: resolved.strategy });
    };
}
exports.createToolResolveNode = createToolResolveNode;
//# sourceMappingURL=tool-resolve.node.js.map