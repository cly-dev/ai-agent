"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeToolsForLlmSchema = void 0;
const tool_agent_metadata_util_1 = require("../../../tool-engine/tool-agent-metadata.util");
const tool_decision_input_util_1 = require("../../../tool-engine/tool-decision-input.util");
const tool_user_facing_params_util_1 = require("../../../tool-engine/tool-user-facing-params.util");
const tool_output_projection_util_1 = require("../../../tool-engine/tool-output-projection.util");
function extractFilterNames(input) {
    return (0, tool_user_facing_params_util_1.listOptionalFilterParamNames)(input).slice(0, 16);
}
function extractReturnFields(responseProfile, provides) {
    if (provides.length > 0) {
        return provides.slice(0, 10);
    }
    const profile = (0, tool_output_projection_util_1.parseResponseProfile)(responseProfile);
    if (!profile) {
        return [];
    }
    const paths = profile.coreFields.map((field) => {
        var _a, _b;
        const tail = (_a = field.path.split('.').filter(Boolean).pop()) !== null && _a !== void 0 ? _a : field.path;
        const aliases = {
            availableTotal: 'availableStock',
            imageUrl: 'image',
        };
        return (_b = aliases[tail]) !== null && _b !== void 0 ? _b : tail;
    });
    return [...new Set(paths)].slice(0, 10);
}
function summarizeToolsForLlmSchema(tools) {
    return tools.map((tool) => {
        var _a;
        const meta = (0, tool_agent_metadata_util_1.parseAgentMetadata)(tool.agentMetadata);
        const role = (0, tool_agent_metadata_util_1.resolveToolDecisionRole)({
            agentMetadata: tool.agentMetadata,
            responseProfile: tool.responseProfile,
            method: tool.method,
            name: tool.name,
            description: tool.description,
        });
        const input = (0, tool_decision_input_util_1.buildCompactToolInput)(tool.inputSchema, tool.schema, tool.agentMetadata);
        const provides = (0, tool_agent_metadata_util_1.extractProvidesFromResponseProfile)(tool.responseProfile);
        const requiredParams = (0, tool_user_facing_params_util_1.listUserFacingRequiredParamNames)(input);
        const filters = (meta === null || meta === void 0 ? void 0 : meta.isMutation) ? undefined : extractFilterNames(input);
        const returns = extractReturnFields(tool.responseProfile, provides);
        const description = (_a = tool.description) === null || _a === void 0 ? void 0 : _a.trim();
        const paramHints = (0, tool_decision_input_util_1.resolveParamFormatHints)(tool.inputSchema, tool.schema, meta === null || meta === void 0 ? void 0 : meta.paramFormatHints);
        const row = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ name: tool.name }, (description ? { description } : {})), { role }), ((meta === null || meta === void 0 ? void 0 : meta.resource) ? { resource: meta.resource } : {})), ((meta === null || meta === void 0 ? void 0 : meta.operation) ? { operation: meta.operation } : {})), (filters && filters.length > 0 ? { filters } : {})), (returns.length > 0 ? { returns } : {})), ((meta === null || meta === void 0 ? void 0 : meta.businessFields) && meta.businessFields.length > 0
            ? { businessFields: meta.businessFields }
            : {})), ((meta === null || meta === void 0 ? void 0 : meta.isMutation) != null ? { isMutation: meta.isMutation } : {})), (requiredParams.length > 0 ? { requiredParams } : {})), (paramHints.length > 0 ? { paramHints } : {}));
        return row;
    });
}
exports.summarizeToolsForLlmSchema = summarizeToolsForLlmSchema;
//# sourceMappingURL=tool-schema-compact.util.js.map