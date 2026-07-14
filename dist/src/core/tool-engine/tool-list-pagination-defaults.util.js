"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyListPaginationDefaults = exports.shouldApplyListPaginationDefaults = void 0;
const tool_agent_metadata_util_1 = require("./tool-agent-metadata.util");
const tool_agent_metadata_types_1 = require("./tool-agent-metadata.types");
const tool_output_projection_util_1 = require("./tool-output-projection.util");
const tool_pagination_params_util_1 = require("./tool-pagination-params.util");
function isMissingParamValue(value) {
    return value === undefined || value === null || value === '';
}
function coercePositiveInt(value, fallback) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(1, Math.trunc(value));
    }
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number.parseInt(value.trim(), 10);
        if (Number.isFinite(parsed)) {
            return Math.max(1, parsed);
        }
    }
    return fallback;
}
function resolveDefaultForPaginationRole(role, spec) {
    const fallback = role === 'page' ? (0, tool_pagination_params_util_1.resolveDefaultListPage)() : (0, tool_pagination_params_util_1.resolveDefaultListSize)();
    if (spec.default !== undefined && spec.default !== null) {
        return coercePositiveInt(spec.default, fallback);
    }
    return fallback;
}
function specsHavePaginationParams(specs) {
    let hasPage = false;
    let hasSize = false;
    for (const spec of specs) {
        if (spec.in !== 'query') {
            continue;
        }
        if (spec.type !== 'integer' && spec.type !== 'number') {
            continue;
        }
        const role = (0, tool_pagination_params_util_1.classifyPaginationParam)(spec.name);
        if (role === 'page') {
            hasPage = true;
        }
        if (role === 'size') {
            hasSize = true;
        }
    }
    return hasPage && hasSize;
}
function shouldApplyListPaginationDefaults(input) {
    const meta = (0, tool_agent_metadata_util_1.parseAgentMetadata)(input.agentMetadata);
    if (meta) {
        if (meta.operation === tool_agent_metadata_types_1.OperationType.LIST ||
            meta.operation === tool_agent_metadata_types_1.OperationType.SEARCH ||
            meta.operation === tool_agent_metadata_types_1.OperationType.STATS) {
            return true;
        }
    }
    const profile = (0, tool_output_projection_util_1.parseResponseProfile)(input.responseProfile);
    if ((profile === null || profile === void 0 ? void 0 : profile.decisionRole) === 'read-list') {
        return true;
    }
    if (profile === null || profile === void 0 ? void 0 : profile.listPath) {
        return true;
    }
    return specsHavePaginationParams(input.specs);
}
exports.shouldApplyListPaginationDefaults = shouldApplyListPaginationDefaults;
function applyListPaginationDefaults(input, specs, options) {
    if (!shouldApplyListPaginationDefaults({
        agentMetadata: options === null || options === void 0 ? void 0 : options.agentMetadata,
        responseProfile: options === null || options === void 0 ? void 0 : options.responseProfile,
        specs,
    })) {
        return input;
    }
    const out = Object.assign({}, input);
    for (const spec of specs) {
        if (spec.in !== 'query') {
            continue;
        }
        if (spec.type !== 'integer' && spec.type !== 'number') {
            continue;
        }
        const role = (0, tool_pagination_params_util_1.classifyPaginationParam)(spec.name);
        if (!role) {
            continue;
        }
        if (!isMissingParamValue(out[spec.name])) {
            continue;
        }
        out[spec.name] = resolveDefaultForPaginationRole(role, spec);
    }
    return out;
}
exports.applyListPaginationDefaults = applyListPaginationDefaults;
//# sourceMappingURL=tool-list-pagination-defaults.util.js.map