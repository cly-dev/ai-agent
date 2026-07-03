import type { Request } from 'express';
import { ApprovalRequestService } from '../../core/approval/approval-request.service';
import { ApprovalResumeService } from '../../core/approval/approval-resume.service';
import { ApprovalDecideDto } from './dto/approval-decide.dto';
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
    listInbox(req: AuthedRequest, limit?: string, offset?: string): Promise<{
        items: {
            id: number;
            source: import("../../../generated/prisma/enums").ApprovalSource;
            status: import("../../../generated/prisma/enums").ApprovalStatus;
            title: string;
            summary: string;
            workflowId: number;
            workflowVersion: number;
            workflowKey: string;
            workflowName: string;
            nodeId: string;
            sessionId: string;
            pageActionRunId: number;
            initiator: {
                id: number;
                username: string;
                employeeId: string;
            };
            createdAt: Date;
            writeDraft: import("../../core/draft-review").WriteDraftPublic;
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
        nodeId: string;
        sessionId: string;
        pageActionRunId: number;
        createdAt: Date;
        decidedAt: Date;
        writeDraft: import("../../core/draft-review").WriteDraftPublic;
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
    private extractDraftReviewBudget;
}
export {};
