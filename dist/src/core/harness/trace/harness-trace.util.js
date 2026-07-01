"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.harnessTraceToAgentStepOutput = exports.buildHarnessTraceEvent = void 0;
function buildHarnessTraceEvent(input) {
    return {
        phase: input.phase,
        name: input.name,
        verdict: input.verdict,
        nodeId: input.nodeId,
        timestamp: new Date().toISOString(),
        code: input.code,
        message: input.message,
    };
}
exports.buildHarnessTraceEvent = buildHarnessTraceEvent;
function harnessTraceToAgentStepOutput(events) {
    return {
        harnessTrace: events,
    };
}
exports.harnessTraceToAgentStepOutput = harnessTraceToAgentStepOutput;
//# sourceMappingURL=harness-trace.util.js.map