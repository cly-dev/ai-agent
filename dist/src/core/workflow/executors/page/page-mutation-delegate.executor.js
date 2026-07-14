"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageWriteDataExecutor = exports.pageComposeMutationExecutor = void 0;
function delegateReact(ctx) {
    return {
        kind: 'delegate_react',
        workflowRun: ctx.workflowRun,
        workflowAwaitingReact: true,
    };
}
exports.pageComposeMutationExecutor = {
    action: 'compose_mutation',
    async run(ctx) {
        return delegateReact(ctx);
    },
};
exports.pageWriteDataExecutor = {
    action: 'write_data',
    async run(ctx) {
        return delegateReact(ctx);
    },
};
//# sourceMappingURL=page-mutation-delegate.executor.js.map