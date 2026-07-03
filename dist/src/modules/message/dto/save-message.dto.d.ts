import { PageContextMessageFieldsDto } from '../../chat/dto/page-context-fields.dto';
import { DraftReviewDecisionDto } from './draft-review-decision.dto';
export declare class SaveMessageDto extends PageContextMessageFieldsDto {
    agentId?: number;
    role: string;
    content: string;
    turnId?: number;
    toolName?: string | null;
    toolInput?: Record<string, unknown>;
    toolOutput?: Record<string, unknown>;
    writeGate?: DraftReviewDecisionDto;
    confirmWrite?: boolean;
    cancelWrite?: boolean;
    skillId?: number;
}
