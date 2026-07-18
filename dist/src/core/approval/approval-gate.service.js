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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
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
            version: 2,
            workflowRun: input.workflowRun,
            workflowNodeOutputs: input.workflowNodeOutputs,
            pendingWrite,
            writeDraft,
            scopedToolIds: input.scopedToolIds,
            pageContext: (_d = input.pageContext) !== null && _d !== void 0 ? _d : null,
            channel: input.channel,
            draftRetryCount: writeDraft.provenance.draftRetryCount,
            flow: {
                id: input.flowId,
                version: (_e = input.flowVersion) !== null && _e !== void 0 ? _e : input.workflowRun.version,
            },
            suspended: {
                irNodeId: (_g = (_f = input.workflowRun.nodes.find((n) => n.nodeId === input.nodeId)) === null || _f === void 0 ? void 0 : _f.irNodeId) !== null && _g !== void 0 ? _g : input.nodeId,
                phase: (_j = (_h = input.workflowRun.nodes.find((n) => n.nodeId === input.nodeId)) === null || _h === void 0 ? void 0 : _h.phase) !== null && _j !== void 0 ? _j : null,
            },
            workflowNodeDefs: input.workflowNodeDefs,
        };
        if (input.existingApprovalRequestId != null) {
            const previousRetry = (_k = previousSnapshot === null || previousSnapshot === void 0 ? void 0 : previousSnapshot.draftRetryCount) !== null && _k !== void 0 ? _k : 0;
            const mergedRetryCount = Math.max(previousRetry, (_l = writeDraft.provenance.draftRetryCount) !== null && _l !== void 0 ? _l : 0);
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
            (_m = input.stepRecorder) === null || _m === void 0 ? void 0 : _m.record({
                type: 'lifecycle',
                name: 'awaiting_approval',
                detail: Object.assign({ approvalRequestId: approval.id, nodeId: input.nodeId, flowId: input.flowId, refreshed: true }, (0, page_action_run_audit_util_1.buildWriteDraftStepDetail)(writeDraft)),
            });
            return approval;
        }
        const approval = await this.approvalRequests.createPending({
            appClientId: input.appClientId,
            source: input.source,
            initiatorUserId: input.initiatorUserId,
            approverUserId: input.approverUserId,
            flowId: input.flowId,
            flowVersion: (_o = input.flowVersion) !== null && _o !== void 0 ? _o : null,
            nodeId: input.nodeId,
            title: input.title,
            summary,
            previewBlocks,
            resumeSnapshot,
            pageActionRunId: (_p = input.pageActionRunId) !== null && _p !== void 0 ? _p : null,
            sessionId: (_q = input.sessionId) !== null && _q !== void 0 ? _q : null,
            idempotencyKey: (_r = input.idempotencyKey) !== null && _r !== void 0 ? _r : null,
        });
        (_s = input.stepRecorder) === null || _s === void 0 ? void 0 : _s.record({
            type: 'lifecycle',
            name: 'awaiting_approval',
            detail: Object.assign({ approvalRequestId: approval.id, nodeId: input.nodeId, flowId: input.flowId }, (0, page_action_run_audit_util_1.buildWriteDraftStepDetail)(writeDraft)),
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