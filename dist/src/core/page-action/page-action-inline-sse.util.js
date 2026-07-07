"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endInlineSseResponse = exports.writePageWorkflowNodeSse = exports.writePageActionLifecycle = exports.createInlineHostActionPublisher = exports.writeSseEvent = void 0;
function resolveSseTarget(target) {
    return target;
}
function writeSseEvent(target, event, data) {
    const sink = resolveSseTarget(target);
    if (sink.writableEnded) {
        return;
    }
    sink.emit(event, data);
}
exports.writeSseEvent = writeSseEvent;
function createInlineHostActionPublisher(target, options) {
    return (_sessionId, envelope) => {
        var _a;
        (_a = options === null || options === void 0 ? void 0 : options.onPayload) === null || _a === void 0 ? void 0 : _a.call(options, envelope.payload);
        writeSseEvent(target, 'host_action', envelope.payload);
    };
}
exports.createInlineHostActionPublisher = createInlineHostActionPublisher;
function writePageActionLifecycle(target, payload, recorder) {
    var _a, _b, _c, _d, _e, _f, _g;
    recorder === null || recorder === void 0 ? void 0 : recorder.recordLifecycle(payload.phase, {
        actionRunId: payload.actionRunId,
        actionKey: payload.actionKey,
        delivery: payload.delivery,
        generation: payload.generation,
        streamId: (_a = payload.streamId) !== null && _a !== void 0 ? _a : null,
        clientActionId: (_b = payload.clientActionId) !== null && _b !== void 0 ? _b : null,
        dslOutcome: (_c = payload.dslOutcome) !== null && _c !== void 0 ? _c : null,
        errorCode: (_d = payload.errorCode) !== null && _d !== void 0 ? _d : null,
        errorMessage: (_e = payload.errorMessage) !== null && _e !== void 0 ? _e : null,
        textLength: (_g = (_f = payload.text) === null || _f === void 0 ? void 0 : _f.length) !== null && _g !== void 0 ? _g : null,
    }, payload.phase === 'failed' ? 'failed' : payload.phase === 'completed' ? 'ok' : undefined);
    writeSseEvent(target, 'page_action', payload);
}
exports.writePageActionLifecycle = writePageActionLifecycle;
function writePageWorkflowNodeSse(target, payload) {
    const sink = resolveSseTarget(target);
    if (sink.writableEnded) {
        return;
    }
    writeSseEvent(sink, 'page_workflow', payload);
}
exports.writePageWorkflowNodeSse = writePageWorkflowNodeSse;
function endInlineSseResponse(target) {
    resolveSseTarget(target).end();
}
exports.endInlineSseResponse = endInlineSseResponse;
//# sourceMappingURL=page-action-inline-sse.util.js.map