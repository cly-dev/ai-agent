"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePlanReasonHostStreamDelivery = exports.buildPlanReasonHostStreamTarget = exports.buildHostToolStreamId = exports.resolvePlanReasonHostFillTools = exports.resolveStreamablePathFromHostTool = exports.primaryHostToolStreamTool = exports.HOST_TOOL_STREAM_REASON = void 0;
const host_tool_delivery_contract_util_1 = require("./host-tool-delivery-contract.util");
const host_tool_stream_env_util_1 = require("./host-tool-stream-env.util");
exports.HOST_TOOL_STREAM_REASON = 'plan_host_tool_stream';
function primaryHostToolStreamTool(target) {
    return target.tools[0];
}
exports.primaryHostToolStreamTool = primaryHostToolStreamTool;
function resolveStreamablePathFromHostTool(tool) {
    return (0, host_tool_delivery_contract_util_1.resolveHostToolDeliveryContract)(tool).streamablePath;
}
exports.resolveStreamablePathFromHostTool = resolveStreamablePathFromHostTool;
function resolvePlanReasonHostFillTools(input) {
    const tools = [];
    for (const tool of input.hostTools) {
        if (!input.allowedToolNames.has(tool.name)) {
            continue;
        }
        const path = resolveStreamablePathFromHostTool(tool);
        if (!path) {
            continue;
        }
        tools.push({ name: tool.name, streamablePath: path });
    }
    return tools;
}
exports.resolvePlanReasonHostFillTools = resolvePlanReasonHostFillTools;
function buildHostToolStreamId(input) {
    return `hs-${input.runId}-${input.turnId}-${input.stepId}`;
}
exports.buildHostToolStreamId = buildHostToolStreamId;
function buildPlanReasonHostStreamTarget(input) {
    const hostStepId = input.hostStepId.trim();
    return {
        hostStepId,
        reasonStepId: input.reasonStepId,
        streamId: buildHostToolStreamId({
            runId: input.runId,
            turnId: input.turnId,
            stepId: hostStepId,
        }),
        tools: input.tools,
        reason: exports.HOST_TOOL_STREAM_REASON,
    };
}
exports.buildPlanReasonHostStreamTarget = buildPlanReasonHostStreamTarget;
function resolvePlanReasonHostStreamDelivery(input) {
    var _a, _b;
    const hostStepId = (_b = (_a = input.hostStepId) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    if (!hostStepId ||
        input.fillTools.length === 0 ||
        !input.canPublishRun ||
        !(0, host_tool_stream_env_util_1.isHostToolStreamEnabled)()) {
        return { mode: 'observation' };
    }
    return {
        mode: 'stream',
        target: buildPlanReasonHostStreamTarget({
            hostStepId,
            reasonStepId: input.reasonStepId,
            runId: input.runId,
            turnId: input.turnId,
            tools: input.fillTools,
        }),
    };
}
exports.resolvePlanReasonHostStreamDelivery = resolvePlanReasonHostStreamDelivery;
//# sourceMappingURL=host-tool-stream-target.util.js.map