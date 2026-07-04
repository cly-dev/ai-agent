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
exports.ApprovalRequestService = exports.APPROVAL_INBOX_SOURCES = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const draft_review_1 = require("../draft-review");
exports.APPROVAL_INBOX_SOURCES = [
    client_1.ApprovalSource.page_action,
    client_1.ApprovalSource.webhook,
];
const APPROVAL_INBOX_INCLUDE = {
    workflow: { select: { workflowKey: true, name: true } },
    initiator: { select: { id: true, username: true, employeeId: true } },
};
let ApprovalRequestService = class ApprovalRequestService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPending(input) {
        var _a, _b, _c, _d;
        return this.prisma.approvalRequest.create({
            data: {
                appClientId: input.appClientId,
                source: input.source,
                status: client_1.ApprovalStatus.pending,
                initiatorUserId: input.initiatorUserId,
                approverUserId: input.approverUserId,
                workflowId: input.workflowId,
                workflowVersion: input.workflowVersion,
                nodeId: input.nodeId,
                title: input.title,
                summary: (_a = input.summary) !== null && _a !== void 0 ? _a : null,
                previewBlocks: input.previewBlocks === undefined
                    ? undefined
                    : input.previewBlocks,
                resumeSnapshot: input.resumeSnapshot,
                pageActionRunId: (_b = input.pageActionRunId) !== null && _b !== void 0 ? _b : null,
                sessionId: (_c = input.sessionId) !== null && _c !== void 0 ? _c : null,
                idempotencyKey: (_d = input.idempotencyKey) !== null && _d !== void 0 ? _d : null,
            },
        });
    }
    async findPendingByIdempotencyKey(input) {
        return this.prisma.approvalRequest.findFirst({
            where: {
                appClientId: input.appClientId,
                idempotencyKey: input.idempotencyKey,
                status: client_1.ApprovalStatus.pending,
            },
        });
    }
    async findByIdForApprover(approvalRequestId, approverUserId) {
        return this.prisma.approvalRequest.findFirst({
            where: {
                id: approvalRequestId,
                approverUserId,
                source: { in: [...exports.APPROVAL_INBOX_SOURCES] },
            },
        });
    }
    async listPendingForApprover(input) {
        var _a, _b;
        return this.prisma.approvalRequest.findMany({
            where: {
                appClientId: input.appClientId,
                approverUserId: input.approverUserId,
                status: client_1.ApprovalStatus.pending,
                source: { in: [...exports.APPROVAL_INBOX_SOURCES] },
            },
            orderBy: { createdAt: 'desc' },
            take: (_a = input.limit) !== null && _a !== void 0 ? _a : 50,
            skip: (_b = input.offset) !== null && _b !== void 0 ? _b : 0,
            include: APPROVAL_INBOX_INCLUDE,
        });
    }
    parseResumeSnapshot(row) {
        return row.resumeSnapshot;
    }
    async casDecide(approvalRequestId, nextStatus, input) {
        var _a;
        const existing = await this.prisma.approvalRequest.findUnique({
            where: { id: approvalRequestId },
            select: { status: true, approverUserId: true },
        });
        if (!existing) {
            return { ok: false, reason: 'not_found' };
        }
        if (existing.approverUserId !== input.decidedByUserId) {
            return { ok: false, reason: 'not_found' };
        }
        if (existing.status !== client_1.ApprovalStatus.pending) {
            return { ok: false, reason: 'already_decided' };
        }
        const updated = await this.prisma.approvalRequest.updateMany({
            where: {
                id: approvalRequestId,
                status: client_1.ApprovalStatus.pending,
                approverUserId: input.decidedByUserId,
            },
            data: {
                status: nextStatus,
                decidedByUserId: input.decidedByUserId,
                decidedAt: new Date(),
                decisionNote: (_a = input.decisionNote) !== null && _a !== void 0 ? _a : null,
            },
        });
        if (updated.count === 0) {
            return { ok: false, reason: 'not_pending' };
        }
        return { ok: true, previousStatus: client_1.ApprovalStatus.pending };
    }
    async markApproved(input) {
        return this.casDecide(input.approvalRequestId, client_1.ApprovalStatus.approved, input);
    }
    async markRejected(input) {
        return this.casDecide(input.approvalRequestId, client_1.ApprovalStatus.rejected, input);
    }
    async markCancelled(input) {
        return this.casDecide(input.approvalRequestId, client_1.ApprovalStatus.cancelled, input);
    }
    async updatePendingSnapshot(input) {
        const updated = await this.prisma.approvalRequest.updateMany({
            where: {
                id: input.approvalRequestId,
                approverUserId: input.approverUserId,
                status: client_1.ApprovalStatus.pending,
            },
            data: Object.assign(Object.assign({ resumeSnapshot: input.resumeSnapshot }, (input.previewBlocks !== undefined
                ? { previewBlocks: input.previewBlocks }
                : {})), (input.summary !== undefined ? { summary: input.summary } : {})),
        });
        return updated.count > 0;
    }
    async reserveDraftRetrySlot(input) {
        return this.prisma.$transaction(async (tx) => {
            var _a;
            const row = await tx.approvalRequest.findFirst({
                where: {
                    id: input.approvalRequestId,
                    approverUserId: input.approverUserId,
                    status: client_1.ApprovalStatus.pending,
                },
            });
            if (!row) {
                return { ok: false, reason: 'not_found' };
            }
            const snapshot = row.resumeSnapshot;
            const used = (_a = snapshot.draftRetryCount) !== null && _a !== void 0 ? _a : 0;
            if (!(0, draft_review_1.canRequestDraftRetry)(used)) {
                return { ok: false, reason: 'limit_exceeded' };
            }
            const nextCount = used + 1;
            const nextSnapshot = Object.assign(Object.assign({}, snapshot), { draftRetryCount: nextCount });
            const updated = await tx.approvalRequest.updateMany({
                where: {
                    id: input.approvalRequestId,
                    approverUserId: input.approverUserId,
                    status: client_1.ApprovalStatus.pending,
                },
                data: {
                    resumeSnapshot: nextSnapshot,
                },
            });
            if (updated.count === 0) {
                return { ok: false, reason: 'not_pending' };
            }
            return { ok: true, draftRetryCount: nextCount };
        });
    }
};
ApprovalRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApprovalRequestService);
exports.ApprovalRequestService = ApprovalRequestService;
//# sourceMappingURL=approval-request.service.js.map