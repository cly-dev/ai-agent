"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageAwaitUserConfirmExecutor = void 0;
const workflow_plan_sync_util_1 = require("../../workflow-plan-sync.util");
const executor_host_util_1 = require("../executor-host.util");
exports.pageAwaitUserConfirmExecutor = {
    action: 'await_user_confirm',
    async run(ctx) {
        (0, executor_host_util_1.requirePageExecutorHost)(ctx.host);
        return {
            kind: 'awaiting_user_confirm',
            workflowRun: (0, workflow_plan_sync_util_1.ensureWorkflowNodeStarted)(ctx.workflowRun, ctx.nodeId),
        };
    },
};
//# sourceMappingURL=page-await-user-confirm.executor.js.map