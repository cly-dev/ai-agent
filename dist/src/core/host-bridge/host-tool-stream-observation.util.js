"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHostToolStreamAlreadyDispatched = exports.findHostToolStreamObservation = exports.buildHostToolStreamObservation = exports.HOST_TOOL_STREAM_OBSERVATION_NAME = void 0;
exports.HOST_TOOL_STREAM_OBSERVATION_NAME = 'host_tool_stream';
function buildHostToolStreamObservation(input) {
    return {
        name: exports.HOST_TOOL_STREAM_OBSERVATION_NAME,
        output: {
            outcome: input.outcome,
            hostStepId: input.hostStepId,
            streamId: input.streamId,
            hostTools: input.hostTools,
            streamablePath: input.streamablePath,
        },
        quality: 'high',
    };
}
exports.buildHostToolStreamObservation = buildHostToolStreamObservation;
function findHostToolStreamObservation(observations, hostStepId) {
    for (let i = observations.length - 1; i >= 0; i -= 1) {
        const row = observations[i];
        if ((row === null || row === void 0 ? void 0 : row.name) !== exports.HOST_TOOL_STREAM_OBSERVATION_NAME) {
            continue;
        }
        const output = row.output;
        if ((output === null || output === void 0 ? void 0 : output.hostStepId) !== hostStepId) {
            continue;
        }
        if (output.outcome !== 'dispatched' &&
            output.outcome !== 'failed') {
            continue;
        }
        if (!Array.isArray(output.hostTools)) {
            continue;
        }
        return output;
    }
    return null;
}
exports.findHostToolStreamObservation = findHostToolStreamObservation;
function isHostToolStreamAlreadyDispatched(observations, hostStepId) {
    const found = findHostToolStreamObservation(observations, hostStepId);
    return (found === null || found === void 0 ? void 0 : found.outcome) === 'dispatched';
}
exports.isHostToolStreamAlreadyDispatched = isHostToolStreamAlreadyDispatched;
//# sourceMappingURL=host-tool-stream-observation.util.js.map