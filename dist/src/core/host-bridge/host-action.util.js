"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHostActionSyncPayload = exports.buildHostActionPayload = exports.hasSuccessfulMutationStep = void 0;
const tool_mutation_util_1 = require("../tool-engine/tool-mutation.util");
const host_tool_stream_types_1 = require("./host-tool-stream.types");
const host_action_resolve_util_1 = require("./host-action.resolve.util");
const page_context_anchor_util_1 = require("./page-context-anchor.util");
function hasSuccessfulMutationStep(steps, scopedTools) {
    var _a;
    const toolByName = new Map(scopedTools.map((tool) => [tool.name, tool]));
    for (const step of steps) {
        if (step.type !== 'tool' || !step.name) {
            continue;
        }
        const def = toolByName.get(step.name);
        if (!def || !(0, tool_mutation_util_1.isMutationTool)(def.agentMetadata)) {
            continue;
        }
        if (((_a = step.meta) === null || _a === void 0 ? void 0 : _a.executionStatus) === 'SUCCESS') {
            return true;
        }
    }
    return false;
}
exports.hasSuccessfulMutationStep = hasSuccessfulMutationStep;
function buildHostActionPayload(input) {
    var _a, _b, _c;
    const skillHostBridge = (0, host_action_resolve_util_1.parseSkillHostBridgeConfig)(input.skillConfig);
    const pageContext = (_a = input.pageContext) !== null && _a !== void 0 ? _a : {};
    const entity = pageContext.entity
        ? Object.assign({}, pageContext.entity)
        : undefined;
    const metadata = (0, host_action_resolve_util_1.resolveHostActionMetadata)(pageContext);
    const scope = (0, page_context_anchor_util_1.resolveHostToolPageScope)(pageContext);
    return Object.assign(Object.assign(Object.assign(Object.assign({ action: 'host_action', v: host_tool_stream_types_1.HOST_TOOL_STREAM_PROTOCOL_VERSION, stream: { mode: 'full', seq: 1 }, scope: scope !== null && scope !== void 0 ? scope : undefined, entity }, (metadata ? { metadata } : {})), { hostTools: input.hostTools }), (input.planStepId
        ? {
            hostStepId: input.planStepId,
            planStepId: input.planStepId,
        }
        : {})), { reason: (_c = (_b = input.reason) !== null && _b !== void 0 ? _b : skillHostBridge === null || skillHostBridge === void 0 ? void 0 : skillHostBridge.reason) !== null && _c !== void 0 ? _c : 'host_tool_dispatch', runId: input.runId, turnId: input.turnId });
}
exports.buildHostActionPayload = buildHostActionPayload;
function buildHostActionSyncPayload(input) {
    var _a;
    return buildHostActionPayload(Object.assign(Object.assign({}, input), { reason: (_a = input.reason) !== null && _a !== void 0 ? _a : 'agent_mutation_success' }));
}
exports.buildHostActionSyncPayload = buildHostActionSyncPayload;
//# sourceMappingURL=host-action.util.js.map