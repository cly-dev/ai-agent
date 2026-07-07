"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partitionToolCallsByWriteConfirmation = exports.buildWriteConfirmationUserMessage = exports.filterSchemaValidWriteConfirmationCalls = exports.collectWriteConfirmationRequired = void 0;
const risk_level_util_1 = require("../../risk/risk-level.util");
const write_tool_draft_injection_util_1 = require("../../tool-engine/write-tool-draft-injection.util");
function collectWriteConfirmationRequired(pendingToolCalls, scopedTools) {
    const byName = new Map(scopedTools.map((tool) => [tool.name, tool]));
    const out = [];
    for (const call of pendingToolCalls) {
        const def = byName.get(call.name);
        if (!def) {
            continue;
        }
        if (!(0, risk_level_util_1.toolRequiresWriteConfirmation)({
            riskLevel: def.riskLevel,
            agentMetadata: def.agentMetadata,
        })) {
            continue;
        }
        out.push({
            name: call.name,
            arguments: call.arguments,
            riskLevel: def.riskLevel,
            reason: (0, risk_level_util_1.resolveToolWriteConfirmationReason)({
                riskLevel: def.riskLevel,
                agentMetadata: def.agentMetadata,
            }),
        });
    }
    return out;
}
exports.collectWriteConfirmationRequired = collectWriteConfirmationRequired;
function filterSchemaValidWriteConfirmationCalls(calls, scopedTools) {
    const byName = new Map(scopedTools.map((tool) => [tool.name, tool]));
    return calls.filter((call) => {
        const def = byName.get(call.name);
        if (!def) {
            return false;
        }
        return (0, write_tool_draft_injection_util_1.satisfiesRequiredWriteToolArgs)(call.arguments, def);
    });
}
exports.filterSchemaValidWriteConfirmationCalls = filterSchemaValidWriteConfirmationCalls;
function buildWriteConfirmationUserMessage() {
    return '请确认上方展示的操作内容；确认后将执行数据变更。';
}
exports.buildWriteConfirmationUserMessage = buildWriteConfirmationUserMessage;
function partitionToolCallsByWriteConfirmation(pendingToolCalls, scopedTools, approvedWriteToolNames) {
    const approved = new Set(approvedWriteToolNames !== null && approvedWriteToolNames !== void 0 ? approvedWriteToolNames : []);
    const writeCallsNeedingConfirm = collectWriteConfirmationRequired(pendingToolCalls, scopedTools).filter((call) => !approved.has(call.name));
    const pendingConfirmNames = new Set(writeCallsNeedingConfirm.map((call) => call.name));
    const safeCalls = pendingToolCalls.filter((call) => !pendingConfirmNames.has(call.name));
    return { safeCalls, writeCallsNeedingConfirm };
}
exports.partitionToolCallsByWriteConfirmation = partitionToolCallsByWriteConfirmation;
//# sourceMappingURL=write-confirmation-gate.util.js.map