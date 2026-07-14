"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePlanStepToolCandidatesFromState = exports.resolvePlanToolCandidates = exports.groupPlanToolsByRequiredParams = exports.listUserFacingRequiredParamsForTool = void 0;
const tool_decision_input_util_1 = require("../../../../tool-engine/tool-decision-input.util");
const tool_user_facing_params_util_1 = require("../../../../tool-engine/tool-user-facing-params.util");
const tool_agent_metadata_util_1 = require("../../../../tool-engine/tool-agent-metadata.util");
const task_plan_util_1 = require("./task-plan.util");
function listUserFacingRequiredParamsForTool(tool) {
    const compact = (0, tool_decision_input_util_1.buildCompactToolInput)(tool.inputSchema, tool.schema, tool.agentMetadata);
    return (0, tool_user_facing_params_util_1.listUserFacingRequiredParamNames)(compact);
}
exports.listUserFacingRequiredParamsForTool = listUserFacingRequiredParamsForTool;
function groupPlanToolsByRequiredParams(tools) {
    const bySignature = new Map();
    for (const tool of tools) {
        const fields = listUserFacingRequiredParamsForTool(tool);
        const signature = fields.join('\0');
        const existing = bySignature.get(signature);
        if (existing) {
            existing.toolNames.push(tool.name);
            continue;
        }
        bySignature.set(signature, { toolNames: [tool.name], fields });
    }
    return [...bySignature.values()];
}
exports.groupPlanToolsByRequiredParams = groupPlanToolsByRequiredParams;
function isBroadListGatherStep(taskPlan, step) {
    if (step.kind !== 'tool' || step.toolRole !== 'read-list') {
        return false;
    }
    const deliverable = taskPlan === null || taskPlan === void 0 ? void 0 : taskPlan.deliverable;
    return deliverable === 'analysis' || deliverable === 'list';
}
function preferListOperationTools(tools) {
    const listTools = tools.filter((tool) => {
        const meta = (0, tool_agent_metadata_util_1.parseAgentMetadata)(tool.agentMetadata);
        return (meta === null || meta === void 0 ? void 0 : meta.operation) === 'LIST';
    });
    return listTools.length > 0 ? listTools : tools;
}
function resolvePlanToolCandidates(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { step: executionStep, workflowNodeAction } = (0, task_plan_util_1.resolvePlanExecutionStep)({
        taskPlan: input.taskPlan,
        workflowRun: input.workflowRun,
        workflowNodeDefs: input.workflowNodeDefs,
    });
    if ((0, task_plan_util_1.isPlanStepBlockingToolScope)(executionStep, workflowNodeAction)) {
        return {
            candidates: [],
            strategy: 'host_or_blocked',
            planStepId: (_a = executionStep === null || executionStep === void 0 ? void 0 : executionStep.id) !== null && _a !== void 0 ? _a : null,
            toolRole: (_b = executionStep === null || executionStep === void 0 ? void 0 : executionStep.toolRole) !== null && _b !== void 0 ? _b : null,
        };
    }
    if ((0, task_plan_util_1.getPendingPlanHostToolStep)(input.taskPlan, input.workflowRun)) {
        return {
            candidates: [],
            strategy: 'host_or_blocked',
            planStepId: (_d = (_c = input.taskPlan) === null || _c === void 0 ? void 0 : _c.currentStepId) !== null && _d !== void 0 ? _d : null,
            toolRole: null,
        };
    }
    const step = (0, task_plan_util_1.getPendingPlanToolStep)(input.taskPlan, input.workflowRun);
    if (!step || step.kind !== 'tool' || !step.toolRole) {
        if ((step === null || step === void 0 ? void 0 : step.kind) === 'tool' && ((_e = step.pinnedToolNames) === null || _e === void 0 ? void 0 : _e.length)) {
            const pinned = input.scopedTools.filter((tool) => step.pinnedToolNames.includes(tool.name));
            if (pinned.length > 0) {
                return {
                    candidates: pinned,
                    strategy: 'plan_pinned_tool',
                    planStepId: step.id,
                    toolRole: (_f = step.toolRole) !== null && _f !== void 0 ? _f : null,
                };
            }
        }
        return {
            candidates: input.scopedTools,
            strategy: 'no_gather_step',
            planStepId: (_g = step === null || step === void 0 ? void 0 : step.id) !== null && _g !== void 0 ? _g : null,
            toolRole: (_h = step === null || step === void 0 ? void 0 : step.toolRole) !== null && _h !== void 0 ? _h : null,
        };
    }
    const pinnedNames = step.pinnedToolNames;
    if (pinnedNames && pinnedNames.length > 0) {
        const pinned = input.scopedTools.filter((tool) => pinnedNames.includes(tool.name));
        if (pinned.length > 0) {
            return {
                candidates: pinned,
                strategy: 'plan_pinned_tool',
                planStepId: step.id,
                toolRole: step.toolRole,
            };
        }
    }
    const roleMatched = input.scopedTools.filter((tool) => (0, task_plan_util_1.resolveScopedToolRoleForPlan)(tool) === step.toolRole);
    if (roleMatched.length === 0) {
        return {
            candidates: input.scopedTools,
            strategy: 'fallback_scoped',
            planStepId: step.id,
            toolRole: step.toolRole,
        };
    }
    if (roleMatched.length === 1) {
        return {
            candidates: roleMatched,
            strategy: 'single_role_match',
            planStepId: step.id,
            toolRole: step.toolRole,
        };
    }
    if (isBroadListGatherStep(input.taskPlan, step)) {
        const broad = roleMatched.filter((tool) => listUserFacingRequiredParamsForTool(tool).length === 0);
        if (broad.length > 0) {
            const narrowed = preferListOperationTools(broad);
            return {
                candidates: narrowed,
                strategy: 'broad_list_preferred',
                planStepId: step.id,
                toolRole: step.toolRole,
            };
        }
    }
    if (step.toolRole === 'read-list') {
        const listOps = preferListOperationTools(roleMatched);
        const withoutUserRequired = listOps.filter((tool) => listUserFacingRequiredParamsForTool(tool).length === 0);
        if (withoutUserRequired.length > 0) {
            return {
                candidates: withoutUserRequired,
                strategy: 'list_operation_preferred',
                planStepId: step.id,
                toolRole: step.toolRole,
            };
        }
        if (listOps.length < roleMatched.length) {
            return {
                candidates: listOps,
                strategy: 'list_operation_preferred',
                planStepId: step.id,
                toolRole: step.toolRole,
            };
        }
    }
    return {
        candidates: roleMatched,
        strategy: 'role_match_all',
        planStepId: step.id,
        toolRole: step.toolRole,
    };
}
exports.resolvePlanToolCandidates = resolvePlanToolCandidates;
function resolvePlanStepToolCandidatesFromState(state) {
    var _a, _b, _c, _d, _e, _f;
    if (state.planStepToolCandidates && state.planStepToolCandidates.length > 0) {
        const currentStepId = (_b = (_a = state.taskPlan) === null || _a === void 0 ? void 0 : _a.currentStepId) !== null && _b !== void 0 ? _b : null;
        return {
            candidates: state.planStepToolCandidates,
            strategy: (_c = state.planStepToolCandidateStrategy) !== null && _c !== void 0 ? _c : 'role_match_all',
            planStepId: currentStepId,
            toolRole: (_f = (_e = (_d = state.taskPlan) === null || _d === void 0 ? void 0 : _d.steps.find((row) => row.id === currentStepId)) === null || _e === void 0 ? void 0 : _e.toolRole) !== null && _f !== void 0 ? _f : null,
        };
    }
    return resolvePlanToolCandidates(state);
}
exports.resolvePlanStepToolCandidatesFromState = resolvePlanStepToolCandidatesFromState;
//# sourceMappingURL=plan-tool-candidates.util.js.map