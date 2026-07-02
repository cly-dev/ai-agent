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
const llm_service_1 = require("../llm/llm.service");
const tool_engine_service_1 = require("../tool-engine/tool-engine.service");
let ApprovalResumeService = class ApprovalResumeService {
    constructor(prisma, approvalRequests, approvalGate, triggerPermission, llmService, toolEngine) {
        this.prisma = prisma;
        this.approvalRequests = approvalRequests;
        this.approvalGate = approvalGate;
        this.triggerPermission = triggerPermission;
        this.llmService = llmService;
        this.toolEngine = toolEngine;
    }
    async confirm(input) {
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
        const cas = await this.approvalRequests.markApproved(input);
        if (cas.ok === false) {
            return { resumed: false };
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
        tool_engine_service_1.ToolEngineService])
], ApprovalResumeService);
exports.ApprovalResumeService = ApprovalResumeService;
//# sourceMappingURL=approval-resume.service.js.map