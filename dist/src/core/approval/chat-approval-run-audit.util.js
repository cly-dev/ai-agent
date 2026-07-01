"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendChatApprovalRejectedAuditToPrimaryRun = exports.buildChatApprovalRejectedRunStep = exports.buildChatApprovalConfirmedRunStep = exports.enrichChatApprovalAwaitingGateOutput = exports.resolveChatApprovalResumeAudit = exports.offsetRunSteps = void 0;
const agent_run_audit_util_1 = require("../agent-engine/engine/main/run/agent-run-audit.util");
function offsetRunSteps(steps, startStep) {
    return steps.map((step, index) => (Object.assign(Object.assign({}, step), { step: startStep + index })));
}
exports.offsetRunSteps = offsetRunSteps;
async function resolveChatApprovalResumeAudit(input) {
    var _a, _b, _c;
    const row = input.approvalRequestId != null
        ? { id: input.approvalRequestId, nodeId: (_a = input.nodeId) !== null && _a !== void 0 ? _a : '' }
        : await input.approvalRequests.findChatBySessionPrimaryRun({
            appClientId: input.appClientId,
            sessionId: input.sessionId,
            runId: input.primaryRunId,
        });
    if (!(row === null || row === void 0 ? void 0 : row.id)) {
        return null;
    }
    return {
        approvalRequestId: row.id,
        resumeChannel: input.resumeChannel,
        decidedByUserId: input.decidedByUserId,
        nodeId: (_c = (_b = input.nodeId) !== null && _b !== void 0 ? _b : row.nodeId) !== null && _c !== void 0 ? _c : null,
    };
}
exports.resolveChatApprovalResumeAudit = resolveChatApprovalResumeAudit;
function enrichChatApprovalAwaitingGateOutput(output, input) {
    return Object.assign(Object.assign({}, output), { status: 'awaiting_user', auditPhase: 'awaiting_approval', approvalRequestId: input.approvalRequestId, nodeId: input.nodeId });
}
exports.enrichChatApprovalAwaitingGateOutput = enrichChatApprovalAwaitingGateOutput;
function buildChatApprovalConfirmedRunStep(stepNumber, input) {
    var _a;
    const output = {
        status: 'approved',
        auditPhase: 'approval_confirmed',
        approvalRequestId: input.approvalRequestId,
        primaryRunId: input.primaryRunId,
        resumeChannel: input.resumeChannel,
        decidedByUserId: input.decidedByUserId,
        nodeId: (_a = input.nodeId) !== null && _a !== void 0 ? _a : null,
    };
    return {
        step: stepNumber,
        type: 'write_confirmation_gate',
        output,
    };
}
exports.buildChatApprovalConfirmedRunStep = buildChatApprovalConfirmedRunStep;
function buildChatApprovalRejectedRunStep(stepNumber, input) {
    var _a;
    const output = {
        status: 'rejected',
        auditPhase: 'approval_rejected',
        approvalRequestId: input.approvalRequestId,
        primaryRunId: input.primaryRunId,
        rejectChannel: input.rejectChannel,
        decidedByUserId: input.decidedByUserId,
        decisionNote: (_a = input.decisionNote) !== null && _a !== void 0 ? _a : null,
    };
    return {
        step: stepNumber,
        type: 'write_confirmation_gate',
        output,
    };
}
exports.buildChatApprovalRejectedRunStep = buildChatApprovalRejectedRunStep;
async function appendChatApprovalRejectedAuditToPrimaryRun(input) {
    const row = await input.prisma.agentRun.findUnique({
        where: { id: input.primaryRunId },
        select: { steps: true },
    });
    if (!row) {
        return;
    }
    const priorSteps = parseAgentRunSteps(row.steps);
    const auditStep = buildChatApprovalRejectedRunStep(priorSteps.length > 0
        ? Math.max(...priorSteps.map((step) => step.step)) + 1
        : 1, {
        approvalRequestId: input.approvalRequestId,
        primaryRunId: input.primaryRunId,
        rejectChannel: input.rejectChannel,
        decidedByUserId: input.decidedByUserId,
        decisionNote: input.decisionNote,
    });
    const nextSteps = (0, agent_run_audit_util_1.stepsForRunPersistence)([...priorSteps, auditStep]);
    await input.prisma.agentRun.update({
        where: { id: input.primaryRunId },
        data: { steps: nextSteps },
    });
}
exports.appendChatApprovalRejectedAuditToPrimaryRun = appendChatApprovalRejectedAuditToPrimaryRun;
function parseAgentRunSteps(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.filter((row) => typeof row === 'object' &&
        row != null &&
        typeof row.step === 'number' &&
        typeof row.type === 'string');
}
//# sourceMappingURL=chat-approval-run-audit.util.js.map