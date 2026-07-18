"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryBuildTaskPlanFromSkillWorkflow = void 0;
const compile_task_plan_from_workflow_util_1 = require("./compile-task-plan-from-workflow.util");
const load_flow_for_run_util_1 = require("./load-flow-for-run.util");
const load_workflow_definition_util_1 = require("./load-workflow-definition.util");
async function tryBuildTaskPlanFromSkillWorkflow(prisma, input) {
    var _a, _b, _c;
    const hasScope = input.allowedToolIds !== undefined || input.allowedHostToolIds !== undefined;
    const scope = hasScope
        ? {
            allowedToolIds: (_a = input.allowedToolIds) !== null && _a !== void 0 ? _a : [],
            allowedHostToolIds: (_b = input.allowedHostToolIds) !== null && _b !== void 0 ? _b : [],
        }
        : undefined;
    const overrides = (0, load_workflow_definition_util_1.parseWorkflowOverridesJson)(input.binding.workflowOverrides);
    const flowId = (_c = input.binding.flowId) !== null && _c !== void 0 ? _c : null;
    if (flowId == null || flowId <= 0) {
        return null;
    }
    const detailed = await (0, load_flow_for_run_util_1.loadFlowForRunDetailed)(prisma, {
        flowId,
        appClientId: input.appClientId,
        flowVersion: input.binding.flowVersion,
        workflowOverrides: overrides,
        scope,
    });
    if (detailed.status !== 'loaded') {
        return null;
    }
    return (0, compile_task_plan_from_workflow_util_1.compileTaskPlanFromWorkflow)({
        nodes: detailed.nodes,
        originalUserRequest: input.userMessage,
        goal: input.goal,
    });
}
exports.tryBuildTaskPlanFromSkillWorkflow = tryBuildTaskPlanFromSkillWorkflow;
//# sourceMappingURL=resolve-skill-workflow-plan.util.js.map