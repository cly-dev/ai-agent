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
const page_action_run_audit_util_1 = require("../page-action/page-action-run-audit.util");
let ApprovalGateService = class ApprovalGateService {
    constructor(approvalRequests) {
        this.approvalRequests = approvalRequests;
    }
    async suspend(input) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const isRefresh = input.existingApprovalRequestId != null;
        let previousSnapshot = null;
        if (isRefresh) {
            const existing = await this.approvalRequests.findByIdForApprover(input.existingApprovalRequestId, input.approverUserId);
            previousSnapshot = existing
                ? this.approvalRequests.parseResumeSnapshot(existing)
                : null;
        }
        const writeDraft = (0, write_draft_util_1.syncWriteDraftPresentation)(Object.assign(Object.assign({}, input.writeDraft), { version: isRefresh
                ? ((_b = (_a = previousSnapshot === null || previousSnapshot === void 0 ? void 0 : previousSnapshot.writeDraft) === null || _a === void 0 ? void 0 : _a.version) !== null && _b !== void 0 ? _b : input.writeDraft.version) + 1
                : input.writeDraft.version, provenance: Object.assign(Object.assign({}, input.writeDraft.provenance), { lastEvent: isRefresh ? 'retry' : 'suspended' }) }));
        const pendingWrite = (0, write_draft_util_1.writeDraftToPendingWrite)(writeDraft);
        const previewBlocks = writeDraft.presentation.previewBlocks;
        const summary = (_c = writeDraft.presentation.summaryText) !== null && _c !== void 0 ? _c : null;
        let resumeSnapshot = {
            version: 1,
            workflowRun: input.workflowRun,
            workflowNodeDefs: input.workflowNodeDefs,
            workflowNodeOutputs: input.workflowNodeOutputs,
            pendingWrite,
            writeDraft,
            scopedToolIds: input.scopedToolIds,
            pageContext: (_d = input.pageContext) !== null && _d !== void 0 ? _d : null,
            channel: input.channel,
            draftRetryCount: writeDraft.provenance.draftRetryCount,
        };
        if (input.existingApprovalRequestId != null) {
            const previousRetry = (_e = previousSnapshot === null || previousSnapshot === void 0 ? void 0 : previousSnapshot.draftRetryCount) !== null && _e !== void 0 ? _e : 0;
            const mergedRetryCount = Math.max(previousRetry, (_f = writeDraft.provenance.draftRetryCount) !== null && _f !== void 0 ? _f : 0);
            resumeSnapshot = (0, write_draft_util_1.attachWriteDraftToApprovalSnapshot)(Object.assign(Object.assign({}, resumeSnapshot), { draftRetryCount: mergedRetryCount }), Object.assign(Object.assign({}, writeDraft), { provenance: Object.assign(Object.assign({}, writeDraft.provenance), { draftRetryCount: mergedRetryCount, lastEvent: 'retry' }) }));
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
            (_g = input.stepRecorder) === null || _g === void 0 ? void 0 : _g.record({
                type: 'lifecycle',
                name: 'awaiting_approval',
                detail: Object.assign({ approvalRequestId: approval.id, nodeId: input.nodeId, workflowId: input.workflowId, refreshed: true }, (0, page_action_run_audit_util_1.buildWriteDraftStepDetail)(writeDraft)),
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
            pageActionRunId: (_h = input.pageActionRunId) !== null && _h !== void 0 ? _h : null,
            sessionId: (_j = input.sessionId) !== null && _j !== void 0 ? _j : null,
            idempotencyKey: (_k = input.idempotencyKey) !== null && _k !== void 0 ? _k : null,
        });
        (_l = input.stepRecorder) === null || _l === void 0 ? void 0 : _l.record({
            type: 'lifecycle',
            name: 'awaiting_approval',
            detail: Object.assign({ approvalRequestId: approval.id, nodeId: input.nodeId, workflowId: input.workflowId }, (0, page_action_run_audit_util_1.buildWriteDraftStepDetail)(writeDraft)),
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