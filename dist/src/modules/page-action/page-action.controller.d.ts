import type { Request, Response } from 'express';
import { CreatePageActionDto, InvokePageActionDto, QueryPageActionDto, QueryPageActionRunDto, QueryPageScopeOptionsDto, UpdatePageActionDto } from './dto/page-action.dto';
import { PageActionService } from './page-action.service';
export declare class PageActionController {
    private readonly service;
    constructor(service: PageActionService);
    private appClientId;
    private userId;
    create(body: CreatePageActionDto): Promise<import("./page-action.types").PageActionResponse>;
    update(id: number, body: UpdatePageActionDto): Promise<import("./page-action.types").PageActionResponse>;
    findOne(id: number): Promise<import("./page-action.types").PageActionResponse>;
    findPage(appClientId: number, query: QueryPageActionDto): Promise<import("../../common/pagination").PaginatedResult<import("./page-action.types").PageActionResponse>>;
    listPageScopes(appClientId: number, query: QueryPageScopeOptionsDto): Promise<import("./page-action.types").PageScopeOption[]>;
    findRunPageAdmin(appClientId: number, query: QueryPageActionRunDto): Promise<import("../../common/pagination").PaginatedResult<import("./page-action.types").PageActionRunAdminListItem>>;
    findRunAdminById(id: number): Promise<import("./page-action.types").PageActionRunAdminDetail>;
    findRunAdmin(id: number): Promise<import("./page-action.types").PageActionRunAdminDetail>;
    invoke(req: Request & {
        user?: {
            userId?: number;
        };
    }, body: InvokePageActionDto, res: Response): Promise<void>;
}
