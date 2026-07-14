import type { Prisma } from '../../../generated/prisma/client';
import type { AutomationTaskDetail, AutomationTaskListItem } from './automation.types';
export declare const AUTOMATION_PAGE_ACTION_RUN_INCLUDE: {
    pageAction: {
        select: {
            actionKey: true;
            name: true;
            workflowId: true;
            workflow: {
                select: {
                    workflowKey: true;
                    name: true;
                };
            };
        };
    };
    approvalRequest: {
        select: {
            id: true;
            status: true;
        };
    };
};
export type AutomationPageActionRunRow = Prisma.PageActionRunGetPayload<{
    include: typeof AUTOMATION_PAGE_ACTION_RUN_INCLUDE;
}>;
export declare function buildAutomationTaskSubtitle(pageContext: unknown): string | null;
export declare function toAutomationTaskFromPageActionRun(row: AutomationPageActionRunRow): AutomationTaskListItem;
export declare function toAutomationTaskDetailFromPageActionRun(row: AutomationPageActionRunRow): AutomationTaskDetail;
export declare function resolvePageActionRunStatusWhere(status?: string): Prisma.PageActionRunWhereInput['status'] | Prisma.EnumPageActionRunStatusFilter | undefined;
