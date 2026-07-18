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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalController = void 0;
const common_1 = require("@nestjs/common");
const app_client_dsn_guard_1 = require("../../auth/app-client-dsn.guard");
const user_jwt_auth_guard_1 = require("../../auth/user-jwt-auth.guard");
const approval_request_service_1 = require("../../core/approval/approval-request.service");
const approval_resume_service_1 = require("../../core/approval/approval-resume.service");
const draft_review_1 = require("../../core/draft-review");
const approval_decide_dto_1 = require("./dto/approval-decide.dto");
const query_approval_inbox_dto_1 = require("./dto/query-approval-inbox.dto");
const approval_write_draft_mapper_1 = require("./approval-write-draft.mapper");
const build_approval_entity_reference_util_1 = require("../../core/approval/build-approval-entity-reference.util");
let ApprovalController = class ApprovalController {
    constructor(approvalRequests, approvalResume) {
        this.approvalRequests = approvalRequests;
        this.approvalResume = approvalResume;
    }
    userId(req) {
        return req.user.userId;
    }
    async listInbox(req, query) {
        const rows = await this.approvalRequests.listInboxForApprover({
            appClientId: req.appClient.id,
            approverUserId: this.userId(req),
            status: query.status,
            limit: query.limit,
            offset: query.offset,
        });
        const toolMap = await this.approvalRequests.loadWriteToolsByIds(rows
            .map((row) => (0, approval_write_draft_mapper_1.resolveApprovalRowToolId)(row))
            .filter((id) => id != null));
        return {
            items: rows.map((row) => this.toInboxItem(row, toolMap)),
        };
    }
    async getOne(req, id) {
        const row = await this.approvalRequests.findByIdForApprover(id, this.userId(req));
        if (!row) {
            throw new common_1.NotFoundException('Approval request not found');
        }
        const toolId = (0, approval_write_draft_mapper_1.resolveApprovalRowToolId)(row);
        const toolMap = toolId
            ? await this.approvalRequests.loadWriteToolsByIds([toolId])
            : new Map();
        return this.toInboxItem(row, toolMap);
    }
    async decide(req, id, body) {
        var _a;
        return this.approvalResume.decide({
            approvalRequestId: id,
            decidedByUserId: this.userId(req),
            decisionNote: (_a = body.reason) !== null && _a !== void 0 ? _a : null,
            decision: body.decision,
        });
    }
    async confirm(req, id) {
        return this.approvalResume.decide({
            approvalRequestId: id,
            decidedByUserId: this.userId(req),
            decision: { action: 'confirm' },
        });
    }
    async reject(req, id, body) {
        var _a;
        await this.approvalResume.decide({
            approvalRequestId: id,
            decidedByUserId: this.userId(req),
            decisionNote: (_a = body === null || body === void 0 ? void 0 : body.reason) !== null && _a !== void 0 ? _a : null,
            decision: { action: 'cancel' },
        });
        return { ok: true };
    }
    toInboxItem(row, toolMap) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const toolId = (0, approval_write_draft_mapper_1.resolveApprovalRowToolId)(row);
        const writeTool = toolId != null ? (_a = toolMap.get(toolId)) !== null && _a !== void 0 ? _a : null : null;
        const { writeDraft, editPolicy } = (0, approval_write_draft_mapper_1.buildApprovalWriteDraftPayload)(row, writeTool);
        return {
            id: row.id,
            source: row.source,
            status: row.status,
            title: row.title,
            summary: row.summary,
            workflowId: row.workflowId,
            workflowVersion: row.workflowVersion,
            flowId: row.flowId,
            flowVersion: row.flowVersion,
            workflowKey: (_e = (_c = (_b = row.workflow) === null || _b === void 0 ? void 0 : _b.workflowKey) !== null && _c !== void 0 ? _c : (_d = row.flow) === null || _d === void 0 ? void 0 : _d.flowKey) !== null && _e !== void 0 ? _e : null,
            workflowName: (_j = (_g = (_f = row.workflow) === null || _f === void 0 ? void 0 : _f.name) !== null && _g !== void 0 ? _g : (_h = row.flow) === null || _h === void 0 ? void 0 : _h.name) !== null && _j !== void 0 ? _j : null,
            flowKey: (_l = (_k = row.flow) === null || _k === void 0 ? void 0 : _k.flowKey) !== null && _l !== void 0 ? _l : null,
            flowName: (_o = (_m = row.flow) === null || _m === void 0 ? void 0 : _m.name) !== null && _o !== void 0 ? _o : null,
            nodeId: row.nodeId,
            sessionId: row.sessionId,
            pageActionRunId: row.pageActionRunId,
            initiator: row.initiator
                ? {
                    id: row.initiator.id,
                    username: row.initiator.username,
                    employeeId: row.initiator.employeeId,
                }
                : null,
            createdAt: row.createdAt,
            decidedAt: row.decidedAt,
            writeDraft,
            editPolicy,
            previewBlocks: row.previewBlocks,
            pendingWrite: {
                tool: writeDraft.tool.name,
                riskLevel: writeDraft.tool.riskLevel,
            },
            draftReview: this.extractDraftReviewBudget(row),
            entityReference: (0, build_approval_entity_reference_util_1.buildApprovalEntityReferenceFromSnapshot)(row.resumeSnapshot),
        };
    }
    extractDraftReviewBudget(row) {
        const snapshot = row.resumeSnapshot;
        const budget = (0, draft_review_1.resolveDraftRetryBudget)(snapshot === null || snapshot === void 0 ? void 0 : snapshot.draftRetryCount);
        return {
            retryCount: budget.used,
            retryMax: budget.max,
            canRetry: budget.canRetry,
        };
    }
};
__decorate([
    (0, common_1.Get)('inbox'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_approval_inbox_dto_1.QueryApprovalInboxDto]),
    __metadata("design:returntype", Promise)
], ApprovalController.prototype, "listInbox", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], ApprovalController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(':id/decide'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, approval_decide_dto_1.ApprovalDecideDto]),
    __metadata("design:returntype", Promise)
], ApprovalController.prototype, "decide", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], ApprovalController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], ApprovalController.prototype, "reject", null);
ApprovalController = __decorate([
    (0, common_1.Controller)('approval'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    __metadata("design:paramtypes", [approval_request_service_1.ApprovalRequestService,
        approval_resume_service_1.ApprovalResumeService])
], ApprovalController);
exports.ApprovalController = ApprovalController;
//# sourceMappingURL=approval.controller.js.map