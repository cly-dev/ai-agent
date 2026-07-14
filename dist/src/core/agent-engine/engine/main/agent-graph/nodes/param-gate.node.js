"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParamGateNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const host_tool_plan_util_1 = require("../../host-tool/host-tool-plan.util");
const task_plan_util_1 = require("../../plan/task-plan.util");
const tool_param_gate_util_1 = require("../../../turn/tool-param-gate.util");
const turn_respond_util_1 = require("../../../turn/turn-respond.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const agent_run_audit_util_1 = require("../../run/agent-run-audit.util");
function createParamGateNode(bundle) {
    const { ctx, runHelpers } = bundle;
    return async (state) => {
        var _a;
        if (state.pendingToolCalls.length === 0) {
            return state;
        }
        const pendingHostStep = (0, task_plan_util_1.getPendingPlanHostToolStep)(state.taskPlan, state.workflowRun);
        if (pendingHostStep) {
            return state;
        }
        const gatherStep = (0, task_plan_util_1.getPendingPlanToolStep)(state.taskPlan, state.workflowRun);
        if (!gatherStep || gatherStep.kind !== 'tool') {
            return state;
        }
        const hostToolNames = new Set(((_a = state.scopedHostTools) !== null && _a !== void 0 ? _a : []).map((tool) => tool.name));
        const { httpCalls } = (0, host_tool_plan_util_1.partitionDecisionToolCalls)(state.pendingToolCalls, pendingHostStep, hostToolNames);
        if (httpCalls.length === 0) {
            return state;
        }
        const gate = (0, tool_param_gate_util_1.assessHttpToolCallsParamGate)({
            calls: httpCalls,
            scopedTools: state.scopedTools,
            candidateTools: state.planStepToolCandidates,
        });
        const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps);
        const gateStep = (0, agent_run_audit_util_1.maybeTagWorkflowReactInternalStep)({
            step: stepNum,
            type: 'param_gate',
            output: runHelpers.normalizeJsonLike({
                status: gate.status,
                toolName: gate.status === 'clarify' ? gate.toolName : null,
                missingFieldCount: gate.status === 'clarify' ? gate.missingFields.length : 0,
            }),
        }, state);
        const steps = [...state.steps, gateStep];
        await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
        if (gate.status === 'ready') {
            return Object.assign(Object.assign({}, state), { steps });
        }
        return Object.assign(Object.assign({}, state), { steps, pendingToolCalls: [], pendingRespond: (0, turn_respond_util_1.pendingRespondFromTurn)((0, tool_param_gate_util_1.buildParamGateClarificationRequest)({
                userMessage: ctx.input.latestUserMessage,
                planStep: gatherStep,
                missingFields: gate.missingFields,
                toolName: gate.toolName,
            })) });
    };
}
exports.createParamGateNode = createParamGateNode;
//# sourceMappingURL=param-gate.node.js.map