"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFlowRevisionSummaryResponse = exports.toFlowRevisionResponse = exports.toFlowListItem = exports.toFlowResponse = void 0;
const host_tool_mapper_1 = require("../host-tool/host-tool.mapper");
function mapCore(row) {
    return {
        id: row.id,
        appClientId: row.appClientId,
        appClientName: row.appClient.name,
        flowKey: row.flowKey,
        name: row.name,
        description: row.description,
        profile: row.profile,
        deliverable: row.deliverable,
        version: row.version,
        isActive: row.isActive,
        sortOrder: row.sortOrder,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        skillRefCount: row._count.skills,
        pageActionRefCount: row._count.pageActions,
    };
}
function toFlowResponse(row) {
    return Object.assign(Object.assign({}, mapCore(row)), { goal: row.goal, intent: row.intent, ir: row.ir, constraints: row.constraints, flowTools: row.flowTools.map((b) => ({
            id: b.id,
            toolId: b.toolId,
            isRequired: b.isRequired,
            tool: b.tool,
        })), flowHostTools: row.flowHostTools.map((b) => ({
            id: b.id,
            hostToolId: b.hostToolId,
            isRequired: b.isRequired,
            hostTool: (0, host_tool_mapper_1.toHostToolResponse)(b.hostTool),
        })), revisionCount: row._count.revisions });
}
exports.toFlowResponse = toFlowResponse;
function toFlowListItem(row) {
    const ir = row.ir;
    const irNodeCount = Array.isArray(ir === null || ir === void 0 ? void 0 : ir.nodes) ? ir.nodes.length : 0;
    return Object.assign(Object.assign({}, mapCore(row)), { irNodeCount });
}
exports.toFlowListItem = toFlowListItem;
function toFlowRevisionResponse(row, currentVersion) {
    return {
        id: row.id,
        flowId: row.flowId,
        version: row.version,
        deliverable: row.deliverable,
        intent: row.intent,
        ir: row.ir,
        constraints: row.constraints,
        changeNote: row.changeNote,
        createdAt: row.createdAt,
        isCurrent: row.version === currentVersion,
    };
}
exports.toFlowRevisionResponse = toFlowRevisionResponse;
function toFlowRevisionSummaryResponse(row, currentVersion) {
    return {
        id: row.id,
        flowId: row.flowId,
        version: row.version,
        deliverable: row.deliverable,
        changeNote: row.changeNote,
        createdAt: row.createdAt,
        isCurrent: row.version === currentVersion,
    };
}
exports.toFlowRevisionSummaryResponse = toFlowRevisionSummaryResponse;
//# sourceMappingURL=flow.mapper.js.map