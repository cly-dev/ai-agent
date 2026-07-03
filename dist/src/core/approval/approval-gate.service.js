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
exports.ApprovalGateService = void 0;
const common_1 = require("@nestjs/common");
const approval_request_service_1 = require("./approval-request.service");
const write_draft_util_1 = require("../draft-review/write-draft.util");
let ApprovalGateService = class ApprovalGateService {
    constructor(approvalRequests) {
        this.approvalRequests = approvalRequests;
    }
    async suspend(input) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const writeDraft = (0, write_draft_util_1.syncWriteDraftPresentation)(Object.assign(Object.assign({}, input.writeDraft), { provenance: Object.assign(Object.assign({}, input.writeDraft.provenance), { lastEvent: 'suspended' }) }));
        const pendingWrite = (0, write_draft_util_1.writeDraftToPendingWrite)(writeDraft);
        const previewBlocks = writeDraft.presentation.previewBlocks;
        const summary = (_a = writeDraft.presentation.summaryText) !== null && _a !== void 0 ? _a : null;
        let resumeSnapshot = {
            version: 1,
            workflowRun: input.workflowRun,
            workflowNodeDefs: input.workflowNodeDefs,
            workflowNodeOutputs: input.workflowNodeOutputs,
            pendingWrite,
            writeDraft,
            scopedToolIds: input.scopedToolIds,
            pageContext: (_b = input.pageContext) !== null && _b !== void 0 ? _b : null,
            channel: input.channel,
            draftRetryCount: writeDraft.provenance.draftRetryCount,
        };
        if (input.existingApprovalRequestId != null) {
            const existing = await this.approvalRequests.findByIdForApprover(input.existingApprovalRequestId, input.approverUserId);
            const previousSnapshot = existing
                ? this.approvalRequests.parseResumeSnapshot(existing)
                : null;
            const previousRetry = (_c = previousSnapshot === null || previousSnapshot === void 0 ? void 0 : previousSnapshot.draftRetryCount) !== null && _c !== void 0 ? _c : 0;
            const mergedRetryCount = Math.max(previousRetry, (_d = writeDraft.provenance.draftRetryCount) !== null && _d !== void 0 ? _d : 0);
            resumeSnapshot = (0, write_draft_util_1.attachWriteDraftToApprovalSnapshot)(Object.assign(Object.assign({}, resumeSnapshot), { draftRetryCount: mergedRetryCount }), Object.assign(Object.assign({}, writeDraft), { provenance: Object.assign(Object.assign({}, writeDraft.provenance), { draftRetryCount: mergedRetryCount, lastEvent: 'suspended' }) }));
            const updated = await this.approvalRequests.updatePendingSnapshot({
                approvalRequestId: input.existingApprovalRequestId,
                approverUserId: input.approverUserId,
                resumeSnapshot,
                previewBlocks,
                summary,
            });
            if (!updated) {
                throw new Error(`failed to refresh approval request ${input.existingApprovalRequestId}`);
            }
            const approval = await this.approvalRequests.findByIdForApprover(input.existingApprovalRequestId, input.approverUserId);
            if (!approval) {
                throw new Error(`approval request not found after refresh: ${input.existingApprovalRequestId}`);
            }
            (_e = input.stepRecorder) === null || _e === void 0 ? void 0 : _e.record({
                type: 'lifecycle',
                name: 'awaiting_approval',
                detail: {
                    approvalRequestId: approval.id,
                    nodeId: input.nodeId,
                    workflowId: input.workflowId,
                    pendingWriteTool: pendingWrite.name,
                    pendingWriteRiskLevel: pendingWrite.riskLevel,
                    writeDraftVersion: writeDraft.version,
                    refreshed: true,
                },
            });
            return approval;
        }
        const approval = await this.approvalRequests.createPending({
            appClientId: input.appClientId,
            source: input.source,
            initiatorUserId: input.initiatorUserId,
            approverUserId: input.approverUserId,
            workflowId: input.workflowId,
            workflowVersion: input.workflowVersion,
            nodeId: input.nodeId,
            title: input.title,
            summary,
            previewBlocks,
            resumeSnapshot,
            pageActionRunId: (_f = input.pageActionRunId) !== null && _f !== void 0 ? _f : null,
            sessionId: (_g = input.sessionId) !== null && _g !== void 0 ? _g : null,
            idempotencyKey: (_h = input.idempotencyKey) !== null && _h !== void 0 ? _h : null,
        });
        (_j = input.stepRecorder) === null || _j === void 0 ? void 0 : _j.record({
            type: 'lifecycle',
            name: 'awaiting_approval',
            detail: {
                approvalRequestId: approval.id,
                nodeId: input.nodeId,
                workflowId: input.workflowId,
                pendingWriteTool: pendingWrite.name,
                pendingWriteRiskLevel: pendingWrite.riskLevel,
                writeDraftVersion: writeDraft.version,
            },
        });
        return approval;
    }
};
ApprovalGateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [approval_request_service_1.ApprovalRequestService])
], ApprovalGateService);
exports.ApprovalGateService = ApprovalGateService;
//# sourceMappingURL=approval-gate.service.js.map