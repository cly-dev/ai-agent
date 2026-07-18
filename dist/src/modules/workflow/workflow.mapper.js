"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toWorkflowRevisionSummaryResponse = exports.toWorkflowRevisionResponse = exports.toWorkflowListItem = exports.toWorkflowResponse = void 0;
const host_tool_mapper_1 = require("../host-tool/host-tool.mapper");
const workflow_edge_util_1 = require("../../core/workflow/graph/workflow-edge.util");
function mapToolBindings(row) {
    return row.workflowTools.map((binding) => ({
        id: binding.id,
        toolId: binding.toolId,
        isRequired: binding.isRequired,
        tool: binding.tool,
    }));
}
function mapHostToolBindings(row) {
    return row.workflowHostTools.map((binding) => ({
        id: binding.id,
        hostToolId: binding.hostToolId,
        isRequired: binding.isRequired,
        hostTool: (0, host_tool_mapper_1.toHostToolResponse)(binding.hostTool),
    }));
}
function mapWorkflowCore(row) {
    return {
        id: row.id,
        appClientId: row.appClientId,
        appClientName: row.appClient.name,
        workflowKey: row.workflowKey,
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
        configWritable: false,
        deprecated: true,
    };
}
function toWorkflowResponse(row) {
    return Object.assign(Object.assign({}, mapWorkflowCore(row)), { goal: row.goal, nodes: row.nodes, constraints: row.constraints, workflowTools: mapToolBindings(row), workflowHostTools: mapHostToolBindings(row), revisionCount: row._count.revisions });
}
exports.toWorkflowResponse = toWorkflowResponse;
function toWorkflowListItem(row) {
    const nodeCount = (0, workflow_edge_util_1.parseWorkflowGraphJson)(row.nodes).nodes.length;
    return Object.assign(Object.assign({}, mapWorkflowCore(row)), { nodeCount });
}
exports.toWorkflowListItem = toWorkflowListItem;
function toWorkflowRevisionResponse(row, currentVersion) {
    return {
        id: row.id,
        workflowId: row.workflowId,
        version: row.version,
        deliverable: row.deliverable,
        nodes: row.nodes,
        constraints: row.constraints,
        changeNote: row.changeNote,
        createdAt: row.createdAt,
        isCurrent: row.version === currentVersion,
    };
}
exports.toWorkflowRevisionResponse = toWorkflowRevisionResponse;
function toWorkflowRevisionSummaryResponse(row, currentVersion) {
    return {
        id: row.id,
        workflowId: row.workflowId,
        version: row.version,
        deliverable: row.deliverable,
        changeNote: row.changeNote,
        createdAt: row.createdAt,
        isCurrent: row.version === currentVersion,
    };
}
exports.toWorkflowRevisionSummaryResponse = toWorkflowRevisionSummaryResponse;
//# sourceMappingURL=workflow.mapper.js.map