"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeActionExecutor = void 0;
const turn_respond_util_1 = require("../../agent-engine/engine/turn/turn-respond.util");
const workflow_plan_sync_util_1 = require("../workflow-plan-sync.util");
const task_plan_util_1 = require("../../agent-engine/engine/main/plan/task-plan.util");
const executor_host_util_1 = require("./executor-host.util");
const workflow_executor_plan_util_1 = require("./workflow-executor-plan.util");
exports.summarizeActionExecutor = {
    action: 'summarize',
    async run(ctx) {
        const chat = (0, executor_host_util_1.requireChatExecutorHost)(ctx.host);
        const workflowRun = (0, workflow_plan_sync_util_1.ensureWorkflowNodeStarted)(ctx.workflowRun, ctx.nodeId);
        const taskPlan = (0, workflow_executor_plan_util_1.projectedTaskPlanForExecutor)(ctx);
        const summarizeObservation = chat.bundle.summarize.buildSummarizeObservationFromState(Object.assign(Object.assign({}, chat.state), { taskPlan }), { taskPlan, scopedTools: chat.state.scopedTools, workflowNodeDefs: chat.state.workflowNodeDefs });
        return {
            kind: 'pending_summarize',
            workflowRun,
            pendingRespond: (0, turn_respond_util_1.pendingRespondFromObservation)((0, task_plan_util_1.buildPlanSummarizeObservation)({
                userMessage: chat.bundle.ctx.input.latestUserMessage,
                summarizeObservation,
            })),
        };
    },
};
//# sourceMappingURL=summarize-action.executor.js.map