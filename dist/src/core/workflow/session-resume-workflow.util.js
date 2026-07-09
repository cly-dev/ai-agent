"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryBuildSessionResumeWorkflowSlice = void 0;
const compile_plan_to_workflow_util_1 = require("./compile-plan-to-workflow.util");
const workflow_resume_util_1 = require("./workflow-resume.util");
function nodeDefsCoverRun(defs, run) {
    const defIds = new Set(defs.map((row) => row.id));
    return run.nodes.every((row) => defIds.has(row.nodeId));
}
function tryBuildSessionResumeWorkflowSlice(input) {
    if (!(0, workflow_resume_util_1.isResumableWorkflowRun)(input.workflowRun)) {
        return null;
    }
    const nodes = (0, compile_plan_to_workflow_util_1.compileTaskPlanToWorkflowNodes)(input.taskPlan.steps);
    if (nodes.length === 0 || !nodeDefsCoverRun(nodes, input.workflowRun)) {
        return null;
    }
    return (0, workflow_resume_util_1.buildWorkflowResumeGraphSlice)({
        savedRun: input.workflowRun,
        nodes,
    });
}
exports.tryBuildSessionResumeWorkflowSlice = tryBuildSessionResumeWorkflowSlice;
//# sourceMappingURL=session-resume-workflow.util.js.map