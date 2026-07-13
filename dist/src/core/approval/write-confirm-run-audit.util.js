"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendChatWriteConfirmRejectedAuditToPrimaryRun = exports.buildChatWriteConfirmRejectedRunStep = exports.buildChatWriteConfirmConfirmedRunStep = void 0;
const agent_run_audit_util_1 = require("../agent-engine/engine/main/run/agent-run-audit.util");
const agent_run_steps_util_1 = require("../agent-engine/engine/main/run/agent-run-steps.util");
function buildChatWriteConfirmConfirmedRunStep(stepNumber, input) {
    var _a;
    return {
        step: stepNumber,
        type: 'write_confirmation_gate',
        output: {
            status: 'approved',
            auditPhase: 'approval_confirmed',
            primaryRunId: input.primaryRunId,
            resumeChannel: 'session_confirm',
            decidedByUserId: input.decidedByUserId,
            nodeId: (_a = input.nodeId) !== null && _a !== void 0 ? _a : null,
        },
    };
}
exports.buildChatWriteConfirmConfirmedRunStep = buildChatWriteConfirmConfirmedRunStep;
function buildChatWriteConfirmRejectedRunStep(stepNumber, input) {
    var _a;
    return {
        step: stepNumber,
        type: 'write_confirmation_gate',
        output: {
            status: 'rejected',
            auditPhase: 'approval_rejected',
            primaryRunId: input.primaryRunId,
            rejectChannel: input.rejectChannel,
            decidedByUserId: input.decidedByUserId,
            decisionNote: (_a = input.decisionNote) !== null && _a !== void 0 ? _a : null,
        },
    };
}
exports.buildChatWriteConfirmRejectedRunStep = buildChatWriteConfirmRejectedRunStep;
async function appendChatWriteConfirmRejectedAuditToPrimaryRun(input) {
    const row = await input.prisma.agentRun.findUnique({
        where: { id: input.primaryRunId },
        select: { steps: true },
    });
    if (!row) {
        return;
    }
    const priorSteps = (0, agent_run_steps_util_1.parseAgentRunSteps)(row.steps);
    const auditStep = buildChatWriteConfirmRejectedRunStep(priorSteps.length > 0 ? (0, agent_run_steps_util_1.maxRunStepNumber)(priorSteps) + 1 : 1, {
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
exports.appendChatWriteConfirmRejectedAuditToPrimaryRun = appendChatWriteConfirmRejectedAuditToPrimaryRun;
//# sourceMappingURL=write-confirm-run-audit.util.js.map