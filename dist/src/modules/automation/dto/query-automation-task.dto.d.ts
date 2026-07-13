import { type AutomationTaskStatusFilter, type AutomationTriggerSourceFilter } from '../automation.types';
export declare class QueryAutomationTaskDto {
    status?: AutomationTaskStatusFilter;
    triggerSource?: AutomationTriggerSourceFilter;
    actionKey?: string;
    workflowKey?: string;
    limit?: number;
    offset?: number;
}
