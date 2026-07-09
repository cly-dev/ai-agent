"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDuplicateSkipToolSteps = exports.resolveSummaryObservationForCheck = exports.resolvePostToolsResultCheck = exports.resolvePreToolsResultCheck = exports.inferResultCheckPhase = void 0;
const agent_run_steps_util_1 = require("../main/run/agent-run-steps.util");
const task_plan_util_1 = require("../main/plan/task-plan.util");
const paged_list_gather_util_1 = require("../gather/paged-list-gather.util");
const plan_observation_scope_util_1 = require("../main/plan/plan-observation-scope.util");
const tool_call_dedupe_util_1 = require("./tool-call-dedupe.util");
const tool_plan_error_util_1 = require("./tool-plan-error.util");
const tool_execution_status_util_1 = require("./tool-execution-status.util");
function inferResultCheckPhase(state) {
    if (state.pendingToolCalls.length > 0) {
        return 'pre_tools';
    }
    if (state.lastToolRoundMeta) {
        return 'post_tools';
    }
    return 'pre_tools';
}
exports.inferResultCheckPhase = inferResultCheckPhase;
function deferDuplicateSummarizeForPlan(input) {
    var _a;
    if (input.outcome.route !== 'summarize' ||
        (input.outcome.reason !== 'duplicate_tool_call_round' &&
            input.outcome.reason !== 'all_tool_calls_duplicate') ||
        !input.taskPlan ||
        !((_a = input.scopedTools) === null || _a === void 0 ? void 0 : _a.length)) {
        return input.outcome;
    }
    const step = (0, task_plan_util_1.getPendingPlanToolStep)(input.taskPlan);
    if (!step || step.kind !== 'tool' || !step.toolRole) {
        return input.outcome;
    }
    const callsToCheck = input.outcome.duplicateSkipCalls.length > 0
        ? input.outcome.duplicateSkipCalls
        : input.outcome.pendingToolCalls;
    if (callsToCheck.length === 0) {
        return input.outcome;
    }
    const hasOffPlanCall = callsToCheck.some((call) => !(0, task_plan_util_1.toolCallMatchesPendingPlanToolRole)(call, input.taskPlan, input.scopedTools));
    if (!hasOffPlanCall) {
        return input.outcome;
    }
    return Object.assign(Object.assign({}, input.outcome), { route: 'llm', reason: 'duplicate_off_plan_step', pendingToolCalls: [] });
}
function resolvePlanToolStepPreToolsOutcome(input) {
    const pendingToolStep = (0, task_plan_util_1.getPendingPlanToolStep)(input.taskPlan);
    if (!pendingToolStep ||
        pendingToolStep.kind !== 'tool' ||
        (0, task_plan_util_1.isPlanToolStepSatisfiedByObservations)({
            step: pendingToolStep,
            observations: input.observations,
            scopedTools: input.scopedTools,
            taskPlan: input.taskPlan,
            skillConfig: input.skillConfig,
            purpose: 'pre_tools_advance',
            pageContextEntityId: input.pageContextEntityId,
        })) {
        return null;
    }
    const base = {
        phase: 'pre_tools',
        duplicateSkipCalls: [],
    };
    const skipCount = (0, task_plan_util_1.countConsecutiveLlmRoundsWithoutToolCalls)(input.steps);
    const writeStep = (0, task_plan_util_1.isPlanWriteToolStep)(pendingToolStep);
    if (skipCount >= task_plan_util_1.PLAN_TOOL_STEP_MAX_SKIPS_WITHOUT_CALLS) {
        if (writeStep) {
            return Object.assign(Object.assign({}, base), { route: 'summarize', reason: 'plan_write_step_exhausted', pendingToolCalls: [] });
        }
        return Object.assign(Object.assign({}, base), { route: 'summarize', reason: 'plan_tool_step_exhausted', pendingToolCalls: [] });
    }
    return Object.assign(Object.assign({}, base), { route: 'llm', reason: writeStep ? 'plan_write_step_required' : 'plan_tool_step_required', pendingToolCalls: [] });
}
function resolvePreToolsResultCheck(input) {
    var _a, _b, _c;
    const base = {
        phase: 'pre_tools',
        duplicateSkipCalls: [],
    };
    const pagedObservations = (0, plan_observation_scope_util_1.selectObservationsForPagedGatherResume)(input.observationBuckets);
    const satisfactionObservations = (0, plan_observation_scope_util_1.selectObservationsForPlanToolSatisfaction)(input.observationBuckets);
    const pagedResumeRoute = (0, paged_list_gather_util_1.resolvePagedGatherResumeRoute)({
        pendingToolCalls: input.pendingToolCalls,
        taskPlan: input.taskPlan,
        scopedTools: (_a = input.scopedTools) !== null && _a !== void 0 ? _a : [],
        observations: pagedObservations,
    });
    if (pagedResumeRoute) {
        return Object.assign(Object.assign({}, base), { route: 'tools', reason: 'paged_gather_resume', pendingToolCalls: [], supersededPendingToolCallCount: pagedResumeRoute.supersededPendingToolCallCount, pagedGatherResumeKind: (_c = (0, paged_list_gather_util_1.resolvePagedGatherResumeKind)({
                taskPlan: input.taskPlan,
                scopedTools: (_b = input.scopedTools) !== null && _b !== void 0 ? _b : [],
                observations: pagedObservations,
            })) !== null && _c !== void 0 ? _c : undefined });
    }
    const sameArgsRepeat = (0, tool_plan_error_util_1.pendingCallsRepeatRecoverableToolError)({
        pendingToolCalls: input.pendingToolCalls,
        observations: pagedObservations,
    });
    if (sameArgsRepeat.repeat && input.taskPlan) {
        return Object.assign(Object.assign({}, base), { route: 'summarize', reason: 'tool_error_same_args_repeat', pendingToolCalls: [] });
    }
    if (input.pendingToolCalls.length === 0) {
        const planOutcome = resolvePlanToolStepPreToolsOutcome({
            steps: input.steps,
            taskPlan: input.taskPlan,
            observations: satisfactionObservations,
            scopedTools: input.scopedTools,
            skillConfig: input.skillConfig,
            pageContextEntityId: input.pageContextEntityId,
        });
        if (planOutcome) {
            return planOutcome;
        }
        return Object.assign(Object.assign({}, base), { route: 'llm', reason: 'no_pending_tool_calls', pendingToolCalls: [] });
    }
    const lastRound = (0, tool_call_dedupe_util_1.getLastToolRoundFromSteps)(input.steps);
    if ((0, tool_call_dedupe_util_1.areToolCallRoundsIdentical)(input.pendingToolCalls, lastRound)) {
        return deferDuplicateSummarizeForPlan({
            outcome: Object.assign(Object.assign({}, base), { route: 'summarize', reason: 'duplicate_tool_call_round', pendingToolCalls: [], duplicateSkipCalls: input.pendingToolCalls }),
            taskPlan: input.taskPlan,
            scopedTools: input.scopedTools,
        });
    }
    const { novel, duplicates } = (0, tool_call_dedupe_util_1.partitionToolCallsByHistory)(input.pendingToolCalls, input.steps);
    if (novel.length === 0) {
        return deferDuplicateSummarizeForPlan({
            outcome: Object.assign(Object.assign({}, base), { route: 'summarize', reason: 'all_tool_calls_duplicate', pendingToolCalls: [], duplicateSkipCalls: duplicates }),
            taskPlan: input.taskPlan,
            scopedTools: input.scopedTools,
        });
    }
    if (duplicates.length > 0) {
        return Object.assign(Object.assign({}, base), { route: 'tools', reason: 'partial_duplicate_filtered', pendingToolCalls: novel, duplicateSkipCalls: duplicates });
    }
    return Object.assign(Object.assign({}, base), { route: 'tools', reason: 'execute_tools', pendingToolCalls: input.pendingToolCalls });
}
exports.resolvePreToolsResultCheck = resolvePreToolsResultCheck;
function resolvePostToolsResultCheck(input) {
    var _a;
    const base = {
        phase: 'post_tools',
        duplicateSkipCalls: [],
    };
    const { executionStatuses, errorDispositions, toolCalls, roundObservationIndices, } = input.lastToolRoundMeta;
    const shouldExpandOnce = !input.skillApplied &&
        !input.hasExpandedOnce &&
        input.iteration <= 1 &&
        input.scopedTools.length < input.totalAllowedToolCount &&
        toolCalls.length === 1 &&
        !executionStatuses.includes('ERROR') &&
        input.isLowQualityLastObservation;
    if (shouldExpandOnce) {
        return Object.assign(Object.assign({}, base), { route: 'expand_tools', reason: 'low_quality_first_result_expand_once', pendingToolCalls: [] });
    }
    if (input.writeConfirmResume && executionStatuses.length > 0) {
        return Object.assign(Object.assign({}, base), { route: 'summarize', reason: executionStatuses.includes('ERROR')
                ? 'tool_error_summarize'
                : 'write_confirm_resume_success', pendingToolCalls: [] });
    }
    if ((0, tool_execution_status_util_1.shouldShortCircuitEmptyToSummarize)({
        userMessage: input.userMessage,
        toolCalls,
        scopedTools: input.scopedTools,
        executionStatuses,
    })) {
        return Object.assign(Object.assign({}, base), { route: 'summarize', reason: 'empty_tool_results', pendingToolCalls: [] });
    }
    if ((0, tool_execution_status_util_1.pickSummarizeErrorObservation)(input.observations, errorDispositions, roundObservationIndices) != null) {
        return Object.assign(Object.assign({}, base), { route: 'summarize', reason: 'tool_error_summarize', pendingToolCalls: [] });
    }
    if ((0, tool_execution_status_util_1.shouldReturnToLlmAfterToolErrors)(input.observations, errorDispositions, roundObservationIndices)) {
        return Object.assign(Object.assign({}, base), { route: 'llm', reason: 'tool_error_recoverable', pendingToolCalls: [] });
    }
    const incompletePagedGather = (0, paged_list_gather_util_1.findIncompletePagedGatherTarget)({
        taskPlan: input.taskPlan,
        scopedTools: input.scopedTools,
        observations: input.observations,
    });
    if (incompletePagedGather) {
        return Object.assign(Object.assign({}, base), { route: 'tools', reason: 'paged_gather_resume', pendingToolCalls: [], pagedGatherResumeKind: (_a = (0, paged_list_gather_util_1.resolvePagedGatherResumeKind)({
                taskPlan: input.taskPlan,
                scopedTools: input.scopedTools,
                observations: input.observations,
            })) !== null && _a !== void 0 ? _a : undefined });
    }
    return Object.assign(Object.assign({}, base), { route: 'llm', reason: 'continue_decision_loop', pendingToolCalls: [] });
}
exports.resolvePostToolsResultCheck = resolvePostToolsResultCheck;
function resolveSummaryObservationForCheck(input) {
    var _a, _b;
    const roundIndices = (_a = input.savedRoundMeta) === null || _a === void 0 ? void 0 : _a.roundObservationIndices;
    const roundDispositions = (_b = input.savedRoundMeta) === null || _b === void 0 ? void 0 : _b.errorDispositions;
    if (input.reason === 'tool_error_same_args_repeat') {
        const failed = (0, tool_plan_error_util_1.findLastRecoverableToolErrorObservation)(input.observations);
        if (!failed) {
            return null;
        }
        return {
            name: failed.name,
            output: Object.assign(Object.assign({}, failed.output), { userHint: (0, tool_plan_error_util_1.buildSameArgsRepeatUserHint)(failed.output) }),
        };
    }
    if (input.reason === 'tool_error_summarize' && input.savedRoundMeta) {
        const errorObservation = (0, tool_execution_status_util_1.pickSummarizeErrorObservation)(input.observations, roundDispositions !== null && roundDispositions !== void 0 ? roundDispositions : [], roundIndices !== null && roundIndices !== void 0 ? roundIndices : []);
        if (errorObservation) {
            return errorObservation;
        }
    }
    if (input.mergedObservation) {
        return input.mergedObservation;
    }
    if (input.savedRoundMeta) {
        const errorObservation = (0, tool_execution_status_util_1.pickSummarizeErrorObservation)(input.observations, roundDispositions !== null && roundDispositions !== void 0 ? roundDispositions : [], roundIndices !== null && roundIndices !== void 0 ? roundIndices : []);
        if (errorObservation) {
            return errorObservation;
        }
    }
    return (0, tool_execution_status_util_1.findLastErrorObservation)(input.observations, roundIndices);
}
exports.resolveSummaryObservationForCheck = resolveSummaryObservationForCheck;
function buildDuplicateSkipToolSteps(calls, existingSteps, reason) {
    const steps = [...existingSteps];
    const result = [];
    for (const call of calls) {
        const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(steps);
        const row = {
            step: stepNum,
            type: 'tool',
            name: call.name,
            input: call.arguments,
            output: {
                skipped: true,
                reason,
            },
        };
        steps.push(row);
        result.push(row);
    }
    return result;
}
exports.buildDuplicateSkipToolSteps = buildDuplicateSkipToolSteps;
//# sourceMappingURL=tool-result-check.util.js.map