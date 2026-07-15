"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTaskPlanSnapshotForWorkflow = exports.normalizeTaskPlanStepsForWorkflow = exports.inferDeliverableFromWorkflowNodes = void 0;
const plan_stack_util_1 = require("../agent-engine/engine/main/plan/plan-stack.util");
function inferDeliverableFromWorkflowNodes(nodes) {
    const actions = new Set(nodes.map((row) => row.action));
    if (actions.has('write_data') ||
        (actions.has('compose_mutation') && actions.has('await_user_confirm'))) {
        return 'mutation';
    }
    return 'answer';
}
exports.inferDeliverableFromWorkflowNodes = inferDeliverableFromWorkflowNodes;
function workflowDefByStepId(nodes) {
    return new Map(nodes.map((row) => [row.id, row]));
}
function normalizeTaskPlanStepsForWorkflow(steps, nodes) {
    if (nodes.length === 0) {
        return steps;
    }
    const defs = workflowDefByStepId(nodes);
    return steps.map((step) => {
        var _a, _b;
        const def = defs.get(step.id);
        if ((def === null || def === void 0 ? void 0 : def.action) === 'await_user_confirm' && step.kind !== 'workflow_gate') {
            return Object.assign(Object.assign({}, step), { kind: 'workflow_gate', phase: (_a = step.phase) !== null && _a !== void 0 ? _a : 'answer', stopWhen: (_b = step.stopWhen) !== null && _b !== void 0 ? _b : 'always' });
        }
        if ((def === null || def === void 0 ? void 0 : def.action) === 'summarize_images' &&
            step.kind !== 'workflow_inline') {
            return Object.assign(Object.assign({}, step), { kind: 'workflow_inline', phase: 'gather', stopWhen: 'always', workflowAction: 'summarize_images' });
        }
        return step;
    });
}
exports.normalizeTaskPlanStepsForWorkflow = normalizeTaskPlanStepsForWorkflow;
function normalizeFramesForWorkflow(plan, nodes) {
    if (plan.frames.length === 0) {
        return plan.frames;
    }
    return plan.frames.map((frame) => (Object.assign(Object.assign({}, frame), { steps: normalizeTaskPlanStepsForWorkflow(frame.steps, nodes) })));
}
function normalizeTaskPlanSnapshotForWorkflow(input) {
    const { plan, nodes } = input;
    const inferred = inferDeliverableFromWorkflowNodes(nodes);
    const deliverable = plan.deliverable === 'answer' && inferred === 'mutation'
        ? inferred
        : plan.deliverable;
    const steps = normalizeTaskPlanStepsForWorkflow(plan.steps, nodes);
    const frames = normalizeFramesForWorkflow(plan, nodes);
    const next = Object.assign(Object.assign({}, plan), { deliverable,
        steps,
        frames });
    return plan.frames.length > 0 ? (0, plan_stack_util_1.syncPlanFromActiveFrame)(next) : next;
}
exports.normalizeTaskPlanSnapshotForWorkflow = normalizeTaskPlanSnapshotForWorkflow;
//# sourceMappingURL=normalize-task-plan-for-workflow.util.js.map