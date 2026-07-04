"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolEmptySensor = void 0;
const tool_execution_status_util_1 = require("../../agent-engine/engine/tool/tool-execution-status.util");
function observationMatchesTool(observation, payload) {
    if (payload.toolName && observation.name === payload.toolName) {
        return true;
    }
    return payload.toolName == null;
}
exports.toolEmptySensor = {
    name: 'tool-empty',
    run(_ctx, payload) {
        var _a;
        const data = (payload !== null && payload !== void 0 ? payload : {});
        const observations = (_a = data.observations) !== null && _a !== void 0 ? _a : [];
        const context = {
            agentMetadata: data.agentMetadata,
        };
        const relevant = observations.filter((row) => observationMatchesTool(row, data));
        if (relevant.length === 0) {
            return {
                name: 'tool-empty',
                verdict: 'fail',
                code: 'TOOL_EMPTY',
                message: 'no tool observation produced for fetch_data step',
            };
        }
        const hasSuccess = relevant.some((row) => (0, tool_execution_status_util_1.classifyToolExecutionStatus)(row.output, context) === 'SUCCESS');
        if (hasSuccess) {
            return { name: 'tool-empty', verdict: 'pass' };
        }
        const allEmpty = relevant.every((row) => (0, tool_execution_status_util_1.classifyToolExecutionStatus)(row.output, context) === 'EMPTY');
        if (allEmpty) {
            return {
                name: 'tool-empty',
                verdict: 'fail',
                code: 'TOOL_EMPTY',
                message: 'tool observations are EMPTY',
            };
        }
        return { name: 'tool-empty', verdict: 'pass' };
    },
};
//# sourceMappingURL=tool-empty.sensor.js.map