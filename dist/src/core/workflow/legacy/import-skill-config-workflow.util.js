"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importSkillConfigWorkflowDeliverable = exports.importSkillConfigWorkflowNodes = void 0;
const task_plan_util_1 = require("../../agent-engine/engine/main/plan/task-plan.util");
const compile_plan_to_workflow_util_1 = require("../compile-plan-to-workflow.util");
function importSkillConfigWorkflowNodes(skillConfig) {
    var _a;
    const parsed = (0, task_plan_util_1.parseSkillPlanConfig)(skillConfig);
    if (!((_a = parsed.workflowSteps) === null || _a === void 0 ? void 0 : _a.length)) {
        return [];
    }
    return (0, compile_plan_to_workflow_util_1.compileTaskPlanToWorkflowNodes)(parsed.workflowSteps);
}
exports.importSkillConfigWorkflowNodes = importSkillConfigWorkflowNodes;
function importSkillConfigWorkflowDeliverable(skillConfig) {
    var _a;
    const parsed = (0, task_plan_util_1.parseSkillPlanConfig)(skillConfig);
    return (_a = parsed.deliverable) !== null && _a !== void 0 ? _a : null;
}
exports.importSkillConfigWorkflowDeliverable = importSkillConfigWorkflowDeliverable;
//# sourceMappingURL=import-skill-config-workflow.util.js.map