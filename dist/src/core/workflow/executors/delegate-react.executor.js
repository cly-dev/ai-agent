"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndPushExecutor = exports.fetchDataExecutor = void 0;
exports.fetchDataExecutor = {
    action: 'fetch_data',
    async run(ctx) {
        return {
            kind: 'delegate_react',
            workflowRun: ctx.workflowRun,
            workflowAwaitingReact: true,
        };
    },
};
exports.generateAndPushExecutor = {
    action: 'generate_and_push',
    async run(ctx) {
        return {
            kind: 'delegate_react',
            workflowRun: ctx.workflowRun,
            workflowAwaitingReact: true,
        };
    },
};
//# sourceMappingURL=delegate-react.executor.js.map