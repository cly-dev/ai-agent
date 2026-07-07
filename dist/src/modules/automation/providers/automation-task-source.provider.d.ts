import type { AutomationTaskListFilter, AutomationTaskListItem, AutomationTaskDetail } from '../automation.types';
export interface AutomationTaskSourceProvider {
    readonly triggerSource: 'page_action' | 'webhook';
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
