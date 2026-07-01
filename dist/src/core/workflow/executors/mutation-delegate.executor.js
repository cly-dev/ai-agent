"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.awaitUserConfirmExecutor = exports.writeDataExecutor = exports.composeMutationExecutor = void 0;
function delegateReact(ctx) {
    return {
        kind: 'delegate_react',
        workflowRun: ctx.workflowRun,
        workflowAwaitingReact: true,
    };
}
exports.composeMutationExecutor = {
    action: 'compose_mutation',
    async run(ctx) {
        return delegateReact(ctx);
    },
};
exports.writeDataExecutor = {
    action: 'write_data',
    async run(ctx) {
        return delegateReact(ctx);
    },
};
exports.awaitUserConfirmExecutor = {
    action: 'await_user_confirm',
    async run(ctx) {
        return {
            kind: 'awaiting_user_confirm',
            workflowRun: ctx.workflowRun,
        };
    },
};
//# sourceMappingURL=mutation-delegate.executor.js.map