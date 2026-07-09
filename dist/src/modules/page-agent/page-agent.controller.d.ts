import type { Request, Response } from 'express';
import { QueryPageAgentLlmProxyAuditDto } from './dto/page-agent-audit.dto';
import { PageAgentProxyService } from './page-agent-proxy.service';
export declare class PageAgentController {
    private readonly service;
    constructor(service: PageAgentProxyService);
    private userId;
    private appClientId;
    chatCompletions(req: Request & {
        user?: {
            userId?: number;
        };
    }, body: Record<string, unknown>, res: Response): Promise<void>;
    findAuditPage(appClientId: number, query: QueryPageAgentLlmProxyAuditDto): Promise<import("../../common/pagination").PaginatedResult<import("./page-agent.types").PageAgentLlmProxyAuditListItem>>;
    findAuditDetail(appClientId: number, id: number): Promise<import("./page-agent.types").PageAgentLlmProxyAuditDetail>;
}
