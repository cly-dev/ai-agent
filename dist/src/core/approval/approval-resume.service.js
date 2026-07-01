"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ApprovalResumeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalResumeService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const page_action_run_steps_util_1 = require("../page-action/page-action-run-steps.util");
const approval_resume_snapshot_types_1 = require("./approval-resume-snapshot.types");
const approval_gate_service_1 = require("./approval-gate.service");
const approval_request_service_1 = require("./approval-request.service");
const approval_trigger_permission_service_1 = require("./approval-trigger-permission.service");
const approval_resume_permission_util_1 = require("./approval-resume-permission.util");
const page_action_approval_resume_util_1 = require("./page-action-approval-resume.util");
const chat_approval_run_audit_util_1 = require("./chat-approval-run-audit.util");
const session_run_coordinator_service_1 = require("../session-run/session-run-coordinator.service");
const agent_run_sse_gateway_1 = require("../session-run/agent-run-sse.gateway");
const pending_write_confirmation_store_1 = require("../../modules/chat/pending-write-confirmation.store");
const llm_service_1 = require("../llm/llm.service");
const tool_engine_service_1 = require("../tool-engine/tool-engine.service");
let ApprovalResumeService = ApprovalResumeService_1 = class ApprovalResumeService {
    constructor(prisma, approvalRequests, approvalGate, triggerPermission, llmService, toolEngine, pendingWriteConfirmationStore, runSse, sessionRunCoordinator) {
        this.prisma = prisma;
        this.approvalRequests = approvalRequests;
        this.approvalGate = approvalGate;
        this.triggerPermission = triggerPermission;
        this.llmService = llmService;
        this.toolEngine = toolEngine;
        this.pendingWriteConfirmationStore = pendingWriteConfirmationStore;
        this.runSse = runSse;
        this.sessionRunCoordinator = sessionRunCoordinator;
        this.logger = new common_1.Logger(ApprovalResumeService_1.name);
    }
    async confirm(input) {
        const cas = await this.approvalRequests.markApproved(input);
        if (cas.ok === false) {
            return { resumed: false };
        }
        const row = await this.prisma.approvalRequest.findUnique({
            where: { id: input.approvalRequestId },
        });
        if (!row) {
            throw new common_1.NotFoundException('Approval request not found');
        }
        const snapshot = this.approvalRequests.parseResumeSnapshot(row);
        await this.assertResumePermission(row.approverUserId, snapshot, row.id, {
            appClientId: row.appClientId,
            source: row.source,
            sessionId: row.sessionId,
        });
        if (snapshot.channel.kind === 'page_action') {
            await (0, page_action_approval_resume_util_1.resumePageActionFromApprovalSnapshot)({
                snapshot,
                approvalRequestId: row.id,
                prisma: this.prisma,
                llmService: this.llmService,
                toolEngine: this.toolEngine,
                approvalGate: this.approvalGate,
            });
        }
        else if ((0, approval_resume_snapshot_types_1.isChatApprovalSnapshot)(snapshot)) {
            await this.resumeChatFromInboxConfirm({
                snapshot,
                approvalRequestId: row.id,
                appClientId: row.appClientId,
                decidedByUserId: input.decidedByUserId,
            });
        }
        return { resumed: true };
    }
    async reject(input) {
        var _a, _b;
        const rowBefore = await this.prisma.approvalRequest.findUnique({
            where: { id: input.approvalRequestId },
        });
        const cas = await this.approvalRequests.markRejected(input);
        if (!cas.ok) {
            return;
        }
        const row = rowBefore !== null && rowBefore !== void 0 ? rowBefore : (await this.prisma.approvalRequest.findUnique({
            where: { id: input.approvalRequestId },
        }));
        if (!row) {
            return;
        }
        const snapshot = this.approvalRequests.parseResumeSnapshot(row);
        if ((0, approval_resume_snapshot_types_1.isChatApprovalSnapshot)(snapshot)) {
            await this.rejectChatFromInbox({
                snapshot,
                approvalRequestId: row.id,
                decidedByUserId: input.decidedByUserId,
                decisionNote: (_a = input.decisionNote) !== null && _a !== void 0 ? _a : null,
            });
        }
        if (!row.pageActionRunId) {
            return;
        }
        const recorder = page_action_run_steps_util_1.PageActionRunStepRecorder.fromJson((_b = (await this.prisma.pageActionRun.findUnique({
            where: { id: row.pageActionRunId },
            select: { steps: true },
        }))) === null || _b === void 0 ? void 0 : _b.steps);
        recorder.recordLifecycle('approval_rejected', {
            approvalRequestId: row.id,
            decidedByUserId: input.decidedByUserId,
        });
        await this.prisma.pageActionRun.update({
            where: { id: row.pageActionRunId },
            data: {
                status: client_1.PageActionRunStatus.cancelled,
                finishedAt: new Date(),
                steps: recorder.toJson(),
            },
        });
    }
    async assertResumePermission(userId, snapshot, approvalRequestId, context) {
        var _a;
        const allowedToolIds = await (0, approval_resume_permission_util_1.resolveApproverAllowedToolIds)({
            approverUserId: userId,
            appClientId: context.appClientId,
            source: context.source,
            snapshot,
            sessionId: (_a = context.sessionId) !== null && _a !== void 0 ? _a : null,
            prisma: this.prisma,
            triggerPermission: this.triggerPermission,
        });
        const decision = this.triggerPermission.evaluateForNodes({
            nodes: snapshot.workflowNodeDefs,
            allowedToolIds,
        });
        if (!decision.allowed) {
            await this.approvalRequests.markCancelled({
                approvalRequestId,
                decidedByUserId: userId,
                decisionNote: 'write tool permission revoked',
            });
            throw new common_1.NotFoundException({
                code: 'WORKFLOW_TRIGGER_PERMISSION_DENIED',
                message: 'Approver no longer has write tool permission',
            });
        }
    }
    async resumeChatFromInboxConfirm(input) {
        var _a;
        if (!(0, approval_resume_snapshot_types_1.isChatApprovalSnapshot)(input.snapshot)) {
            return;
        }
        const { sessionId, runId } = input.snapshot.channel;
        try {
            await this.sessionRunCoordinator.enqueueApprovalInboxResumeFromSnapshot({
                userId: input.decidedByUserId,
                sessionId,
                appClientId: input.appClientId,
                pageContext: (_a = input.snapshot.pageContext) !== null && _a !== void 0 ? _a : null,
                snapshot: input.snapshot,
                approvalRequestId: input.approvalRequestId,
            });
        }
        catch (error) {
            this.logger.warn(`chat inbox confirm resume failed sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async rejectChatFromInbox(input) {
        if (!(0, approval_resume_snapshot_types_1.isChatApprovalSnapshot)(input.snapshot)) {
            return;
        }
        const { sessionId, runId, turnId } = input.snapshot.channel;
        await (0, chat_approval_run_audit_util_1.appendChatApprovalRejectedAuditToPrimaryRun)({
            prisma: this.prisma,
            primaryRunId: runId,
            approvalRequestId: input.approvalRequestId,
            rejectChannel: 'inbox_reject',
            decidedByUserId: input.decidedByUserId,
            decisionNote: input.decisionNote,
        });
        const pending = await this.pendingWriteConfirmationStore.get(sessionId, input.decidedByUserId);
        if (!pending || pending.runId !== runId) {
            return;
        }
        await this.pendingWriteConfirmationStore.clear(sessionId);
        this.runSse.purgeWriteConfirmationGate(sessionId, runId);
        this.runSse.emitWriteConfirmationCancelled(sessionId, {
            runId,
            turnId,
            message: '已拒绝操作。',
        });
    }
};
ApprovalResumeService = ApprovalResumeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(8, (0, common_1.Inject)((0, common_1.forwardRef)(() => session_run_coordinator_service_1.SessionRunCoordinator))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        approval_request_service_1.ApprovalRequestService,
        approval_gate_service_1.ApprovalGateService,
        approval_trigger_permission_service_1.ApprovalTriggerPermissionService,
        llm_service_1.LlmService,
        tool_engine_service_1.ToolEngineService,
        pending_write_confirmation_store_1.PendingWriteConfirmationStore,
        agent_run_sse_gateway_1.AgentRunSseGateway,
        session_run_coordinator_service_1.SessionRunCoordinator])
], ApprovalResumeService);
exports.ApprovalResumeService = ApprovalResumeService;
//# sourceMappingURL=approval-resume.service.js.map