import type { Response } from 'express';
import { PageActionRunExecutor } from '../../../core/page-action/execution/page-action-run.executor';
import type { PageActionInvokeAccepted } from '../../../core/page-action/execution/page-action-invoke.types';
import { PageActionRunStreamHub } from '../../../core/page-action/stream/page-action-run-stream.hub';
import { PrismaService } from '../../../prisma/prisma.service';
import type { InvokePageActionDto } from '../dto/page-action.dto';
import { AutomationTaskService } from '../../automation/automation-task.service';
import type { QueryAutomationTaskDto } from '../../automation/dto/query-automation-task.dto';
export declare class PageActionCEndService {
    private readonly prisma;
    private readonly runExecutor;
    private readonly runStreamHub;
    private readonly automationTasks;
    constructor(prisma: PrismaService, runExecutor: PageActionRunExecutor, runStreamHub: PageActionRunStreamHub, automationTasks: AutomationTaskService);
    invoke(userId: number, appClientId: number, dto: InvokePageActionDto): Promise<PageActionInvokeAccepted>;
    subscribeRunStream(userId: number, appClientId: number, runId: number, res: Response): Promise<void>;
    listRuns(userId: number, appClientId: number, query: QueryAutomationTaskDto): Promise<{
        items: import("../../automation/automation.types").AutomationTaskListItem[];
        total: number;
    }>;
    private findActiveRunByPageActionKey;
    private throwPageActionAlreadyActive;
    private toInvokeAccepted;
}
