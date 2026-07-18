"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSkillExecutionChannels = void 0;
const derive_skill_execution_channels_util_1 = require("./derive-skill-execution-channels.util");
const derive_skill_execution_channels_from_ir_util_1 = require("./derive-skill-execution-channels-from-ir.util");
const parse_workflow_ir_util_1 = require("./parse-workflow-ir.util");
async function loadSkillExecutionChannels(prisma, input) {
    var _a, _b;
    const base = {
        skillToolIds: input.skillToolIds,
        hostToolIds: input.hostToolIds,
    };
    const flowId = (_a = input.flowId) !== null && _a !== void 0 ? _a : null;
    if (flowId == null || flowId <= 0) {
        return (0, derive_skill_execution_channels_util_1.deriveSkillExecutionChannels)(Object.assign(Object.assign({}, base), { nodes: [] }));
    }
    return loadChannelsFromFlow(prisma, Object.assign(Object.assign({}, base), { flowId, flowVersion: (_b = input.flowVersion) !== null && _b !== void 0 ? _b : null }));
}
exports.loadSkillExecutionChannels = loadSkillExecutionChannels;
async function loadChannelsFromFlow(prisma, input) {
    const base = {
        skillToolIds: input.skillToolIds,
        hostToolIds: input.hostToolIds,
    };
    const flow = await prisma.flow.findFirst({
        where: { id: input.flowId, isActive: true },
        select: { ir: true, deliverable: true, version: true },
    });
    if (!flow) {
        return (0, derive_skill_execution_channels_util_1.deriveSkillExecutionChannels)(Object.assign(Object.assign({}, base), { nodes: [] }));
    }
    let irJson = flow.ir;
    let deliverable = flow.deliverable;
    const pinVersion = input.flowVersion;
    if (pinVersion != null && pinVersion !== flow.version) {
        const revision = await prisma.flowRevision.findUnique({
            where: {
                flowId_version: { flowId: input.flowId, version: pinVersion },
            },
            select: { ir: true, deliverable: true },
        });
        if (!revision) {
            console.warn(`[loadSkillExecutionChannels] flow revision missing flowId=${input.flowId} version=${pinVersion}; empty channels`);
            return (0, derive_skill_execution_channels_util_1.deriveSkillExecutionChannels)(Object.assign(Object.assign({}, base), { nodes: [] }));
        }
        irJson = revision.ir;
        deliverable = revision.deliverable;
    }
    const ir = (0, parse_workflow_ir_util_1.parseWorkflowIrDocument)(irJson);
    if (!ir || ir.nodes.length === 0) {
        return (0, derive_skill_execution_channels_util_1.deriveSkillExecutionChannels)(Object.assign(Object.assign({}, base), { nodes: [] }));
    }
    const fromIr = (0, derive_skill_execution_channels_from_ir_util_1.deriveSkillExecutionChannelsFromIr)({
        ir,
        deliverable,
    });
    return fromIr;
}
//# sourceMappingURL=load-skill-execution-channels.util.js.map