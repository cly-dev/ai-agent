"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSkillExecutionChannels = void 0;
const derive_skill_execution_channels_util_1 = require("./derive-skill-execution-channels.util");
const load_workflow_definition_util_1 = require("./load-workflow-definition.util");
async function loadSkillExecutionChannels(prisma, input) {
    var _a, _b;
    const base = {
        skillToolIds: input.skillToolIds,
        hostToolIds: input.hostToolIds,
    };
    const workflowId = (_a = input.workflowId) !== null && _a !== void 0 ? _a : null;
    if (workflowId == null || workflowId <= 0) {
        return (0, derive_skill_execution_channels_util_1.deriveSkillExecutionChannels)(Object.assign(Object.assign({}, base), { nodes: [] }));
    }
    const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { nodes: true, deliverable: true, version: true },
    });
    if (!workflow) {
        return (0, derive_skill_execution_channels_util_1.deriveSkillExecutionChannels)(Object.assign(Object.assign({}, base), { nodes: [] }));
    }
    let nodesJson = workflow.nodes;
    let deliverable = workflow.deliverable;
    const pinVersion = (_b = input.workflowVersion) !== null && _b !== void 0 ? _b : null;
    if (pinVersion != null && pinVersion !== workflow.version) {
        const revision = await prisma.workflowRevision.findUnique({
            where: {
                workflowId_version: { workflowId, version: pinVersion },
            },
            select: { nodes: true, deliverable: true },
        });
        if (revision) {
            nodesJson = revision.nodes;
            deliverable = revision.deliverable;
        }
        else {
            console.warn(`[loadSkillExecutionChannels] workflow revision missing workflowId=${workflowId} version=${pinVersion}; using current workflow head`);
        }
    }
    return (0, derive_skill_execution_channels_util_1.deriveSkillExecutionChannels)(Object.assign(Object.assign({}, base), { nodes: (0, load_workflow_definition_util_1.parseWorkflowNodesJson)(nodesJson), deliverable }));
}
exports.loadSkillExecutionChannels = loadSkillExecutionChannels;
//# sourceMappingURL=load-skill-execution-channels.util.js.map