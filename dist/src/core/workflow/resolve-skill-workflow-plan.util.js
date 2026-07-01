"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryBuildTaskPlanFromSkillWorkflow = void 0;
const compile_task_plan_from_workflow_util_1 = require("./compile-task-plan-from-workflow.util");
const load_workflow_definition_util_1 = require("./load-workflow-definition.util");
async function tryBuildTaskPlanFromSkillWorkflow(prisma, input) {
    const loaded = await (0, load_workflow_definition_util_1.loadWorkflowForRun)(prisma, {
        workflowId: input.binding.workflowId,
        appClientId: input.appClientId,
        workflowVersion: input.binding.workflowVersion,
        workflowOverrides: (0, load_workflow_definition_util_1.parseWorkflowOverridesJson)(input.binding.workflowOverrides),
        scope: {
            allowedToolIds: input.allowedToolIds,
            allowedHostToolIds: input.allowedHostToolIds,
        },
    });
    if (!loaded) {
        return null;
    }
    return (0, compile_task_plan_from_workflow_util_1.compileTaskPlanFromWorkflow)({
        nodes: loaded.nodes,
        originalUserRequest: input.userMessage,
        goal: input.goal,
    });
}
exports.tryBuildTaskPlanFromSkillWorkflow = tryBuildTaskPlanFromSkillWorkflow;
//# sourceMappingURL=resolve-skill-workflow-plan.util.js.map