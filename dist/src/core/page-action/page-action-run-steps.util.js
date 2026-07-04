"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageActionRunStepRecorder = void 0;
const host_tool_stream_types_1 = require("../host-bridge/host-tool-stream.types");
class PageActionRunStepRecorder {
    constructor(steps = []) {
        this.steps = steps;
        this.nextStep = 1;
        if (steps.length > 0) {
            this.nextStep = Math.max(...steps.map((row) => row.step)) + 1;
        }
    }
    static fromJson(value) {
        if (!Array.isArray(value)) {
            return new PageActionRunStepRecorder();
        }
        const steps = value.filter((row) => typeof row === 'object' &&
            row != null &&
            typeof row.step === 'number' &&
            typeof row.type === 'string' &&
            typeof row.name === 'string');
        return new PageActionRunStepRecorder(steps);
    }
    record(input) {
        const row = Object.assign(Object.assign({ step: this.nextStep, type: input.type, name: input.name, at: new Date().toISOString() }, (input.status ? { status: input.status } : {})), (input.detail ? { detail: input.detail } : {}));
        this.nextStep += 1;
        this.steps.push(row);
        return row;
    }
    recordLifecycle(phase, detail, status) {
        return this.record({
            type: 'lifecycle',
            name: phase,
            status,
            detail,
        });
    }
    recordLlm(name, detail, status = 'ok') {
        return this.record({ type: 'llm', name, detail, status });
    }
    recordHostActionPayload(payload) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (!(0, host_tool_stream_types_1.isHostActionStreamPayload)(payload)) {
            return this.record({
                type: 'dsl',
                name: 'host_action.batch',
                detail: {
                    hostToolCount: (_b = (_a = payload.hostTools) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0,
                    reason: (_c = payload.reason) !== null && _c !== void 0 ? _c : null,
                },
            });
        }
        const op = (_e = (_d = payload.dsl) === null || _d === void 0 ? void 0 : _d.op) !== null && _e !== void 0 ? _e : `stream.${payload.stream.mode}`;
        const detail = {
            streamMode: payload.stream.mode,
            seq: payload.stream.seq,
            reason: (_f = payload.reason) !== null && _f !== void 0 ? _f : null,
            streamId: payload.dsl && 'streamId' in payload.dsl
                ? payload.dsl.streamId
                : null,
        };
        if (((_g = payload.dsl) === null || _g === void 0 ? void 0 : _g.op) === 'arg.append') {
            detail.appendChunkLength = payload.dsl.chunk.length;
        }
        if (payload.stream.mode === 'full') {
            detail.hostToolCount = (_j = (_h = payload.hostTools) === null || _h === void 0 ? void 0 : _h.length) !== null && _j !== void 0 ? _j : 0;
            detail.generation = (_k = payload.generation) !== null && _k !== void 0 ? _k : null;
        }
        return this.record({
            type: 'dsl',
            name: op,
            detail,
            status: payload.stream.mode === 'full' ? 'ok' : undefined,
        });
    }
    toJson() {
        return [...this.steps];
    }
}
exports.PageActionRunStepRecorder = PageActionRunStepRecorder;
//# sourceMappingURL=page-action-run-steps.util.js.map