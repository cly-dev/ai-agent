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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalResumeService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const page_action_run_steps_util_1 = require("../page-action/page-action-run-steps.util");
const approval_gate_service_1 = require("./approval-gate.service");
const approval_request_service_1 = require("./approval-request.service");
const approval_trigger_permission_service_1 = require("./approval-trigger-permission.service");
const approval_resume_permission_util_1 = require("./approval-resume-permission.util");
const page_action_approval_resume_util_1 = require("./page-action-approval-resume.util");
const validate_approval_edited_pending_write_util_1 = require("./validate-approval-edited-pending-write.util");
const write_draft_util_1 = require("../draft-review/write-draft.util");
const llm_service_1 = require("../llm/llm.service");
const tool_engine_service_1 = require("../tool-engine/tool-engine.service");
const page_action_run_stream_hub_1 = require("../page-action/stream/page-action-run-stream.hub");
const draft_review_1 = require("../draft-review");
let ApprovalResumeService = class ApprovalResumeService {
    constructor(prisma, approvalRequests, approvalGate, triggerPermission, llmService, toolEngine, runStreamHub) {
        this.prisma = prisma;
        this.approvalRequests = approvalRequests;
        this.approvalGate = approvalGate;
        this.triggerPermission = triggerPermission;
        this.llmService = llmService;
        this.toolEngine = toolEngine;
        this.runStreamHub = runStreamHub;
    }
    async decide(input) {
        var _a;
        const decision = (0, draft_review_1.normalizeDraftReviewDecision)(input.decision);
        if (!decision) {
            throw new common_1.BadRequestException({
                code: 'INVALID_DRAFT_REVIEW_DECISION',
                message: 'Invalid draft review decision',
            });
        }
        switch (decision.action) {
            case 'cancel':
                await this.reject(Object.assign(Object.assign({}, input), { decisionNote: (_a = input.decisionNote) !== null && _a !== void 0 ? _a : 'cancelled by approver', decision }));
                return { resumed: false };
            case 'retry':
                return this.retryPageAction(Object.assign(Object.assign({}, input), { decision }));
            case 'confirm':
            case 'confirm_with_edits':
                return this.confirm(Object.assign(Object.assign({}, input), { decision }));
            default:
                throw new common_1.BadRequestException({
                    code: 'INVALID_DRAFT_REVIEW_DECISION',
                    message: 'Unsupported draft review action',
                });
        }
    }
    async confirm(input) {
        var _a;
        const row = await this.prisma.approvalRequest.findUnique({
            where: { id: input.approvalRequestId },
        });
        if (!row || row.approverUserId !== input.decidedByUserId) {
            throw new common_1.NotFoundException('Approval request not found');
        }
        if (row.source === client_1.ApprovalSource.chat) {
            throw new common_1.BadRequestException({
                code: 'CHAT_APPROVAL_IN_SESSION_ONLY',
                message: 'Chat write confirmation must be completed in the session',
            });
        }
        const decision = (0, draft_review_1.normalizeDraftReviewDecision)(input.decision);
        let snapshot = this.approvalRequests.parseResumeSnapshot(row);
        if ((decision === null || decision === void 0 ? void 0 : decision.action) === 'confirm_with_edits') {
            snapshot = await (0, validate_approval_edited_pending_write_util_1.resolveApprovalSnapshotForDecision)({
                snapshot,
                decision,
                userId: input.decidedByUserId,
                prisma: this.prisma,
                toolEngine: this.toolEngine,
            });
            const editedDraft = (0, write_draft_util_1.resolveWriteDraftFromApprovalSnapshot)(snapshot);
            await this.prisma.approvalRequest.update({
                where: { id: row.id },
                data: {
                    previewBlocks: editedDraft.presentation.previewBlocks,
                    summary: (_a = editedDraft.presentation.summaryText) !== null && _a !== void 0 ? _a : row.summary,
                },
            });
        }
        const cas = await this.approvalRequests.markApproved(input);
        if (cas.ok === false) {
            return { resumed: false };
        }
        await this.assertResumePermission(row.approverUserId, snapshot, row.id, {
            appClientId: row.appClientId,
            source: row.source,
            sessionId: row.sessionId,
        });
        if (snapshot.channel.kind === 'page_action') {
            await (0, page_action_approval_resume_util_1.resumePageActionFromApprovalSnapshot)({
                snapshot,
                approvalRequestId: row.id,
                decision: (0, draft_review_1.normalizeDraftReviewDecision)(input.decision),
                prisma: this.prisma,
                llmService: this.llmService,
                toolEngine: this.toolEngine,
                approvalGate: this.approvalGate,
                runEventBus: this.runStreamHub,
            });
        }
        return { resumed: true };
    }
    async reject(input) {
        var _a;
        const rowBefore = await this.prisma.approvalRequest.findUnique({
            where: { id: input.approvalRequestId },
        });
        if ((rowBefore === null || rowBefore === void 0 ? void 0 : rowBefore.source) === client_1.ApprovalSource.chat &&
            rowBefore.approverUserId === input.decidedByUserId) {
            throw new common_1.BadRequestException({
                code: 'CHAT_APPROVAL_IN_SESSION_ONLY',
                message: 'Chat write confirmation must be completed in the session',
            });
        }
        const cas = await this.approvalRequests.markRejected(input);
        if (!cas.ok) {
            return;
        }
        const row = rowBefore !== null && rowBefore !== void 0 ? rowBefore : (await this.prisma.approvalRequest.findUnique({
            where: { id: input.approvalRequestId },
        }));
        if (!(row === null || row === void 0 ? void 0 : row.pageActionRunId)) {
            return;
        }
        const recorder = page_action_run_steps_util_1.PageActionRunStepRecorder.fromJson((_a = (await this.prisma.pageActionRun.findUnique({
            where: { id: row.pageActionRunId },
            select: { steps: true },
        }))) === null || _a === void 0 ? void 0 : _a.steps);
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
    async retryPageAction(input) {
        const row = await this.prisma.approvalRequest.findUnique({
            where: { id: input.approvalRequestId },
        });
        if (!row || row.approverUserId !== input.decidedByUserId) {
            throw new common_1.NotFoundException('Approval request not found');
        }
        if (row.source !== client_1.ApprovalSource.page_action) {
            throw new common_1.BadRequestException({
                code: 'RETRY_UNSUPPORTED',
                message: 'Retry is only supported for page_action approvals',
            });
        }
        if (row.status !== 'pending') {
            return { resumed: false, suspended: false };
        }
        const decision = (0, draft_review_1.normalizeDraftReviewDecision)(input.decision);
        if (!decision || decision.action !== 'retry' || !decision.retryInstruction) {
            throw new common_1.BadRequestException({
                code: 'INVALID_DRAFT_REVIEW_DECISION',
                message: 'Retry requires retryInstruction',
            });
        }
        const snapshot = this.approvalRequests.parseResumeSnapshot(row);
        const reserved = await this.approvalRequests.reserveDraftRetrySlot({
            approvalRequestId: row.id,
            approverUserId: input.decidedByUserId,
        });
        if (reserved.ok === false && reserved.reason === 'limit_exceeded') {
            throw new common_1.BadRequestException({
                code: 'DRAFT_RETRY_LIMIT_EXCEEDED',
                message: `Draft retry limit reached (${(0, draft_review_1.resolveDraftRetryBudget)(snapshot.draftRetryCount).max})`,
            });
        }
        if (reserved.ok === false) {
            return { resumed: false, suspended: false };
        }
        const rowAfter = await this.prisma.approvalRequest.findUnique({
            where: { id: row.id },
        });
        const snapshotAfter = rowAfter
            ? this.approvalRequests.parseResumeSnapshot(rowAfter)
            : snapshot;
        const suspended = await (0, page_action_approval_resume_util_1.retryPageActionFromApprovalSnapshot)({
            snapshot: snapshotAfter,
            approvalRequestId: row.id,
            retryInstruction: decision.retryInstruction,
            prisma: this.prisma,
            llmService: this.llmService,
            toolEngine: this.toolEngine,
            approvalGate: this.approvalGate,
            runEventBus: this.runStreamHub,
        });
        return { resumed: true, suspended };
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
};
ApprovalResumeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        approval_request_service_1.ApprovalRequestService,
        approval_gate_service_1.ApprovalGateService,
        approval_trigger_permission_service_1.ApprovalTriggerPermissionService,
        llm_service_1.LlmService,
        tool_engine_service_1.ToolEngineService,
        page_action_run_stream_hub_1.PageActionRunStreamHub])
], ApprovalResumeService);
exports.ApprovalResumeService = ApprovalResumeService;
//# sourceMappingURL=approval-resume.service.js.map