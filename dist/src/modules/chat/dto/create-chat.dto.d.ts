import { PageContextMessageFieldsDto } from './page-context-fields.dto';
export declare class CreateChatDto extends PageContextMessageFieldsDto {
    title?: string;
    agentId?: number;
    role: string;
    content: string;
    toolName?: string | null;
    toolInput?: Record<string, unknown>;
    toolOutput?: Record<string, unknown>;
    skillId?: number;
}
