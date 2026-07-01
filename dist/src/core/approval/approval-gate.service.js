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
let ApprovalGateService = class ApprovalGateService {
    constructor(approvalRequests) {
        this.approvalRequests = approvalRequests;
    }
    async suspend(input) {
        var _a, _b, _c, _d, _e, _f;
        const resumeSnapshot = {
            version: 1,
            workflowRun: input.workflowRun,
            workflowNodeDefs: input.workflowNodeDefs,
            workflowNodeOutputs: input.workflowNodeOutputs,
            pendingWrite: input.pendingWrite,
            scopedToolIds: input.scopedToolIds,
            pageContext: (_a = input.pageContext) !== null && _a !== void 0 ? _a : null,
            channel: input.channel,
        };
        const approval = await this.approvalRequests.createPending({
            appClientId: input.appClientId,
            source: input.source,
            initiatorUserId: input.initiatorUserId,
            approverUserId: input.approverUserId,
            workflowId: input.workflowId,
            workflowVersion: input.workflowVersion,
            nodeId: input.nodeId,
            title: input.title,
            summary: (_b = input.summary) !== null && _b !== void 0 ? _b : null,
            previewBlocks: input.previewBlocks,
            resumeSnapshot,
            pageActionRunId: (_c = input.pageActionRunId) !== null && _c !== void 0 ? _c : null,
            sessionId: (_d = input.sessionId) !== null && _d !== void 0 ? _d : null,
            idempotencyKey: (_e = input.idempotencyKey) !== null && _e !== void 0 ? _e : null,
        });
        (_f = input.stepRecorder) === null || _f === void 0 ? void 0 : _f.record({
            type: 'lifecycle',
            name: 'awaiting_approval',
            detail: {
                approvalRequestId: approval.id,
                nodeId: input.nodeId,
                workflowId: input.workflowId,
                pendingWriteTool: input.pendingWrite.name,
                pendingWriteRiskLevel: input.pendingWrite.riskLevel,
            },
        });
        return approval;
    }
    buildPendingWriteFromTool(input) {
        return {
            name: input.name.trim(),
            arguments: input.arguments,
            riskLevel: input.riskLevel,
        };
    }
};
ApprovalGateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [approval_request_service_1.ApprovalRequestService])
], ApprovalGateService);
exports.ApprovalGateService = ApprovalGateService;
//# sourceMappingURL=approval-gate.service.js.map