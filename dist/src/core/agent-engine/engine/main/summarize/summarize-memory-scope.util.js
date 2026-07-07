"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySummarizeMemoryScope = exports.resolveSummarizeMemoryScope = void 0;
const task_plan_util_1 = require("../plan/task-plan.util");
function toScopeMeta(scope) {
    return {
        primarySource: scope.primarySource,
        reason: scope.reason,
        filterMiss: scope.filterMiss,
        workingMemoryCount: scope.workingMemory.length,
        currentRunCount: scope.currentRun.length,
    };
}
function planFilteredSplit(input) {
    const plan = input.plan;
    if (!plan) {
        return {
            workingMemory: input.split.workingMemory,
            currentRun: input.split.currentRun,
            workingMemoryFilterMiss: false,
            currentRunFilterMiss: false,
        };
    }
    const answerStep = (0, task_plan_util_1.isPendingPlanAnswerStep)(plan, input.workflowRun, input.workflowNodeDefs);
    if (!answerStep) {
        return {
            workingMemory: input.split.workingMemory,
            currentRun: input.split.currentRun,
            workingMemoryFilterMiss: false,
            currentRunFilterMiss: false,
        };
    }
    const wm = (0, task_plan_util_1.filterObservationsForPlanSummarize)({
        plan,
        observations: input.split.workingMemory,
        scopedTools: input.scopedTools,
        strict: true,
        workflowRun: input.workflowRun,
    });
    const cr = (0, task_plan_util_1.filterObservationsForPlanSummarize)({
        plan,
        observations: input.split.currentRun,
        scopedTools: input.scopedTools,
        strict: true,
        workflowRun: input.workflowRun,
    });
    return {
        workingMemory: wm.observations,
        currentRun: cr.observations,
        workingMemoryFilterMiss: wm.filterMiss,
        currentRunFilterMiss: cr.filterMiss,
    };
}
function scopeResult(scope) {
    return Object.assign(Object.assign({}, scope), { filterMiss: scope.filterMiss === true ? true : undefined });
}
function withSelectedFilterMiss(scope, filterMiss) {
    return scopeResult(Object.assign(Object.assign({}, scope), { filterMiss, reason: filterMiss ? 'filter_miss' : scope.reason }));
}
function resolveSummarizeMemoryScope(input) {
    var _a;
    const plan = (_a = input.plan) !== null && _a !== void 0 ? _a : null;
    const filtered = planFilteredSplit(input);
    const workingMemory = filtered.workingMemory;
    const currentRun = filtered.currentRun;
    if (workingMemory.length === 0 && currentRun.length === 0) {
        const filterMiss = filtered.workingMemoryFilterMiss || filtered.currentRunFilterMiss;
        return scopeResult({
            primarySource: 'none',
            workingMemory: [],
            currentRun: [],
            reason: filterMiss ? 'filter_miss' : 'empty',
            filterMiss,
        });
    }
    if (plan &&
        currentRun.length > 0 &&
        (0, task_plan_util_1.completedGatherStepsSatisfiedInObservations)({
            plan,
            observations: currentRun,
            scopedTools: input.scopedTools,
        })) {
        return withSelectedFilterMiss({
            primarySource: 'current_run',
            workingMemory: [],
            currentRun,
            reason: 'current_run_gather_complete',
        }, filtered.currentRunFilterMiss);
    }
    if (currentRun.length === 0 && plan && (0, task_plan_util_1.isPendingPlanAnswerStep)(plan, input.workflowRun, input.workflowNodeDefs)) {
        if (workingMemory.length > 0) {
            return withSelectedFilterMiss({
                primarySource: 'working_memory',
                workingMemory,
                currentRun: [],
                reason: 'follow_up_working_memory',
            }, filtered.workingMemoryFilterMiss);
        }
        return scopeResult({
            primarySource: 'none',
            workingMemory: [],
            currentRun: [],
            reason: 'filter_miss',
            filterMiss: true,
        });
    }
    if (currentRun.length > 0 && (!plan || !(0, task_plan_util_1.isPendingPlanAnswerStep)(plan, input.workflowRun, input.workflowNodeDefs))) {
        return scopeResult({
            primarySource: 'current_run',
            workingMemory: [],
            currentRun,
            reason: 'fresh_topic_current_run_only',
        });
    }
    if (currentRun.length > 0 && workingMemory.length === 0) {
        return withSelectedFilterMiss({
            primarySource: 'current_run',
            workingMemory: [],
            currentRun,
            reason: 'current_run_only',
        }, filtered.currentRunFilterMiss);
    }
    if (workingMemory.length > 0 && currentRun.length === 0) {
        return withSelectedFilterMiss({
            primarySource: 'working_memory',
            workingMemory,
            currentRun: [],
            reason: 'working_memory_only',
        }, filtered.workingMemoryFilterMiss);
    }
    if (plan && (0, task_plan_util_1.isPendingPlanAnswerStep)(plan, input.workflowRun, input.workflowNodeDefs)) {
        if ((0, task_plan_util_1.completedGatherStepsSatisfiedInObservations)({
            plan,
            observations: currentRun,
            scopedTools: input.scopedTools,
        })) {
            return withSelectedFilterMiss({
                primarySource: 'current_run',
                workingMemory: [],
                currentRun,
                reason: 'current_run_gather_complete',
            }, filtered.currentRunFilterMiss);
        }
        return withSelectedFilterMiss({
            primarySource: 'working_memory',
            workingMemory,
            currentRun: [],
            reason: 'follow_up_working_memory',
        }, filtered.workingMemoryFilterMiss);
    }
    return scopeResult({
        primarySource: 'current_run',
        workingMemory: [],
        currentRun,
        reason: 'fresh_topic_current_run_only',
    });
}
exports.resolveSummarizeMemoryScope = resolveSummarizeMemoryScope;
function applySummarizeMemoryScope(split, scope) {
    return {
        workingMemory: scope.workingMemory,
        currentRun: scope.currentRun,
        memoryScope: toScopeMeta(scope),
    };
}
exports.applySummarizeMemoryScope = applySummarizeMemoryScope;
//# sourceMappingURL=summarize-memory-scope.util.js.map