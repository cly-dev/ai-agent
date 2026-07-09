"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPageHarnessRunner = exports.createChatHarnessRunner = exports.HarnessRunner = void 0;
const harness_trace_util_1 = require("./trace/harness-trace.util");
const DEFAULT_POLICY = {
    onSensorFail: 'degrade',
};
class HarnessRunner {
    constructor(config = {}) {
        this.config = config;
    }
    async runNode(input) {
        var _a, _b, _c, _d, _e;
        const trace = [];
        const hooks = (_a = this.config.hooks) !== null && _a !== void 0 ? _a : [];
        const sensors = (_b = this.config.sensors) !== null && _b !== void 0 ? _b : [];
        const policy = (_c = this.config.policy) !== null && _c !== void 0 ? _c : DEFAULT_POLICY;
        for (const hook of hooks) {
            await hook.run(input.ctx);
            trace.push((0, harness_trace_util_1.buildHarnessTraceEvent)({
                phase: 'before_node',
                name: hook.name,
                verdict: 'pass',
                nodeId: input.ctx.nodeId,
            }));
        }
        let value;
        try {
            value = await input.execute();
        }
        catch (error) {
            trace.push((0, harness_trace_util_1.buildHarnessTraceEvent)({
                phase: 'on_error',
                name: 'executor',
                verdict: 'fail',
                nodeId: input.ctx.nodeId,
                message: error instanceof Error ? error.message : String(error),
            }));
            throw error;
        }
        let sensorFailed;
        for (const sensor of sensors) {
            const result = await sensor.run(input.ctx, (_d = input.sensorPayload) !== null && _d !== void 0 ? _d : value);
            trace.push((0, harness_trace_util_1.buildHarnessTraceEvent)({
                phase: 'after_node',
                name: sensor.name,
                verdict: result.verdict,
                nodeId: input.ctx.nodeId,
                code: result.code,
                message: (_e = result.message) !== null && _e !== void 0 ? _e : result.skipReason,
            }));
            if (result.verdict === 'fail' && policy.onSensorFail === 'fail-fast') {
                sensorFailed = result;
                break;
            }
        }
        return { value, trace, sensorFailed };
    }
    async runAfterNodeSensors(input) {
        var _a, _b, _c;
        const trace = [];
        const sensors = (_a = this.config.sensors) !== null && _a !== void 0 ? _a : [];
        const policy = (_b = this.config.policy) !== null && _b !== void 0 ? _b : DEFAULT_POLICY;
        let sensorFailed;
        for (const sensor of sensors) {
            const result = await sensor.run(input.ctx, input.payload);
            trace.push((0, harness_trace_util_1.buildHarnessTraceEvent)({
                phase: 'after_node',
                name: sensor.name,
                verdict: result.verdict,
                nodeId: input.ctx.nodeId,
                code: result.code,
                message: (_c = result.message) !== null && _c !== void 0 ? _c : result.skipReason,
            }));
            if (result.verdict === 'fail' && policy.onSensorFail === 'fail-fast') {
                sensorFailed = result;
                break;
            }
        }
        return { trace, sensorFailed };
    }
}
exports.HarnessRunner = HarnessRunner;
function createChatHarnessRunner() {
    return new HarnessRunner({ policy: { onSensorFail: 'degrade' } });
}
exports.createChatHarnessRunner = createChatHarnessRunner;
function createPageHarnessRunner(sensors = []) {
    return new HarnessRunner({
        sensors,
        policy: { onSensorFail: 'fail-fast' },
    });
}
exports.createPageHarnessRunner = createPageHarnessRunner;
//# sourceMappingURL=harness-runner.js.map