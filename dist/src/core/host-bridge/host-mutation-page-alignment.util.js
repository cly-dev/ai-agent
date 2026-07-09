"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPageContextAlignedWithSuccessfulMutations = exports.collectSuccessfulMutationIdentifierValues = void 0;
const tool_agent_metadata_util_1 = require("../tool-engine/tool-agent-metadata.util");
const tool_mutation_util_1 = require("../tool-engine/tool-mutation.util");
function normalizeIdentifierToken(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Number.isInteger(value) ? String(value) : String(value);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || null;
    }
    return null;
}
function collectLeafIdentifierValues(value, leaf, out, depth = 0) {
    if (depth > 8 || value == null) {
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            collectLeafIdentifierValues(item, leaf, out, depth + 1);
        }
        return;
    }
    if (typeof value !== 'object') {
        return;
    }
    const record = value;
    if (Object.prototype.hasOwnProperty.call(record, leaf)) {
        const token = normalizeIdentifierToken(record[leaf]);
        if (token) {
            out.add(token);
        }
    }
    for (const nested of Object.values(record)) {
        collectLeafIdentifierValues(nested, leaf, out, depth + 1);
    }
}
function collectSuccessfulMutationIdentifierValues(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const toolByName = new Map(input.scopedTools.map((tool) => [tool.name, tool]));
    const values = new Set();
    for (const step of input.steps) {
        if (step.type !== 'tool' || !step.name) {
            continue;
        }
        if (((_a = step.meta) === null || _a === void 0 ? void 0 : _a.executionStatus) !== 'SUCCESS') {
            continue;
        }
        const def = toolByName.get(step.name);
        if (!def || !(0, tool_mutation_util_1.isMutationTool)(def.agentMetadata)) {
            continue;
        }
        const businessFields = (_c = (_b = (0, tool_agent_metadata_util_1.parseAgentMetadata)(def.agentMetadata)) === null || _b === void 0 ? void 0 : _b.businessFields) !== null && _c !== void 0 ? _c : [];
        const args = Object.assign(Object.assign({}, ((_e = (_d = step.meta) === null || _d === void 0 ? void 0 : _d.llmArguments) !== null && _e !== void 0 ? _e : {})), ((_f = step.input) !== null && _f !== void 0 ? _f : {}));
        for (const field of businessFields) {
            const leaf = field.includes('.')
                ? ((_g = field.split('.').pop()) !== null && _g !== void 0 ? _g : field)
                : field;
            if (!leaf.trim()) {
                continue;
            }
            collectLeafIdentifierValues(args, leaf.trim(), values);
        }
    }
    return values;
}
exports.collectSuccessfulMutationIdentifierValues = collectSuccessfulMutationIdentifierValues;
function isPageContextAlignedWithSuccessfulMutations(input) {
    var _a;
    const entityId = normalizeIdentifierToken((_a = input.pageContext.entity) === null || _a === void 0 ? void 0 : _a.id);
    if (!entityId) {
        return false;
    }
    const mutationIds = collectSuccessfulMutationIdentifierValues({
        steps: input.steps,
        scopedTools: input.scopedTools,
    });
    if (mutationIds.size === 0) {
        return false;
    }
    return mutationIds.has(entityId);
}
exports.isPageContextAlignedWithSuccessfulMutations = isPageContextAlignedWithSuccessfulMutations;
//# sourceMappingURL=host-mutation-page-alignment.util.js.map