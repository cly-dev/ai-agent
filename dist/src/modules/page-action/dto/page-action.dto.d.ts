import { PageActionDelivery } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
import { AgentChatPageContextDto } from '../../chat/dto/page-context-fields.dto';
export declare class QueryPageActionDto extends PaginationQueryDto {
    appClientId?: number;
    keyword?: string;
    pageScope?: string;
    isActive?: boolean;
}
export declare class CreatePageActionHostToolInlineDto {
    name?: string;
    description?: string;
    fillField?: 'text' | 'content' | 'value';
}
export declare class CreatePageActionDto {
    appClientId: number;
    actionKey: string;
    name: string;
    description?: string;
    hostToolId?: number;
    hostTool?: CreatePageActionHostToolInlineDto;
    pageScope?: string | null;
    systemPrompt: string;
    defaultDelivery?: PageActionDelivery;
    allowCustomInstruction?: boolean;
    isActive?: boolean;
    sortOrder?: number;
    config?: Record<string, unknown>;
    sourceSkillId?: number | null;
    workflowId?: number | null;
    workflowVersion?: number | null;
    workflowOverrides?: Record<string, {
        objective?: string;
    }> | null;
}
export declare class UpdatePageActionDto {
    name?: string;
    description?: string | null;
    hostToolId?: number;
    pageScope?: string | null;
    systemPrompt?: string;
    defaultDelivery?: PageActionDelivery;
    allowCustomInstruction?: boolean;
    isActive?: boolean;
    sortOrder?: number;
    config?: Record<string, unknown> | null;
    workflowId?: number | null;
    workflowVersion?: number | null;
    workflowOverrides?: Record<string, {
        objective?: string;
    }> | null;
}
export declare class InvokePageActionDto {
    actionKey: string;
    pageContext?: AgentChatPageContextDto;
    instruction?: string;
    context?: Record<string, unknown>;
    idempotencyKey?: string;
    clientActionId?: string;
}
export declare class QueryPageActionRunDto extends PaginationQueryDto {
    pageActionId?: number;
    actionKey?: string;
    status?: 'running' | 'awaiting_approval' | 'completed' | 'failed' | 'cancelled';
    userId?: number;
    clientActionId?: string;
}
