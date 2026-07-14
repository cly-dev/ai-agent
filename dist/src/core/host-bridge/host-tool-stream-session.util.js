"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostToolStreamSession = void 0;
const host_action_dispatch_util_1 = require("./host-action-dispatch.util");
const host_action_resolve_util_1 = require("./host-action.resolve.util");
const host_tool_stream_types_1 = require("./host-tool-stream.types");
const page_context_anchor_util_1 = require("./page-context-anchor.util");
const host_tool_stream_target_util_1 = require("./host-tool-stream-target.util");
class HostToolStreamSession {
    constructor(config) {
        this.config = config;
        this.seq = 0;
        this.streamId = null;
        this.calls = [];
        this.appendEmittedCount = 0;
        this.closed = false;
    }
    get activeStreamId() {
        return this.streamId;
    }
    get isClosed() {
        return this.closed;
    }
    get hasBegun() {
        return this.streamId != null;
    }
    hostStepIdField() {
        var _a, _b;
        const id = ((_a = this.config.hostStepId) === null || _a === void 0 ? void 0 : _a.trim()) || ((_b = this.config.planStepId) === null || _b === void 0 ? void 0 : _b.trim());
        return id ? id : undefined;
    }
    hostStepIdPayload() {
        const id = this.hostStepIdField();
        if (!id) {
            return undefined;
        }
        return { hostStepId: id, planStepId: id };
    }
    begin(input) {
        var _a, _b, _c;
        if (this.closed) {
            return;
        }
        const reason = (_b = (_a = input.reason) !== null && _a !== void 0 ? _a : this.config.reason) !== null && _b !== void 0 ? _b : host_tool_stream_target_util_1.HOST_TOOL_STREAM_REASON;
        this.streamId = input.streamId;
        this.emitFrame('begin', Object.assign(Object.assign(Object.assign(Object.assign({ op: 'session.begin', streamId: input.streamId, scope: this.scope(), entity: this.entity() }, (this.metadata() ? { metadata: this.metadata() } : {})), { reason }), ((_c = this.hostStepIdPayload()) !== null && _c !== void 0 ? _c : {})), { runId: this.config.runId, turnId: this.config.turnId }), reason);
        this.calls = input.tools.map((tool, index) => {
            const callId = `${input.streamId}:${index}`;
            this.emitFrame('delta', {
                op: 'tool.begin',
                streamId: input.streamId,
                callId,
                index,
                name: tool.name,
            }, reason);
            return {
                callId,
                index,
                name: tool.name,
                streamablePath: tool.streamablePath,
            };
        });
    }
    get appendCount() {
        return this.appendEmittedCount;
    }
    get hasActiveStream() {
        return this.streamId != null && !this.closed;
    }
    appendFillChunk(chunk) {
        var _a;
        if (!this.streamId || this.closed || !chunk) {
            return;
        }
        const reason = (_a = this.config.reason) !== null && _a !== void 0 ? _a : host_tool_stream_target_util_1.HOST_TOOL_STREAM_REASON;
        for (const call of this.calls) {
            this.emitFrame('delta', {
                op: 'arg.append',
                streamId: this.streamId,
                callId: call.callId,
                path: call.streamablePath,
                chunk,
            }, reason);
        }
        this.appendEmittedCount += 1;
    }
    finalize(input) {
        var _a, _b;
        const streamId = this.streamId;
        const reason = (_b = (_a = input.reason) !== null && _a !== void 0 ? _a : this.config.reason) !== null && _b !== void 0 ? _b : host_tool_stream_target_util_1.HOST_TOOL_STREAM_REASON;
        for (const call of this.calls) {
            this.emitFrame('commit', {
                op: 'tool.commit',
                streamId,
                callId: call.callId,
            }, reason);
        }
        this.emitFrame('end', {
            op: 'session.end',
            streamId,
        }, reason);
        const fullPayload = this.buildAndEmitFullPayload(input.hostTools, input.reason);
        this.closed = true;
        return {
            streamId,
            hostTools: input.hostTools,
            appendCount: this.appendEmittedCount,
            fullPayload,
        };
    }
    dispatchInstant(input) {
        var _a, _b, _c;
        if (this.closed) {
            throw new Error('HostToolStreamSession already closed');
        }
        if (input.hostTools.length === 0) {
            this.closed = true;
            throw new Error('dispatchInstant requires at least one host tool');
        }
        const streamId = input.streamId;
        const reason = (_b = (_a = input.reason) !== null && _a !== void 0 ? _a : this.config.reason) !== null && _b !== void 0 ? _b : host_tool_stream_target_util_1.HOST_TOOL_STREAM_REASON;
        this.streamId = streamId;
        this.emitFrame('begin', Object.assign(Object.assign(Object.assign(Object.assign({ op: 'session.begin', streamId, scope: this.scope(), entity: this.entity() }, (this.metadata() ? { metadata: this.metadata() } : {})), { reason }), ((_c = this.hostStepIdPayload()) !== null && _c !== void 0 ? _c : {})), { runId: this.config.runId, turnId: this.config.turnId }), reason);
        for (const [index, tool] of input.hostTools.entries()) {
            const callId = `${streamId}:${index}`;
            this.emitFrame('delta', {
                op: 'tool.begin',
                streamId,
                callId,
                index,
                name: tool.name,
            }, reason);
            this.emitFrame('delta', {
                op: 'tool.flush',
                streamId,
                callId,
                name: tool.name,
                args: tool.args,
            }, reason);
            this.emitFrame('commit', {
                op: 'tool.commit',
                streamId,
                callId,
            }, reason);
        }
        this.emitFrame('end', {
            op: 'session.end',
            streamId,
        }, reason);
        const fullPayload = this.buildAndEmitFullPayload(input.hostTools, reason);
        this.closed = true;
        this.streamId = null;
        this.calls = [];
        return fullPayload;
    }
    abort(options) {
        if ((options === null || options === void 0 ? void 0 : options.emitSessionEnd) &&
            this.streamId &&
            !this.closed) {
            this.emitFrame('end', {
                op: 'session.end',
                streamId: this.streamId,
            });
        }
        this.closed = true;
        this.streamId = null;
        this.calls = [];
    }
    scope() {
        var _a;
        return (_a = (0, page_context_anchor_util_1.resolveHostToolPageScope)(this.config.pageContext)) !== null && _a !== void 0 ? _a : undefined;
    }
    entity() {
        return this.config.pageContext.entity
            ? Object.assign({}, this.config.pageContext.entity)
            : undefined;
    }
    metadata() {
        return (0, host_action_resolve_util_1.resolveHostActionMetadata)(this.config.pageContext);
    }
    buildAndEmitFullPayload(hostTools, reason) {
        var _a, _b;
        this.seq += 1;
        const fullPayload = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ action: 'host_action', v: host_tool_stream_types_1.HOST_TOOL_STREAM_PROTOCOL_VERSION, stream: { mode: 'full', seq: this.seq }, scope: this.scope(), entity: this.entity() }, (this.metadata() ? { metadata: this.metadata() } : {})), { hostTools }), ((_a = this.hostStepIdPayload()) !== null && _a !== void 0 ? _a : {})), { reason: (_b = reason !== null && reason !== void 0 ? reason : this.config.reason) !== null && _b !== void 0 ? _b : host_tool_stream_target_util_1.HOST_TOOL_STREAM_REASON, runId: this.config.runId, turnId: this.config.turnId }), (this.config.generation != null
            ? { generation: this.config.generation }
            : {}));
        (0, host_action_dispatch_util_1.dispatchHostActionSse)(this.config.publish, this.config.sessionId, fullPayload);
        return fullPayload;
    }
    emitFrame(mode, dsl, reasonOverride) {
        var _a, _b;
        this.seq += 1;
        (0, host_action_dispatch_util_1.dispatchHostActionSse)(this.config.publish, this.config.sessionId, Object.assign(Object.assign(Object.assign(Object.assign({ action: 'host_action', v: host_tool_stream_types_1.HOST_TOOL_STREAM_PROTOCOL_VERSION, stream: { mode, seq: this.seq }, dsl, scope: this.scope(), entity: this.entity() }, (this.metadata() ? { metadata: this.metadata() } : {})), ((_a = this.hostStepIdPayload()) !== null && _a !== void 0 ? _a : {})), { reason: (_b = reasonOverride !== null && reasonOverride !== void 0 ? reasonOverride : this.config.reason) !== null && _b !== void 0 ? _b : host_tool_stream_target_util_1.HOST_TOOL_STREAM_REASON, runId: this.config.runId, turnId: this.config.turnId }), (this.config.generation != null
            ? { generation: this.config.generation }
            : {})));
    }
}
exports.HostToolStreamSession = HostToolStreamSession;
//# sourceMappingURL=host-tool-stream-session.util.js.map