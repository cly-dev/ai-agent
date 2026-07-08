import type { Request, Response } from 'express';
import { QueryAutomationTaskDto } from '../../automation/dto/query-automation-task.dto';
import { InvokePageActionDto } from '../dto/page-action.dto';
import { PageActionCEndService } from './page-action-c-end.service';
export declare class PageActionCEndController {
    private readonly cEndService;
    constructor(cEndService: PageActionCEndService);
    private appClientId;
    private userId;
    invoke(req: Request & {
        user?: {
            userId?: number;
        };
    }, body: InvokePageActionDto): Promise<import("../../../core/page-action/execution/page-action-invoke.types").PageActionInvokeAccepted>;
    streamRun(req: Request & {
        user?: {
            userId?: number;
        };
    }, id: number, res: Response): Promise<void>;
    listRuns(req: Request & {
        user?: {
            userId?: number;
        };
    }, query: QueryAutomationTaskDto): Promise<{
        items: import("../../automation/automation.types").AutomationTaskListItem[];
        total: number;
    }>;
}
