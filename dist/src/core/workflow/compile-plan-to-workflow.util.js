"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileTaskPlanToWorkflow = exports.compileTaskPlanToWorkflowNodes = void 0;
const task_plan_util_1 = require("../agent-engine/engine/main/plan/task-plan.util");
const workflow_run_util_1 = require("./workflow-run.util");
function mapPlanSourceToCompiledFrom(source, method) {
    if (source === 'llm') {
        return 'plan_llm';
    }
    if (source === 'template' || source === 'page_context') {
        return 'template';
    }
    if (source === 'minimal') {
        return 'minimal';
    }
    if (source === 'workflow') {
        return 'legacy_config';
    }
    if (method === 'session_resume') {
        return 'resume';
    }
    return 'template';
}
function baseNodeFromStep(step) {
    return {
        id: step.id,
        name: step.id,
        objective: step.objective,
    };
}
function mapAwaitUserConfirmNode(step) {
    return Object.assign(Object.assign({}, baseNodeFromStep(Object.assign(Object.assign({}, step), { id: `${step.id}_await`, objective: 'Wait for user confirmation before executing write.' }))), { action: 'await_user_confirm', input: { confirmKind: 'mutation' } });
}
function mapPlanStepToWorkflowNodes(step) {
    if ((0, task_plan_util_1.isPlanComposeWriteStep)(step)) {
        return [
            Object.assign(Object.assign({}, baseNodeFromStep(step)), { action: 'compose_mutation', input: {} }),
        ];
    }
    if ((0, task_plan_util_1.isPlanPresentSummarizeStep)(step)) {
        return [
            Object.assign(Object.assign({}, baseNodeFromStep(step)), { action: 'present_mutation', input: {} }),
        ];
    }
    if ((0, task_plan_util_1.isComposeMutationParameterStep)(step)) {
        return [
            Object.assign(Object.assign({}, baseNodeFromStep(step)), { action: 'compose_mutation', input: {} }),
        ];
    }
    if ((0, task_plan_util_1.isPlanWriteFallbackStep)(step)) {
        return [
            mapAwaitUserConfirmNode(step),
            Object.assign(Object.assign({}, baseNodeFromStep(step)), { action: 'write_data', input: {} }),
        ];
    }
    switch (step.kind) {
        case 'tool':
            if ((0, task_plan_util_1.isPlanWriteToolStep)(step) && step.phase === 'mutate') {
                if ((0, task_plan_util_1.isPlanWriteFallbackStep)(step)) {
                    return [
                        mapAwaitUserConfirmNode(step),
                        Object.assign(Object.assign({}, baseNodeFromStep(step)), { action: 'write_data', input: {} }),
                    ];
                }
                return [
                    Object.assign(Object.assign({}, baseNodeFromStep(step)), { action: 'write_data', input: {} }),
                ];
            }
            return [
                Object.assign(Object.assign({}, baseNodeFromStep(step)), { action: 'fetch_data', input: {} }),
            ];
        case 'host_tool':
            return [
                Object.assign(Object.assign({}, baseNodeFromStep(step)), { action: 'generate_and_push', objective: step.objective, input: { hostToolId: 0 } }),
            ];
        case 'summarize':
            return [
                Object.assign(Object.assign({}, baseNodeFromStep(step)), { action: 'summarize', input: { mode: 'final' } }),
            ];
        case 'reason':
            return [
                Object.assign(Object.assign({}, baseNodeFromStep(step)), { action: 'summarize', input: { mode: 'draft' } }),
            ];
        case 'workflow_gate':
            return [
                Object.assign(Object.assign({}, baseNodeFromStep(step)), { action: 'await_user_confirm', input: { confirmKind: 'mutation' } }),
            ];
        case 'skill':
            return [];
        default:
            return [];
    }
}
function compileTaskPlanToWorkflowNodes(steps) {
    const nodes = [];
    for (const step of steps) {
        nodes.push(...mapPlanStepToWorkflowNodes(step));
    }
    if (nodes.length === 0 && steps.length > 0) {
        const fallback = steps[steps.length - 1];
        if (fallback) {
            nodes.push({
                id: fallback.id,
                action: 'summarize',
                name: fallback.id,
                objective: fallback.objective,
                input: { mode: 'final' },
            });
        }
    }
    return nodes;
}
exports.compileTaskPlanToWorkflowNodes = compileTaskPlanToWorkflowNodes;
function compileTaskPlanToWorkflow(input) {
    var _a, _b;
    const nodes = compileTaskPlanToWorkflowNodes(input.plan.steps);
    if (nodes.length === 0) {
        return null;
    }
    const compiledFrom = mapPlanSourceToCompiledFrom(input.plan.source, input.resolveMethod);
    const workflowRun = (0, workflow_run_util_1.initWorkflowRun)({
        workflowId: (_a = input.workflowId) !== null && _a !== void 0 ? _a : 0,
        version: (_b = input.version) !== null && _b !== void 0 ? _b : 1,
        nodes,
        compiledFrom,
    });
    return { nodes, workflowRun, compiledFrom };
}
exports.compileTaskPlanToWorkflow = compileTaskPlanToWorkflow;
//# sourceMappingURL=compile-plan-to-workflow.util.js.map