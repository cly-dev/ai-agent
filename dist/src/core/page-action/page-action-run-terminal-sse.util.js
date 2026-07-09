"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitPageActionRunTerminalSse = exports.mapTerminalPhaseToRunStatus = exports.resolvePageActionRunTerminalOutcome = void 0;
const client_1 = require("../../../generated/prisma/client");
const page_action_constants_1 = require("./page-action.constants");
const page_action_inline_sse_util_1 = require("./page-action-inline-sse.util");
function resolvePageActionRunTerminalOutcome(completion) {
    switch (completion.kind) {
        case 'suspended':
            return {
                phase: 'awaiting_approval',
                fillText: null,
                errorCode: null,
                errorMessage: null,
            };
        case 'failed':
            return {
                phase: 'failed',
                fillText: null,
                errorCode: completion.errorCode,
                errorMessage: completion.errorMessage,
            };
        case 'text':
            return {
                phase: 'completed',
                fillText: completion.fillText,
                errorCode: null,
                errorMessage: null,
            };
        case 'http_write':
        case 'http_read':
        case 'workflow_done':
            return {
                phase: 'completed',
                fillText: null,
                errorCode: null,
                errorMessage: null,
            };
    }
}
exports.resolvePageActionRunTerminalOutcome = resolvePageActionRunTerminalOutcome;
function mapTerminalPhaseToRunStatus(phase) {
    switch (phase) {
        case 'awaiting_approval':
            return client_1.PageActionRunStatus.awaiting_approval;
        case 'failed':
            return client_1.PageActionRunStatus.failed;
        case 'completed':
            return client_1.PageActionRunStatus.completed;
    }
}
exports.mapTerminalPhaseToRunStatus = mapTerminalPhaseToRunStatus;
function emitPageActionRunTerminalSse(input) {
    var _a, _b, _c, _d, _e, _f;
    const lifecycleBase = {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        delivery: client_1.PageActionDelivery.inline_stream,
        generation: input.generation,
        streamId: (_a = input.streamId) !== null && _a !== void 0 ? _a : (0, page_action_constants_1.buildPageActionStreamId)({
            actionRunId: input.actionRunId,
            actionKey: input.actionKey,
        }),
        clientActionId: input.clientActionId,
    };
    if (input.outcome.phase === 'awaiting_approval') {
        (0, page_action_inline_sse_util_1.writePageActionLifecycle)(input.sseSink, Object.assign({ phase: 'awaiting_approval' }, lifecycleBase), input.recorder);
        return;
    }
    if (input.outcome.phase === 'failed') {
        (0, page_action_inline_sse_util_1.writePageActionLifecycle)(input.sseSink, Object.assign(Object.assign({ phase: 'failed' }, lifecycleBase), { errorCode: (_b = input.outcome.errorCode) !== null && _b !== void 0 ? _b : 'RUN_FAILED', errorMessage: (_d = (_c = input.outcome.errorMessage) !== null && _c !== void 0 ? _c : input.outcome.errorCode) !== null && _d !== void 0 ? _d : 'Page action run failed' }), input.recorder);
        (0, page_action_inline_sse_util_1.endInlineSseResponse)(input.sseSink);
        return;
    }
    (0, page_action_inline_sse_util_1.writePageActionLifecycle)(input.sseSink, Object.assign(Object.assign({ phase: 'completed' }, lifecycleBase), { text: (_e = input.outcome.fillText) !== null && _e !== void 0 ? _e : undefined, dslOutcome: (_f = input.dslOutcome) !== null && _f !== void 0 ? _f : null }), input.recorder);
    (0, page_action_inline_sse_util_1.endInlineSseResponse)(input.sseSink);
}
exports.emitPageActionRunTerminalSse = emitPageActionRunTerminalSse;
//# sourceMappingURL=page-action-run-terminal-sse.util.js.map