import { CreatePageActionDto, QueryPageActionDto, QueryPageActionRunDto, QueryPageScopeOptionsDto, UpdatePageActionDto } from './dto/page-action.dto';
import { PageActionService } from './page-action.service';
export declare class PageActionController {
    private readonly service;
    constructor(service: PageActionService);
    create(body: CreatePageActionDto): Promise<import("./page-action.types").PageActionResponse>;
    update(id: number, body: UpdatePageActionDto): Promise<import("./page-action.types").PageActionResponse>;
    remove(id: number): Promise<{
        ok: true;
        id: number;
    }>;
    findOne(id: number): Promise<import("./page-action.types").PageActionResponse>;
    findPage(appClientId: number, query: QueryPageActionDto): Promise<import("../../common/pagination").PaginatedResult<import("./page-action.types").PageActionResponse>>;
    listPageScopes(appClientId: number, query: QueryPageScopeOptionsDto): Promise<import("./page-action.types").PageScopeOption[]>;
    findRunPageAdmin(appClientId: number, query: QueryPageActionRunDto): Promise<import("../../common/pagination").PaginatedResult<import("./page-action.types").PageActionRunAdminListItem>>;
    findRunAdminById(id: number): Promise<import("./page-action.types").PageActionRunAdminDetail>;
    findRunAdmin(id: number): Promise<import("./page-action.types").PageActionRunAdminDetail>;
}
