"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveToolWriteConfirmationReason = exports.skillRequiresWriteConfirmation = exports.toolRequiresWriteConfirmation = exports.isWriteRiskLevel = exports.maxToolLevel = void 0;
const client_1 = require("../../../generated/prisma/client");
const tool_agent_metadata_util_1 = require("../tool-engine/tool-agent-metadata.util");
const LEVEL_WEIGHT = {
    [client_1.ToolLevel.L1]: 1,
    [client_1.ToolLevel.L2]: 2,
    [client_1.ToolLevel.L3]: 3,
};
function maxToolLevel(levels) {
    if (levels.length === 0) {
        return client_1.ToolLevel.L1;
    }
    return levels.reduce((max, level) => LEVEL_WEIGHT[level] > LEVEL_WEIGHT[max] ? level : max);
}
exports.maxToolLevel = maxToolLevel;
function isWriteRiskLevel(level) {
    return level === client_1.ToolLevel.L2 || level === client_1.ToolLevel.L3;
}
exports.isWriteRiskLevel = isWriteRiskLevel;
function toolRequiresWriteConfirmation(input) {
    if (isWriteRiskLevel(input.riskLevel)) {
        return true;
    }
    const meta = (0, tool_agent_metadata_util_1.parseAgentMetadata)(input.agentMetadata);
    return (meta === null || meta === void 0 ? void 0 : meta.isMutation) === true;
}
exports.toolRequiresWriteConfirmation = toolRequiresWriteConfirmation;
function skillRequiresWriteConfirmation(riskLevel) {
    return isWriteRiskLevel(riskLevel);
}
exports.skillRequiresWriteConfirmation = skillRequiresWriteConfirmation;
function resolveToolWriteConfirmationReason(input) {
    const meta = (0, tool_agent_metadata_util_1.parseAgentMetadata)(input.agentMetadata);
    if (input.riskLevel === client_1.ToolLevel.L3) {
        return 'high_risk_tool';
    }
    if (input.riskLevel === client_1.ToolLevel.L2) {
        return 'write_risk_tool';
    }
    if (meta === null || meta === void 0 ? void 0 : meta.isMutation) {
        return 'mutation_tool';
    }
    return 'write_operation';
}
exports.resolveToolWriteConfirmationReason = resolveToolWriteConfirmationReason;
//# sourceMappingURL=risk-level.util.js.map