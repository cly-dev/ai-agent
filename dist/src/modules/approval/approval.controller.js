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
let ApprovalController = class ApprovalController {
    constructor(approvalRequests, approvalResume) {
        this.approvalRequests = approvalRequests;
        this.approvalResume = approvalResume;
    }
    userId(req) {
        return req.user.userId;
    }
    async listInbox(req, limit, offset) {
        const rows = await this.approvalRequests.listPendingForApprover({
            appClientId: req.appClient.id,
            approverUserId: this.userId(req),
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
        return {
            items: rows.map((row) => {
                var _a, _b, _c, _d;
                return ({
                    id: row.id,
                    source: row.source,
                    status: row.status,
                    title: row.title,
                    summary: row.summary,
                    workflowId: row.workflowId,
                    workflowVersion: row.workflowVersion,
                    workflowKey: (_b = (_a = row.workflow) === null || _a === void 0 ? void 0 : _a.workflowKey) !== null && _b !== void 0 ? _b : null,
                    workflowName: (_d = (_c = row.workflow) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : null,
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
                    previewBlocks: row.previewBlocks,
                    pendingWrite: this.extractPendingWritePreview(row),
                });
            }),
        };
    }
    async getOne(req, id) {
        const row = await this.approvalRequests.findByIdForApprover(id, this.userId(req));
        if (!row) {
            throw new common_1.NotFoundException('Approval request not found');
        }
        return {
            id: row.id,
            source: row.source,
            status: row.status,
            title: row.title,
            summary: row.summary,
            workflowId: row.workflowId,
            workflowVersion: row.workflowVersion,
            nodeId: row.nodeId,
            sessionId: row.sessionId,
            pageActionRunId: row.pageActionRunId,
            createdAt: row.createdAt,
            decidedAt: row.decidedAt,
            previewBlocks: row.previewBlocks,
            pendingWrite: this.extractPendingWritePreview(row),
        };
    }
    async confirm(req, id) {
        return this.approvalResume.confirm({
            approvalRequestId: id,
            decidedByUserId: this.userId(req),
        });
    }
    async reject(req, id, body) {
        var _a;
        await this.approvalResume.reject({
            approvalRequestId: id,
            decidedByUserId: this.userId(req),
            decisionNote: (_a = body === null || body === void 0 ? void 0 : body.reason) !== null && _a !== void 0 ? _a : null,
        });
        return { ok: true };
    }
    extractPendingWritePreview(row) {
        var _a, _b;
        const snapshot = row.resumeSnapshot;
        const pending = snapshot === null || snapshot === void 0 ? void 0 : snapshot.pendingWrite;
        const tool = (_a = pending === null || pending === void 0 ? void 0 : pending.name) === null || _a === void 0 ? void 0 : _a.trim();
        if (!tool) {
            return null;
        }
        return {
            tool,
            riskLevel: (_b = pending === null || pending === void 0 ? void 0 : pending.riskLevel) !== null && _b !== void 0 ? _b : 'L2',
        };
    }
};
__decorate([
    (0, common_1.Get)('inbox'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
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