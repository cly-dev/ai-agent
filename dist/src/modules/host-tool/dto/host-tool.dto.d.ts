import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
export declare class QueryHostPageDto extends PaginationQueryDto {
    id?: number;
    keyword?: string;
    scope?: string;
    isActive?: boolean;
}
export declare class CreateHostToolDto {
    appClientId: number;
    hostPageId?: number | null;
    definitionKey: string;
    name: string;
    description: string;
    argsSchema: Record<string, unknown>;
    argsTemplate?: Record<string, unknown> | null;
    sortOrder?: number;
    isActive?: boolean;
    config?: Record<string, unknown> | null;
}
export declare class UpdateHostToolDto {
    hostPageId?: number | null;
    definitionKey?: string;
    name?: string;
    description?: string;
    argsSchema?: Record<string, unknown>;
    argsTemplate?: Record<string, unknown> | null;
    sortOrder?: number;
    isActive?: boolean;
    config?: Record<string, unknown> | null;
}
export declare class QueryHostToolDto extends PaginationQueryDto {
    id?: number;
    keyword?: string;
    scope?: string;
    genericOnly?: boolean;
    isActive?: boolean;
}
export declare class QueryClientHostToolDto {
    scope?: string;
    agentId?: number;
}
export declare class ClientHostToolRegisterItemDto {
    name: string;
    description: string;
    argsSchema: Record<string, unknown>;
    definitionKey?: string;
    generic?: boolean;
    scope?: string;
    argsTemplate?: Record<string, unknown>;
}
export declare class RegisterClientHostToolsDto {
    scope?: string;
    pageLabel?: string;
    routePattern?: string;
    tools: ClientHostToolRegisterItemDto[];
}
