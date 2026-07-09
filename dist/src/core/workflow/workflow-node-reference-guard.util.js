"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findWorkflowNodeReferences = void 0;
const derive_workflow_bindings_from_nodes_util_1 = require("./derive-workflow-bindings-from-nodes.util");
const load_workflow_definition_util_1 = require("./load-workflow-definition.util");
function workflowRefsTarget(input) {
    return input.kind === 'tool'
        ? input.refs.toolIds.includes(input.targetId)
        : input.refs.hostToolIds.includes(input.targetId);
}
async function findWorkflowNodeReferences(prisma, input) {
    const workflows = await prisma.workflow.findMany({
        where: { appClientId: input.appClientId },
        select: {
            id: true,
            workflowKey: true,
            name: true,
            version: true,
            nodes: true,
            revisions: {
                select: {
                    id: true,
                    version: true,
                    nodes: true,
                },
            },
        },
    });
    const usages = [];
    for (const workflow of workflows) {
        const refs = (0, derive_workflow_bindings_from_nodes_util_1.collectWorkflowNodeBindingRefs)((0, load_workflow_definition_util_1.parseWorkflowNodesJson)(workflow.nodes));
        if (workflowRefsTarget({
            refs,
            kind: input.kind,
            targetId: input.targetId,
        })) {
            usages.push({
                source: 'workflow',
                workflowId: workflow.id,
                workflowKey: workflow.workflowKey,
                workflowName: workflow.name,
                version: workflow.version,
            });
        }
        for (const revision of workflow.revisions) {
            const revisionRefs = (0, derive_workflow_bindings_from_nodes_util_1.collectWorkflowNodeBindingRefs)((0, load_workflow_definition_util_1.parseWorkflowNodesJson)(revision.nodes));
            if (workflowRefsTarget({
                refs: revisionRefs,
                kind: input.kind,
                targetId: input.targetId,
            })) {
                usages.push({
                    source: 'workflow_revision',
                    workflowId: workflow.id,
                    workflowKey: workflow.workflowKey,
                    workflowName: workflow.name,
                    version: revision.version,
                    revisionId: revision.id,
                });
            }
        }
    }
    return usages;
}
exports.findWorkflowNodeReferences = findWorkflowNodeReferences;
//# sourceMappingURL=workflow-node-reference-guard.util.js.map