"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mirrorChatApprovalRequest = void 0;
const plan_compose_write_util_1 = require("../agent-engine/engine/main/plan-present/plan-compose-write.util");
const resolve_approval_parties_util_1 = require("./resolve-approval-parties.util");
async function mirrorChatApprovalRequest(input) {
    var _a, _b;
    const idempotencyKey = `chat:${input.sessionId}:${input.runId}:${input.nodeId}`;
    const existing = await input.approvalRequests.findPendingByIdempotencyKey({
        appClientId: input.appClientId,
        idempotencyKey,
    });
    if (existing) {
        return existing.id;
    }
    const composed = (0, plan_compose_write_util_1.resolveLatestPlanComposeWrite)(input.observations);
    if (!composed) {
        return null;
    }
    const scopedTool = input.scopedTools.find((tool) => tool.name === composed.tool);
    const riskLevel = ((_a = scopedTool === null || scopedTool === void 0 ? void 0 : scopedTool.riskLevel) !== null && _a !== void 0 ? _a : 'L2');
    const parties = (0, resolve_approval_parties_util_1.resolveApprovalParties)({
        source: 'chat',
        initiatorUserId: input.userId,
    });
    if (!parties.ok) {
        return null;
    }
    const nodeDef = input.workflowNodeDefs.find((row) => row.id === input.nodeId);
    const title = ((_b = nodeDef === null || nodeDef === void 0 ? void 0 : nodeDef.name) === null || _b === void 0 ? void 0 : _b.trim())
        ? `${nodeDef.name} · 写操作确认`
        : `写操作确认 · ${input.nodeId}`;
    const approval = await input.approvalGate.suspend({
        appClientId: input.appClientId,
        source: 'chat',
        initiatorUserId: parties.parties.initiatorUserId,
        approverUserId: parties.parties.approverUserId,
        workflowId: input.workflowRun.workflowId,
        workflowVersion: input.workflowRun.version,
        nodeId: input.nodeId,
        title,
        summary: null,
        workflowRun: input.workflowRun,
        workflowNodeDefs: input.workflowNodeDefs,
        workflowNodeOutputs: Object.assign({}, input.workflowNodeOutputs),
        pendingWrite: input.approvalGate.buildPendingWriteFromTool({
            name: composed.tool,
            arguments: composed.arguments,
            riskLevel,
        }),
        scopedToolIds: input.scopedTools.map((tool) => tool.id),
        pageContext: input.pageContext,
        sessionId: input.sessionId,
        idempotencyKey,
        channel: {
            kind: 'chat',
            sessionId: input.sessionId,
            runId: input.runId,
            turnId: input.turnId,
            resume: input.resumeContext,
        },
    });
    return approval.id;
}
exports.mirrorChatApprovalRequest = mirrorChatApprovalRequest;
//# sourceMappingURL=mirror-chat-approval.util.js.map