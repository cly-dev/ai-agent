import { PaginationQueryDto } from '../../../common/pagination';
export declare const PAGE_AGENT_LLM_PROXY_AUDIT_STATUSES: readonly ["running", "success", "failed"];
export type PageAgentLlmProxyAuditStatus = (typeof PAGE_AGENT_LLM_PROXY_AUDIT_STATUSES)[number];
export declare class QueryPageAgentLlmProxyAuditDto extends PaginationQueryDto {
    userId?: number;
    status?: PageAgentLlmProxyAuditStatus;
    modelConfigId?: number;
    upstreamStatus?: number;
}
