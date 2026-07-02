"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseWriteConfirmGate = exports.prepareWriteConfirmFromRedis = void 0;
async function prepareWriteConfirmFromRedis(input) {
    const session = await input.prisma.session.findFirst({
        where: { id: input.resumeInput.sessionId, userId: input.resumeInput.userId },
        select: { id: true, agentId: true, appClientId: true },
    });
    if (!(session === null || session === void 0 ? void 0 : session.agentId)) {
        return null;
    }
    const pending = await input.pendingWriteConfirmationStore.get(input.resumeInput.sessionId, input.resumeInput.userId);
    if (!pending) {
        return null;
    }
    const primaryRun = await input.prisma.agentRun.findFirst({
        where: {
            id: pending.runId,
            sessionId: pending.sessionId,
            userId: input.resumeInput.userId,
        },
        select: { id: true, turnId: true },
    });
    if (!(primaryRun === null || primaryRun === void 0 ? void 0 : primaryRun.turnId)) {
        return null;
    }
    const agent = await input.agentService.getRuntimeAgent(session.appClientId, session.agentId);
    if (!agent) {
        return null;
    }
    return {
        session: {
            id: session.id,
            agentId: session.agentId,
            appClientId: session.appClientId,
        },
        consumed: pending,
        primaryRun,
        suspendedPrimaryRunId: pending.runId,
    };
}
exports.prepareWriteConfirmFromRedis = prepareWriteConfirmFromRedis;
async function releaseWriteConfirmGate(input) {
    const pending = await input.pendingWriteConfirmationStore.get(input.sessionId, input.userId);
    if ((pending === null || pending === void 0 ? void 0 : pending.runId) === input.runId) {
        await input.pendingWriteConfirmationStore.consume(input.sessionId, input.userId);
    }
    input.runSse.purgeWriteConfirmationGate(input.sessionId, input.runId);
}
exports.releaseWriteConfirmGate = releaseWriteConfirmGate;
//# sourceMappingURL=prepare-write-confirm-resume.util.js.map