"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyComposeMutationProgress = exports.applyPlanAdvanceAsWorkflowProgress = exports.isWorkflowBoundRun = void 0;
const task_plan_util_1 = require("../agent-engine/engine/main/plan/task-plan.util");
const workflow_plan_sync_util_1 = require("./workflow-plan-sync.util");
function isWorkflowBoundRun(workflowRun) {
    return ((workflowRun === null || workflowRun === void 0 ? void 0 : workflowRun.status) === 'running' && workflowRun.currentNodeId != null);
}
exports.isWorkflowBoundRun = isWorkflowBoundRun;
function applyPlanAdvanceAsWorkflowProgress(input) {
    var _a, _b;
    if (!input.planAdvance) {
        return { taskPlan: input.taskPlan };
    }
    if (!isWorkflowBoundRun(input.workflowRun)) {
        return { taskPlan: input.planAdvance.updatedPlan };
    }
    const workflowRun = (0, workflow_plan_sync_util_1.mirrorWorkflowRunAfterPlanAdvance)({
        workflowRun: input.workflowRun,
        planBefore: input.planBefore,
        planAdvance: input.planAdvance,
    });
    const taskPlan = (_a = (0, workflow_plan_sync_util_1.projectTaskPlanFromWorkflowRun)({
        taskPlan: input.planBefore,
        workflowRun,
        workflowNodeDefs: input.workflowNodeDefs,
    })) !== null && _a !== void 0 ? _a : input.planAdvance.updatedPlan;
    let workflowAwaitingReact = input.workflowAwaitingReact;
    if ((_b = input.options) === null || _b === void 0 ? void 0 : _b.clearWorkflowAwaitingReact) {
        workflowAwaitingReact = false;
    }
    else {
        workflowAwaitingReact = (0, workflow_plan_sync_util_1.deriveWorkflowAwaitingReact)({
            workflowRun,
            workflowNodeDefs: input.workflowNodeDefs,
        });
    }
    return { taskPlan, workflowRun, workflowAwaitingReact };
}
exports.applyPlanAdvanceAsWorkflowProgress = applyPlanAdvanceAsWorkflowProgress;
function applyComposeMutationProgress(input) {
    var _a;
    const planBefore = input.taskPlan;
    const planAdvance = (0, task_plan_util_1.advancePlanAfterStepComplete)(planBefore, input.planStepId);
    const progressed = applyPlanAdvanceAsWorkflowProgress({
        taskPlan: planBefore,
        workflowRun: input.workflowRun,
        workflowNodeDefs: input.workflowNodeDefs,
        workflowAwaitingReact: input.workflowAwaitingReact,
        planBefore,
        planAdvance,
        options: { clearWorkflowAwaitingReact: true },
    });
    return {
        taskPlan: ((_a = progressed.taskPlan) !== null && _a !== void 0 ? _a : planAdvance.updatedPlan),
        workflowRun: progressed.workflowRun,
        workflowAwaitingReact: progressed.workflowAwaitingReact,
        composeObservation: input.composeObservation,
    };
}
exports.applyComposeMutationProgress = applyComposeMutationProgress;
//# sourceMappingURL=workflow-plan-transition.util.js.map