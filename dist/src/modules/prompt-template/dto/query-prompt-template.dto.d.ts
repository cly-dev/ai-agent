import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
export declare class QueryPromptTemplateDto extends PaginationQueryDto {
    key?: string;
    appClientId?: number;
    agentId?: number;
    locale?: string;
    isActive?: boolean;
}
