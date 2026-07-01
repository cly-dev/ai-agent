"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveApproverAllowedToolIds = void 0;
async function resolveApproverAllowedToolIds(input) {
    if (input.source === 'page_action' || input.source === 'webhook') {
        return input.triggerPermission.resolveUserAllowedToolIdsForApp({
            userId: input.approverUserId,
            appClientId: input.appClientId,
        });
    }
    const sessionId = input.snapshot.channel.kind === 'chat'
        ? input.snapshot.channel.sessionId
        : input.sessionId;
    if (!sessionId) {
        return input.snapshot.scopedToolIds;
    }
    const session = await input.prisma.session.findFirst({
        where: { id: sessionId, userId: input.approverUserId },
        select: { agentId: true },
    });
    if (!(session === null || session === void 0 ? void 0 : session.agentId)) {
        return [];
    }
    return input.triggerPermission.resolveUserAllowedToolIds({
        userId: input.approverUserId,
        appClientId: input.appClientId,
        agentId: session.agentId,
    });
}
exports.resolveApproverAllowedToolIds = resolveApproverAllowedToolIds;
//# sourceMappingURL=approval-resume-permission.util.js.map