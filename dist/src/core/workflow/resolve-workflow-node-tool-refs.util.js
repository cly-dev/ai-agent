"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGenerateAndPushHostToolIds = exports.resolveFetchDataToolIds = void 0;
function isPositiveInt(value) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function readPositiveIntList(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    const ids = [];
    const seen = new Set();
    for (const row of value) {
        if (!isPositiveInt(row) || seen.has(row)) {
            continue;
        }
        seen.add(row);
        ids.push(row);
    }
    return ids;
}
function resolveFetchDataToolIds(input) {
    if (!isRecord(input)) {
        return [];
    }
    const fromList = readPositiveIntList(input.toolIds);
    if (fromList.length > 0) {
        return fromList;
    }
    return isPositiveInt(input.toolId) ? [input.toolId] : [];
}
exports.resolveFetchDataToolIds = resolveFetchDataToolIds;
function resolveGenerateAndPushHostToolIds(input) {
    if (!isRecord(input)) {
        return [];
    }
    const fromList = readPositiveIntList(input.hostToolIds);
    if (fromList.length > 0) {
        return fromList;
    }
    return isPositiveInt(input.hostToolId) ? [input.hostToolId] : [];
}
exports.resolveGenerateAndPushHostToolIds = resolveGenerateAndPushHostToolIds;
//# sourceMappingURL=resolve-workflow-node-tool-refs.util.js.map