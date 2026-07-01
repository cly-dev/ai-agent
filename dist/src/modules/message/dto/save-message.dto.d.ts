import { PageContextMessageFieldsDto } from '../../chat/dto/page-context-fields.dto';
export declare class SaveMessageDto extends PageContextMessageFieldsDto {
    agentId?: number;
    role: string;
    content: string;
    turnId?: number;
    toolName?: string | null;
    toolInput?: Record<string, unknown>;
    toolOutput?: Record<string, unknown>;
    confirmWrite?: boolean;
    cancelWrite?: boolean;
    skillId?: number;
}
