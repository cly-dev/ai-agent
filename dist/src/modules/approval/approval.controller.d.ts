import type { Request } from 'express';
import { ApprovalRequestService } from '../../core/approval/approval-request.service';
import { ApprovalResumeService } from '../../core/approval/approval-resume.service';
import { ApprovalDecideDto } from './dto/approval-decide.dto';
import { QueryApprovalInboxDto } from './dto/query-approval-inbox.dto';
type AuthedRequest = Request & {
    user: {
        userId: number;
    };
    appClient: {
        id: number;
    };
};
export declare class ApprovalController {
    private readonly approvalRequests;
    private readonly approvalResume;
    constructor(approvalRequests: ApprovalRequestService, approvalResume: ApprovalResumeService);
    private userId;
    listInbox(req: AuthedRequest, query: QueryApprovalInboxDto): Promise<{
        items: {
            id: number;
            source: import("../../../generated/prisma/enums").ApprovalSource;
            status: import("../../../generated/prisma/enums").ApprovalStatus;
            title: string;
            summary: string;
            workflowId: number;
            workflowVersion: number;
            flowId: number;
            flowVersion: number;
            workflowKey: string;
            workflowName: string;
            flowKey: string;
            flowName: string;
            nodeId: string;
            sessionId: string;
            pageActionRunId: number;
            initiator: {
                id: number;
                username: string;
                employeeId: string;
            };
            createdAt: Date;
            decidedAt: Date;
            writeDraft: import("../../core/draft-review").WriteDraftPublic;
            editPolicy: import("../../core/draft-review").WriteDraftEditPolicy;
            previewBlocks: import("@prisma/client/runtime/client").JsonValue;
            pendingWrite: {
                tool: string;
                riskLevel: string;
            };
            draftReview: {
                retryCount: number;
                retryMax: number;
                canRetry: boolean;
            };
            entityReference: import("../../core/approval/build-approval-entity-reference.util").ApprovalEntityReference;
        }[];
    }>;
    getOne(req: AuthedRequest, id: number): Promise<{
        id: number;
        source: import("../../../generated/prisma/enums").ApprovalSource;
        status: import("../../../generated/prisma/enums").ApprovalStatus;
        title: string;
        summary: string;
        workflowId: number;
        workflowVersion: number;
        flowId: number;
        flowVersion: number;
        workflowKey: string;
        workflowName: string;
        flowKey: string;
        flowName: string;
        nodeId: string;
        sessionId: string;
        pageActionRunId: number;
        initiator: {
            id: number;
            username: string;
            employeeId: string;
        };
        createdAt: Date;
        decidedAt: Date;
        writeDraft: import("../../core/draft-review").WriteDraftPublic;
        editPolicy: import("../../core/draft-review").WriteDraftEditPolicy;
        previewBlocks: import("@prisma/client/runtime/client").JsonValue;
        pendingWrite: {
            tool: string;
            riskLevel: string;
        };
        draftReview: {
            retryCount: number;
            retryMax: number;
            canRetry: boolean;
        };
        entityReference: import("../../core/approval/build-approval-entity-reference.util").ApprovalEntityReference;
    }>;
    decide(req: AuthedRequest, id: number, body: ApprovalDecideDto): Promise<{
        resumed: boolean;
        suspended?: boolean;
    }>;
    confirm(req: AuthedRequest, id: number): Promise<{
        resumed: boolean;
        suspended?: boolean;
    }>;
    reject(req: AuthedRequest, id: number, body: {
        reason?: string;
    }): Promise<{
        ok: boolean;
    }>;
    private toInboxItem;
    private extractDraftReviewBudget;
}
export {};
