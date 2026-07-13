import { PrismaService } from '../../../prisma/prisma.service';
import type { AutomationTaskDetail, AutomationTaskListFilter, AutomationTaskListItem } from '../automation.types';
import type { AutomationTaskSourceProvider } from './automation-task-source.provider';
export declare class PageActionRunTaskProvider implements AutomationTaskSourceProvider {
    private readonly prisma;
    readonly triggerSource: "page_action";
    constructor(prisma: PrismaService);
    list(filter: AutomationTaskListFilter): Promise<{
        items: AutomationTaskListItem[];
        total: number;
    }>;
    getDetail(input: {
        id: number;
        appClientId: number;
        userId: number;
    }): Promise<AutomationTaskDetail | null>;
}
