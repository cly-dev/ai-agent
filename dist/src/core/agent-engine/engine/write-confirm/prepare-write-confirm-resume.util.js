"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseWriteConfirmGate = exports.prepareWriteConfirmFromApprovalSnapshot = exports.prepareWriteConfirmFromRedis = void 0;
const approval_resume_snapshot_types_1 = require("../../../approval/approval-resume-snapshot.types");
const workflow_mutation_write_gate_util_1 = require("../../../workflow/workflow-mutation-write-gate.util");
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
function buildToolCallsFromApprovalSnapshot(snapshot) {
    var _a;
    const workflowRun = (0, approval_resume_snapshot_types_1.isChatApprovalSnapshot)(snapshot)
        ? (_a = snapshot.channel.resume.workflowRun) !== null && _a !== void 0 ? _a : snapshot.workflowRun
        : snapshot.workflowRun;
    if ((0, workflow_mutation_write_gate_util_1.isWorkflowAwaitUserConfirmResume)({
        pendingToolCalls: [],
        workflowRun,
    })) {
        return [];
    }
    return [
        {
            name: snapshot.pendingWrite.name,
            arguments: snapshot.pendingWrite.arguments,
            riskLevel: snapshot.pendingWrite.riskLevel,
            reason: '',
        },
    ];
}
async function prepareWriteConfirmFromApprovalSnapshot(input) {
    var _a, _b, _c, _d, _e, _f;
    if (!(0, approval_resume_snapshot_types_1.isChatApprovalSnapshot)(input.snapshot)) {
        return null;
    }
    const channel = input.snapshot.channel;
    const session = await input.prisma.session.findFirst({
        where: { id: channel.sessionId, userId: input.resumeInput.userId },
        select: { id: true, agentId: true, appClientId: true },
    });
    if (!(session === null || session === void 0 ? void 0 : session.agentId)) {
        return null;
    }
    const primaryRun = await input.prisma.agentRun.findFirst({
        where: {
            id: channel.runId,
            sessionId: channel.sessionId,
            userId: input.resumeInput.userId,
        },
        select: { id: true, turnId: true, input: true },
    });
    if (!(primaryRun === null || primaryRun === void 0 ? void 0 : primaryRun.turnId)) {
        return null;
    }
    const agent = await input.agentService.getRuntimeAgent(session.appClientId, session.agentId);
    if (!agent) {
        return null;
    }
    const resumeContext = Object.assign(Object.assign({}, channel.resume), { workflowRun: (_a = channel.resume.workflowRun) !== null && _a !== void 0 ? _a : input.snapshot.workflowRun, workflowNodeDefs: (_b = channel.resume.workflowNodeDefs) !== null && _b !== void 0 ? _b : input.snapshot.workflowNodeDefs, workflowNodeOutputs: (_c = channel.resume.workflowNodeOutputs) !== null && _c !== void 0 ? _c : input.snapshot.workflowNodeOutputs, pageContext: (_e = (_d = channel.resume.pageContext) !== null && _d !== void 0 ? _d : input.snapshot.pageContext) !== null && _e !== void 0 ? _e : null });
    const consumed = {
        runId: channel.runId,
        turnId: channel.turnId,
        sessionId: channel.sessionId,
        userId: input.resumeInput.userId,
        appClientId: session.appClientId,
        agentId: session.agentId,
        latestUserMessage: (_f = primaryRun.input) !== null && _f !== void 0 ? _f : '',
        toolCalls: buildToolCallsFromApprovalSnapshot(input.snapshot),
        resumeContext,
        createdAt: new Date().toISOString(),
    };
    return {
        session: {
            id: session.id,
            agentId: session.agentId,
            appClientId: session.appClientId,
        },
        consumed,
        primaryRun: { id: primaryRun.id, turnId: primaryRun.turnId },
        suspendedPrimaryRunId: channel.runId,
    };
}
exports.prepareWriteConfirmFromApprovalSnapshot = prepareWriteConfirmFromApprovalSnapshot;
async function releaseWriteConfirmGate(input) {
    const pending = await input.pendingWriteConfirmationStore.get(input.sessionId, input.userId);
    if ((pending === null || pending === void 0 ? void 0 : pending.runId) === input.runId) {
        await input.pendingWriteConfirmationStore.consume(input.sessionId, input.userId);
    }
    input.runSse.purgeWriteConfirmationGate(input.sessionId, input.runId);
    if (input.skipChatApprovalSync) {
        return;
    }
    void input.approvalRequests
        .syncChatRealtimeDecision({
        appClientId: input.appClientId,
        sessionId: input.sessionId,
        runId: input.runId,
        decidedByUserId: input.userId,
        decision: 'approved',
    })
        .catch(() => undefined);
}
exports.releaseWriteConfirmGate = releaseWriteConfirmGate;
//# sourceMappingURL=prepare-write-confirm-resume.util.js.map