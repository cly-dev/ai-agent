"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipPendingHostToolStepsByContract = exports.finalizeHostToolPlanStep = exports.evaluateHostToolPostLlm = exports.evaluateHostToolPreLlmSkip = void 0;
const page_context_anchor_util_1 = require("../../../../host-bridge/page-context-anchor.util");
const host_action_util_1 = require("../../../../host-bridge/host-action.util");
const host_tool_plan_util_1 = require("./host-tool-plan.util");
const task_plan_util_1 = require("../plan/task-plan.util");
function hasUnmetRequiredHostTools(input) {
    const required = (0, host_tool_plan_util_1.collectRequiredHostToolNamesForPlanStep)(input.pendingHostStep, input.scopedHostTools);
    if (required.size === 0) {
        return false;
    }
    const dispatched = new Set(input.hostCalls.map((call) => call.name));
    for (const name of required) {
        if (!dispatched.has(name)) {
            return true;
        }
    }
    return false;
}
function evaluateHostToolPreLlmSkip(input) {
    if (!input.pendingHostStep || !input.taskPlan) {
        return null;
    }
    const requiredMissed = hasUnmetRequiredHostTools({
        pendingHostStep: input.pendingHostStep,
        scopedHostTools: input.scopedHostTools,
        hostCalls: [],
    });
    if (input.hostToolsForPrompt.length === 0) {
        return requiredMissed ? 'required_host_tool_missed' : 'no_scoped_host_tools';
    }
    return null;
}
exports.evaluateHostToolPreLlmSkip = evaluateHostToolPreLlmSkip;
function evaluateHostToolPostLlm(input) {
    const { pendingHostStep, taskPlan, hostCalls, httpCalls, hasToolCalls, scopedHostTools, } = input;
    if (!pendingHostStep || !taskPlan) {
        return { action: 'none' };
    }
    if (hostCalls.length > 0 &&
        (0, host_tool_plan_util_1.hostToolCallsMatchPlanStep)(pendingHostStep, hostCalls)) {
        const hostPageScopes = resolveHostPageScopesForCalls({
            hostCalls,
            scopedHostTools,
        });
        if (!(0, page_context_anchor_util_1.canDispatchHostAction)({
            pageContext: input.pageContext,
            hostPageScopes,
        })) {
            return {
                action: 'skip',
                planStepId: pendingHostStep.id,
                reason: 'undispatchable_page_anchor',
                hostCalls,
            };
        }
        return {
            action: 'dispatch',
            hostCalls,
            planStepId: pendingHostStep.id,
        };
    }
    const requiredMissed = hasUnmetRequiredHostTools({
        pendingHostStep,
        scopedHostTools,
        hostCalls,
    });
    if (hostCalls.length > 0) {
        const reason = requiredMissed
            ? 'required_host_tool_missed'
            : 'host_tool_name_mismatch';
        if (reason === 'required_host_tool_missed') {
            return {
                action: 'required_missed',
                planStepId: pendingHostStep.id,
                reason,
                hostCalls,
            };
        }
        return {
            action: 'skip',
            planStepId: pendingHostStep.id,
            reason,
            hostCalls,
        };
    }
    if (httpCalls.length > 0) {
        const reason = requiredMissed
            ? 'required_host_tool_missed'
            : 'unexpected_http_tool_calls';
        if (reason === 'required_host_tool_missed') {
            return {
                action: 'required_missed',
                planStepId: pendingHostStep.id,
                reason,
                httpCalls,
            };
        }
        return {
            action: 'skip',
            planStepId: pendingHostStep.id,
            reason,
            httpCalls,
        };
    }
    if (!hasToolCalls) {
        const reason = requiredMissed
            ? 'required_host_tool_missed'
            : 'no_host_tool_calls';
        if (reason === 'required_host_tool_missed') {
            return {
                action: 'required_missed',
                planStepId: pendingHostStep.id,
                reason,
            };
        }
        return {
            action: 'skip',
            planStepId: pendingHostStep.id,
            reason,
        };
    }
    return { action: 'none' };
}
exports.evaluateHostToolPostLlm = evaluateHostToolPostLlm;
function resolveHostPageScopesForCalls(input) {
    const scopeByName = new Map(input.scopedHostTools.map((tool) => { var _a; return [tool.name, (_a = tool.hostPageScope) !== null && _a !== void 0 ? _a : null]; }));
    return input.hostCalls.map((call) => { var _a; return (_a = scopeByName.get(call.name)) !== null && _a !== void 0 ? _a : null; });
}
function finalizeHostToolPlanStep(input) {
    var _a, _b, _c, _d;
    const hasHostCalls = Boolean((_a = input.hostCalls) === null || _a === void 0 ? void 0 : _a.length);
    let effectiveSkipReason = input.skipReason;
    if (hasHostCalls && !effectiveSkipReason && input.hostCalls) {
        const hostPageScopes = resolveHostPageScopesForCalls({
            hostCalls: input.hostCalls,
            scopedHostTools: (_b = input.scopedHostTools) !== null && _b !== void 0 ? _b : [],
        });
        if (!(0, page_context_anchor_util_1.canDispatchHostAction)({
            pageContext: input.pageContext,
            hostPageScopes,
        })) {
            effectiveSkipReason = 'undispatchable_page_anchor';
        }
    }
    const dispatched = Boolean(hasHostCalls && !effectiveSkipReason);
    const planAdvance = (0, host_tool_plan_util_1.advanceHostToolPlanStep)(input.taskPlan, {
        planStepId: input.planStepId,
        hostCalls: dispatched ? input.hostCalls : undefined,
        requireMatch: dispatched,
    });
    if (!planAdvance) {
        return null;
    }
    if (dispatched && input.hostCalls && !input.streamReconciled) {
        const observations = (0, host_tool_plan_util_1.buildHostToolDispatchObservations)({
            hostCalls: input.hostCalls,
            planStepId: input.planStepId,
        });
        const ssePayload = (0, host_action_util_1.buildHostActionPayload)({
            pageContext: input.pageContext,
            runId: (_c = input.runId) !== null && _c !== void 0 ? _c : 0,
            turnId: (_d = input.turnId) !== null && _d !== void 0 ? _d : 0,
            hostTools: input.hostCalls.map((call) => ({
                name: call.name,
                args: call.arguments,
            })),
            planStepId: input.planStepId,
            reason: 'plan_host_tool',
        });
        return { planAdvance, observations, ssePayload };
    }
    if (dispatched && input.streamReconciled) {
        return {
            planAdvance,
            observations: [],
        };
    }
    const observations = [
        (0, host_tool_plan_util_1.buildHostToolSkippedObservation)({
            planStepId: input.planStepId,
            reason: effectiveSkipReason !== null && effectiveSkipReason !== void 0 ? effectiveSkipReason : 'host_tool_step_skipped',
            hostCalls: input.hostCalls,
            httpCalls: input.httpCalls,
        }),
    ];
    return {
        planAdvance,
        observations,
        skipReason: effectiveSkipReason,
    };
}
exports.finalizeHostToolPlanStep = finalizeHostToolPlanStep;
function skipPendingHostToolStepsByContract(input) {
    const skippedStepIds = [];
    const observations = [];
    let current = input.taskPlan;
    while (true) {
        const pending = (0, task_plan_util_1.getPendingPlanHostToolStep)(current);
        if (!pending) {
            break;
        }
        const handled = finalizeHostToolPlanStep({
            taskPlan: current,
            planStepId: pending.id,
            skipReason: 'turn_contract_host_tool_blocked',
            pageContext: input.pageContext,
            runId: input.runId,
            turnId: input.turnId,
        });
        if (!handled) {
            break;
        }
        skippedStepIds.push(pending.id);
        observations.push(...handled.observations);
        current = handled.planAdvance.updatedPlan;
    }
    return { plan: current, skippedStepIds, observations };
}
exports.skipPendingHostToolStepsByContract = skipPendingHostToolStepsByContract;
//# sourceMappingURL=host-tool-llm.util.js.map