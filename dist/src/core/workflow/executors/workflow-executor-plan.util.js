"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectedTaskPlanForExecutor = void 0;
const workflow_plan_sync_util_1 = require("../workflow-plan-sync.util");
const executor_host_util_1 = require("./executor-host.util");
function projectedTaskPlanForExecutor(ctx) {
    var _a;
    const chat = (0, executor_host_util_1.requireChatExecutorHost)(ctx.host);
    return ((_a = (0, workflow_plan_sync_util_1.projectTaskPlanFromWorkflowRun)({
        taskPlan: chat.state.taskPlan,
        workflowRun: ctx.workflowRun,
        workflowNodeDefs: chat.state.workflowNodeDefs,
    })) !== null && _a !== void 0 ? _a : chat.state.taskPlan);
}
exports.projectedTaskPlanForExecutor = projectedTaskPlanForExecutor;
//# sourceMappingURL=workflow-executor-plan.util.js.map