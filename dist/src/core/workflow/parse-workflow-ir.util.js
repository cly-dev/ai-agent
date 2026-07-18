"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWorkflowIrDocument = void 0;
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function parseWorkflowIrDocument(value) {
    if (!isRecord(value))
        return null;
    if (value.version !== 1)
        return null;
    if (typeof value.entryNodeId !== 'string')
        return null;
    if (!Array.isArray(value.nodes) || !Array.isArray(value.edges))
        return null;
    return value;
}
exports.parseWorkflowIrDocument = parseWorkflowIrDocument;
//# sourceMappingURL=parse-workflow-ir.util.js.map