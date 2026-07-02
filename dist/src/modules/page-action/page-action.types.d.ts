import type { Prisma } from '../../../generated/prisma/client';
import type { PageActionRunStep } from '../../core/page-action/page-action-run-steps.util';
export declare const PAGE_ACTION_DETAIL_INCLUDE: {
    appClient: {
        select: {
            id: true;
            name: true;
            dsn: true;
        };
    };
    hostTool: {
        include: {
            appClient: {
                select: {
                    id: true;
                    name: true;
                    dsn: true;
                };
            };
            hostPage: {
                select: {
                    id: true;
                    scope: true;
                    label: true;
                };
            };
        };
    };
};
export declare const PAGE_ACTION_RUN_ADMIN_INCLUDE: {
    pageAction: {
        select: {
            id: true;
            actionKey: true;
            name: true;
        };
    };
    user: {
        select: {
            id: true;
            username: true;
            email: true;
        };
    };
};
export type PageActionDetailRow = Prisma.PageActionGetPayload<{
    include: typeof PAGE_ACTION_DETAIL_INCLUDE;
}>;
export type PageActionRunAdminRow = Prisma.PageActionRunGetPayload<{
    include: typeof PAGE_ACTION_RUN_ADMIN_INCLUDE;
}>;
export type PageActionResponse = {
    id: number;
    appClientId: number;
    appClientName?: string;
    actionKey: string;
    name: string;
    description: string | null;
    hostToolId: number | null;
    hostToolName: string | null;
    pageScope: string | null;
    systemPrompt: string;
    defaultDelivery: string;
    allowCustomInstruction: boolean;
    isActive: boolean;
    sortOrder: number;
    config: unknown | null;
    sourceSkillId: number | null;
    workflowId: number | null;
    workflowVersion: number | null;
    workflowOverrides: unknown | null;
    createdAt: Date;
    updatedAt: Date;
};
export type PageActionRunAdminListItem = {
    id: number;
    pageActionId: number;
    actionKey: string;
    pageActionName: string;
    userId: number;
    username: string | null;
    userEmail: string | null;
    status: string;
    generation: number;
    dslOutcome: string | null;
    errorCode: string | null;
    streamId: string | null;
    clientActionId: string | null;
    model: string | null;
    durationMs: number | null;
    stepCount: number;
    createdAt: Date;
    finishedAt: Date | null;
};
export type PageActionRunAdminDetail = PageActionRunAdminListItem & {
    delivery: string;
    instruction: string | null;
    context: unknown | null;
    pageContext: unknown | null;
    fillText: string | null;
    errorMessage: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    idempotencyKey: string | null;
    workflowId: number | null;
    workflowVersion: number | null;
    workflowRun: unknown | null;
    steps: PageActionRunStep[];
};
