"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveHostToolPushSuccessContent = exports.findDispatchedHostToolObservation = exports.planHasHostWriteChannel = exports.HOST_WRITE_CHANNEL_CONSTRAINT = void 0;
const message_blocks_util_1 = require("../../message/message-blocks.util");
const host_tool_fill_alignment_util_1 = require("./host-tool-fill-alignment.util");
const host_tool_plan_util_1 = require("./host-tool-plan.util");
exports.HOST_WRITE_CHANNEL_CONSTRAINT = 'host_write_channel';
function planHasHostWriteChannel(plan) {
    var _a;
    return ((_a = plan === null || plan === void 0 ? void 0 : plan.constraints) !== null && _a !== void 0 ? _a : []).includes(exports.HOST_WRITE_CHANNEL_CONSTRAINT);
}
exports.planHasHostWriteChannel = planHasHostWriteChannel;
function findDispatchedHostToolObservation(observations) {
    for (let i = observations.length - 1; i >= 0; i -= 1) {
        const row = observations[i];
        if ((row === null || row === void 0 ? void 0 : row.name) !== host_tool_plan_util_1.HOST_TOOL_INVOKE_OBSERVATION_NAME) {
            continue;
        }
        const output = row.output;
        if (output != null &&
            typeof output === 'object' &&
            !Array.isArray(output) &&
            output.outcome === 'dispatched') {
            return row;
        }
    }
    return null;
}
exports.findDispatchedHostToolObservation = findDispatchedHostToolObservation;
function resolveHostToolPushSuccessContent(input) {
    if (!planHasHostWriteChannel(input.taskPlan)) {
        return null;
    }
    const dispatched = findDispatchedHostToolObservation(input.observations);
    if (!dispatched) {
        return null;
    }
    const output = dispatched.output != null &&
        typeof dispatched.output === 'object' &&
        !Array.isArray(dispatched.output)
        ? dispatched.output
        : {};
    const planStepId = typeof output.planStepId === 'string' ? output.planStepId : null;
    const toolName = typeof output.tool === 'string' && output.tool.trim().length > 0
        ? output.tool.trim()
        : '页面自动化';
    const fillText = (0, host_tool_fill_alignment_util_1.extractHostToolDispatchedFillText)({
        observations: input.observations,
        planStepId,
    });
    const plainText = (fillText === null || fillText === void 0 ? void 0 : fillText.trim()) ||
        `已通过 ${toolName} 推送到页面，请在当前页面查看效果。`;
    return {
        plainText,
        blocks: [(0, message_blocks_util_1.textBlock)(plainText, 'markdown')],
        summaryStepName: host_tool_plan_util_1.HOST_TOOL_INVOKE_OBSERVATION_NAME,
    };
}
exports.resolveHostToolPushSuccessContent = resolveHostToolPushSuccessContent;
//# sourceMappingURL=host-tool-push-success.util.js.map