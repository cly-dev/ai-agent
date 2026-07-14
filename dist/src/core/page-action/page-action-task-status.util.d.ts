import type { PageActionRunStatus } from '../../../generated/prisma/client';
export type PageActionTaskStatus = 'running' | 'awaiting_approval' | 'completed' | 'failed' | 'cancelled';
export declare function mapPageActionRunStatusToTaskStatus(status: PageActionRunStatus): PageActionTaskStatus;
export declare function resolvePageActionRunOutcome(input: {
    status: PageActionRunStatus;
    errorCode?: string | null;
}): {
    taskStatus: PageActionTaskStatus;
    succeeded: boolean;
};
