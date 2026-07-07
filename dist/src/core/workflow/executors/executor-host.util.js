"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageExecutorContext = exports.chatExecutorContext = exports.assertPageExecutorCompleted = exports.isCompletedExecutorOutcome = exports.resolveExecutorPageContext = exports.requirePageExecutorHost = exports.requireChatExecutorHost = void 0;
function requireChatExecutorHost(host) {
    if (host.profile !== 'chat') {
        throw new Error(`Expected chat workflow executor host, got ${host.profile}`);
    }
    return host;
}
exports.requireChatExecutorHost = requireChatExecutorHost;
function requirePageExecutorHost(host) {
    if (host.profile !== 'page') {
        throw new Error(`Expected page workflow executor host, got ${host.profile}`);
    }
    return host;
}
exports.requirePageExecutorHost = requirePageExecutorHost;
function resolveExecutorPageContext(host) {
    var _a, _b;
    if (host.profile === 'page') {
        return host.runtime.pageContext;
    }
    return ((_b = (_a = host.state.pageContext) !== null && _a !== void 0 ? _a : host.bundle.ctx.input.pageContext) !== null && _b !== void 0 ? _b : null);
}
exports.resolveExecutorPageContext = resolveExecutorPageContext;
function isCompletedExecutorOutcome(outcome) {
    return outcome.kind === 'completed';
}
exports.isCompletedExecutorOutcome = isCompletedExecutorOutcome;
function assertPageExecutorCompleted(action, outcome) {
    if (outcome.kind === 'failed') {
        throw new Error(outcome.error.message);
    }
    if (outcome.kind !== 'completed') {
        throw new Error(`Page workflow action ${action} must complete inline, got ${outcome.kind}`);
    }
    return outcome;
}
exports.assertPageExecutorCompleted = assertPageExecutorCompleted;
function chatExecutorContext(input) {
    return {
        host: {
            profile: 'chat',
            bundle: input.bundle,
            state: input.state,
        },
        def: input.def,
        nodeId: input.nodeId,
        workflowRun: input.workflowRun,
    };
}
exports.chatExecutorContext = chatExecutorContext;
function pageExecutorContext(input) {
    return {
        host: {
            profile: 'page',
            runtime: input.runtime,
        },
        def: input.def,
        nodeId: input.nodeId,
        workflowRun: input.workflowRun,
    };
}
exports.pageExecutorContext = pageExecutorContext;
//# sourceMappingURL=executor-host.util.js.map