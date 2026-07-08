import type { Request } from 'express';
import { AutomationTaskService } from './automation-task.service';
import { QueryAutomationTaskDto } from './dto/query-automation-task.dto';
type AuthedRequest = Request & {
    user: {
        userId: number;
    };
    appClient: {
        id: number;
    };
};
export declare class AutomationController {
    private readonly automationTasks;
    constructor(automationTasks: AutomationTaskService);
    listTasks(req: AuthedRequest, query: QueryAutomationTaskDto): Promise<{
        items: import("./automation.types").AutomationTaskListItem[];
        total: number;
    }>;
    getPageActionRunTask(req: AuthedRequest, id: number): Promise<import("./automation.types").AutomationTaskDetail>;
}
export {};
