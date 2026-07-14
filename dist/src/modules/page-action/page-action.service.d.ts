import { type PaginatedResult } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreatePageActionDto, QueryPageActionDto, QueryPageActionRunDto, QueryPageScopeOptionsDto, UpdatePageActionDto } from './dto/page-action.dto';
import type { PageActionResponse, PageActionRunAdminDetail, PageActionRunAdminListItem, PageScopeOption } from './page-action.types';
import { WorkflowService } from '../workflow/workflow.service';
export declare class PageActionService {
    private readonly prisma;
    private readonly workflowService;
    constructor(prisma: PrismaService, workflowService: WorkflowService);
    create(dto: CreatePageActionDto): Promise<PageActionResponse>;
    update(id: number, dto: UpdatePageActionDto): Promise<PageActionResponse>;
    findOne(id: number): Promise<PageActionResponse>;
    remove(id: number): Promise<{
        ok: true;
        id: number;
    }>;
    listPageScopes(appClientId: number, query?: QueryPageScopeOptionsDto): Promise<PageScopeOption[]>;
    findPage(query: QueryPageActionDto): Promise<PaginatedResult<PageActionResponse>>;
    findRunAdmin(id: number): Promise<PageActionRunAdminDetail>;
    findRunPageAdmin(appClientId: number, query: QueryPageActionRunDto): Promise<PaginatedResult<PageActionRunAdminListItem>>;
    private assertInlineStreamOnly;
    private findEntityOrThrow;
    private assertAppClientExists;
    private assertHostToolForApp;
}
