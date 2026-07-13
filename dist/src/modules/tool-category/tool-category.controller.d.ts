import { ToolCategoryService } from './tool-category.service';
import { CreateToolCategoryDto } from './dto/create-tool-category.dto';
import { QueryToolCategoryDto } from './dto/query-tool-category.dto';
import { UpdateToolCategoryDto } from './dto/update-tool-category.dto';
export declare class ToolCategoryController {
    private readonly service;
    constructor(service: ToolCategoryService);
    create(body: CreateToolCategoryDto): Promise<import("./tool-category.types").ToolCategoryResponse>;
    findPage(query: QueryToolCategoryDto): Promise<import("../../common/pagination").PaginatedResult<import("./tool-category.types").ToolCategoryResponse>>;
    findOne(id: number): Promise<import("./tool-category.types").ToolCategoryResponse>;
    update(id: number, body: UpdateToolCategoryDto): Promise<import("./tool-category.types").ToolCategoryResponse>;
    remove(id: number): Promise<import("./tool-category.types").ToolCategoryResponse>;
}
