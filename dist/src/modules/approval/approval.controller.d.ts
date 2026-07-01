import type { Request } from 'express';
import { ApprovalRequestService } from '../../core/approval/approval-request.service';
import { ApprovalResumeService } from '../../core/approval/approval-resume.service';
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
            previewBlocks: import("@prisma/client/runtime/client").JsonValue;
            pendingWrite: {
                tool: string;
                riskLevel: string;
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
        previewBlocks: import("@prisma/client/runtime/client").JsonValue;
        pendingWrite: {
            tool: string;
            riskLevel: string;
        };
    }>;
    confirm(req: AuthedRequest, id: number): Promise<{
        resumed: boolean;
    }>;
    reject(req: AuthedRequest, id: number, body: {
        reason?: string;
    }): Promise<{
        ok: boolean;
    }>;
    private extractPendingWritePreview;
}
export {};
