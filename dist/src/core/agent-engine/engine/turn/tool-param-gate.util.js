"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildParamGateClarificationRequest = exports.assessHttpToolCallsParamGate = exports.listMissingUserFacingParamsForToolCall = void 0;
const plan_tool_candidates_util_1 = require("../main/plan/plan-tool-candidates.util");
const tool_decision_input_util_1 = require("../../../tool-engine/tool-decision-input.util");
function isPresentArg(value) {
    if (value == null) {
        return false;
    }
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    if (Array.isArray(value)) {
        return value.length > 0;
    }
    if (typeof value === 'object') {
        return Object.keys(value).length > 0;
    }
    return true;
}
function readArgLeaf(args, field) {
    if (Object.prototype.hasOwnProperty.call(args, field)) {
        return args[field];
    }
    const segments = field.split('.');
    let current = args;
    for (const segment of segments) {
        if (!current || typeof current !== 'object' || Array.isArray(current)) {
            return undefined;
        }
        current = current[segment];
    }
    return current;
}
function paramHintForTool(tool, fieldName) {
    var _a, _b, _c, _d;
    const compact = (0, tool_decision_input_util_1.buildCompactToolInput)(tool.inputSchema, tool.schema, tool.agentMetadata);
    const fromParams = compact.parameters.find((row) => row.name === fieldName);
    if ((_a = fromParams === null || fromParams === void 0 ? void 0 : fromParams.description) === null || _a === void 0 ? void 0 : _a.trim()) {
        return fromParams.description.trim();
    }
    const fromBody = (_c = (_b = compact.requestBody) === null || _b === void 0 ? void 0 : _b.properties) === null || _c === void 0 ? void 0 : _c.find((row) => row.name === fieldName);
    if ((_d = fromBody === null || fromBody === void 0 ? void 0 : fromBody.description) === null || _d === void 0 ? void 0 : _d.trim()) {
        return fromBody.description.trim();
    }
    return `请提供 ${fieldName}`;
}
function listMissingUserFacingParamsForToolCall(input) {
    const args = input.call.arguments && typeof input.call.arguments === 'object'
        ? input.call.arguments
        : {};
    const required = (0, plan_tool_candidates_util_1.listUserFacingRequiredParamsForTool)(input.tool);
    const missing = [];
    for (const field of required) {
        if (!isPresentArg(readArgLeaf(args, field))) {
            missing.push({
                name: field,
                hint: paramHintForTool(input.tool, field),
            });
        }
    }
    return missing;
}
exports.listMissingUserFacingParamsForToolCall = listMissingUserFacingParamsForToolCall;
function assessHttpToolCallsParamGate(input) {
    const candidateNames = input.candidateTools && input.candidateTools.length > 0
        ? new Set(input.candidateTools.map((tool) => tool.name))
        : null;
    const toolPool = candidateNames != null
        ? input.scopedTools.filter((tool) => candidateNames.has(tool.name))
        : input.scopedTools;
    for (const call of input.calls) {
        if (candidateNames != null && !candidateNames.has(call.name)) {
            return {
                status: 'clarify',
                missingFields: [
                    {
                        name: 'tool',
                        hint: '当前计划步骤不允许使用该 API，请从候选工具中选择',
                    },
                ],
                toolName: call.name,
            };
        }
        const tool = toolPool.find((row) => row.name === call.name);
        if (!tool) {
            continue;
        }
        const missingFields = listMissingUserFacingParamsForToolCall({ call, tool });
        if (missingFields.length > 0) {
            return {
                status: 'clarify',
                missingFields,
                toolName: call.name,
            };
        }
    }
    return { status: 'ready' };
}
exports.assessHttpToolCallsParamGate = assessHttpToolCallsParamGate;
function buildParamGateClarificationRequest(input) {
    return {
        kind: 'clarification',
        userMessage: input.userMessage,
        payload: {
            missingFields: input.missingFields,
            planStepId: input.planStep.id,
            toolRole: input.planStep.toolRole,
            readinessReason: `param_gate:${input.toolName}`,
        },
    };
}
exports.buildParamGateClarificationRequest = buildParamGateClarificationRequest;
//# sourceMappingURL=tool-param-gate.util.js.map