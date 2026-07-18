"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileTaskPlanFromWorkflow = exports.compileTaskPlanFromWorkflowNodes = void 0;
const normalize_task_plan_for_workflow_util_1 = require("./normalize-task-plan-for-workflow.util");
const resolve_workflow_node_tool_refs_util_1 = require("./resolve-workflow-node-tool-refs.util");
function mapFetchDataToPlanStep(node) {
    return {
        id: node.id,
        kind: 'tool',
        objective: node.objective,
        phase: 'gather',
        toolRole: 'read-detail',
    };
}
function mapGenerateAndPushToPlanSteps(node) {
    const hostToolIds = (0, resolve_workflow_node_tool_refs_util_1.resolveGenerateAndPushHostToolIds)(node.input);
    return [
        {
            id: `${node.id}:reason`,
            kind: 'reason',
            objective: node.objective,
            phase: 'answer',
        },
        Object.assign({ id: node.id, kind: 'host_tool', objective: node.objective, phase: 'answer' }, (hostToolIds.length > 0 ? { hostToolIds } : {})),
    ];
}
function mapSummarizeToPlanStep(node) {
    return {
        id: node.id,
        kind: 'summarize',
        objective: node.objective,
        phase: 'answer',
    };
}
function mapWorkflowNodeToPlanSteps(node) {
    switch (node.action) {
        case 'detect_clues':
            return [];
        case 'summarize_images':
            return [
                {
                    id: node.id,
                    kind: 'workflow_inline',
                    objective: node.objective,
                    phase: 'gather',
                    stopWhen: 'always',
                    workflowAction: 'summarize_images',
                },
            ];
        case 'fetch_data':
            return [mapFetchDataToPlanStep(node)];
        case 'generate_and_push':
            return mapGenerateAndPushToPlanSteps(node);
        case 'summarize':
        case 'present_mutation':
            return [mapSummarizeToPlanStep(node)];
        case 'compose_mutation':
            return [
                {
                    id: node.id,
                    kind: 'tool',
                    objective: node.objective,
                    phase: 'analyze',
                    toolRole: 'write-single',
                },
            ];
        case 'write_data':
            return [
                {
                    id: node.id,
                    kind: 'tool',
                    objective: node.objective,
                    phase: 'mutate',
                    toolRole: 'write-single',
                },
            ];
        case 'await_user_confirm':
            return [
                {
                    id: node.id,
                    kind: 'workflow_gate',
                    objective: node.objective,
                    phase: 'answer',
                    stopWhen: 'always',
                },
            ];
        default:
            return [];
    }
}
function compileTaskPlanFromWorkflowNodes(nodes) {
    const steps = [];
    for (const node of nodes) {
        steps.push(...mapWorkflowNodeToPlanSteps(node));
    }
    return steps;
}
exports.compileTaskPlanFromWorkflowNodes = compileTaskPlanFromWorkflowNodes;
function compileTaskPlanFromWorkflow(input) {
    var _a;
    const steps = compileTaskPlanFromWorkflowNodes(input.nodes);
    if (steps.length === 0) {
        return null;
    }
    const first = steps[0];
    const base = {
        source: 'workflow',
        originalUserRequest: input.originalUserRequest,
        goal: (_a = input.goal) !== null && _a !== void 0 ? _a : input.originalUserRequest,
        deliverable: (0, normalize_task_plan_for_workflow_util_1.inferDeliverableFromWorkflowNodes)(input.nodes),
        constraints: [],
        steps,
        pendingStepIds: steps.map((row) => row.id),
        completedStepIds: [],
        taskPhase: first.phase,
        currentObjective: first.objective,
        currentStepId: first.id,
        frames: [],
        activeFrameIndex: 0,
    };
    return (0, normalize_task_plan_for_workflow_util_1.normalizeTaskPlanSnapshotForWorkflow)({
        plan: base,
        nodes: input.nodes,
    });
}
exports.compileTaskPlanFromWorkflow = compileTaskPlanFromWorkflow;
//# sourceMappingURL=compile-task-plan-from-workflow.util.js.map