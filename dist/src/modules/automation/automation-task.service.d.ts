import type { AutomationTaskDetail, AutomationTaskListFilter, AutomationTaskListItem } from './automation.types';
import { PageActionRunTaskProvider } from './providers/page-action-run-task.provider';
export declare class AutomationTaskService {
    private readonly providers;
    constructor(pageActionRunTaskProvider: PageActionRunTaskProvider);
    list(filter: AutomationTaskListFilter): Promise<{
        items: AutomationTaskListItem[];
        total: number;
    }>;
    getDetail(input: {
        kind: 'page_action_run' | 'webhook_approval';
        id: number;
        appClientId: number;
        userId: number;
    }): Promise<AutomationTaskDetail>;
}
