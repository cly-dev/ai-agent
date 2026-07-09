"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendWorkflowInitSkippedStep = exports.appendWorkflowInitRunStep = exports.buildWorkflowInitRunStepOutput = void 0;
function buildWorkflowInitRunStepOutput(input) {
    var _a;
    return Object.assign({ event: 'workflow_init', source: input.source, compiledFrom: (_a = input.workflowRun.compiledFrom) !== null && _a !== void 0 ? _a : null, workflowId: input.workflowRun.workflowId, version: input.workflowRun.version, currentNodeId: input.workflowRun.currentNodeId, nodeCount: input.nodes.length, nodeIds: input.nodes.map((row) => row.id), actions: input.nodes.map((row) => row.action) }, (input.skillId != null ? { skillId: input.skillId } : {}));
}
exports.buildWorkflowInitRunStepOutput = buildWorkflowInitRunStepOutput;
function appendWorkflowInitRunStep(steps, stepNum, output) {
    return [
        ...steps,
        {
            step: stepNum,
            type: 'workflow',
            name: 'workflow_init',
            output,
        },
    ];
}
exports.appendWorkflowInitRunStep = appendWorkflowInitRunStep;
function appendWorkflowInitSkippedStep(steps, stepNum, input) {
    var _a;
    return [
        ...steps,
        {
            step: stepNum,
            type: 'workflow',
            name: 'workflow_init_skipped',
            output: Object.assign(Object.assign({ event: 'workflow_init_skipped', reason: input.reason }, (input.skillId != null ? { skillId: input.skillId } : {})), (((_a = input.nodeIds) === null || _a === void 0 ? void 0 : _a.length) ? { nodeIds: input.nodeIds } : {})),
        },
    ];
}
exports.appendWorkflowInitSkippedStep = appendWorkflowInitSkippedStep;
//# sourceMappingURL=workflow-init-audit.util.js.map