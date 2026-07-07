"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stepsForRunPersistence = exports.filterUserVisibleRunSteps = exports.maybeTagWorkflowReactInternalStep = exports.tagRunStepAuditTier = exports.shouldTagWorkflowReactInternalAudit = void 0;
const workflow_plan_transition_util_1 = require("../../../../workflow/workflow-plan-transition.util");
const INTERNAL_REACT_STEP_TYPES = new Set([
    'readiness',
    'llm',
    'result_check',
    'plan_sync',
]);
function shouldTagWorkflowReactInternalAudit(state) {
    return (state.workflowAwaitingReact === true && (0, workflow_plan_transition_util_1.isWorkflowBoundRun)(state.workflowRun));
}
exports.shouldTagWorkflowReactInternalAudit = shouldTagWorkflowReactInternalAudit;
function tagRunStepAuditTier(step, tier) {
    if (tier === 'user') {
        return step;
    }
    return Object.assign(Object.assign({}, step), { meta: Object.assign(Object.assign({}, step.meta), { auditTier: 'internal' }) });
}
exports.tagRunStepAuditTier = tagRunStepAuditTier;
function maybeTagWorkflowReactInternalStep(step, state) {
    if (shouldTagWorkflowReactInternalAudit(state) &&
        INTERNAL_REACT_STEP_TYPES.has(step.type)) {
        return tagRunStepAuditTier(step, 'internal');
    }
    return step;
}
exports.maybeTagWorkflowReactInternalStep = maybeTagWorkflowReactInternalStep;
function filterUserVisibleRunSteps(steps) {
    return steps.filter((step) => { var _a; return ((_a = step.meta) === null || _a === void 0 ? void 0 : _a.auditTier) !== 'internal'; });
}
exports.filterUserVisibleRunSteps = filterUserVisibleRunSteps;
function stepsForRunPersistence(steps) {
    return filterUserVisibleRunSteps(steps);
}
exports.stepsForRunPersistence = stepsForRunPersistence;
//# sourceMappingURL=agent-run-audit.util.js.map