import { type PaginatedResult } from '../../common/pagination';
import { RuntimeCacheInvalidator } from '../../core/runtime-cache/runtime-cache-invalidator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateToolCategoryDto } from './dto/create-tool-category.dto';
import { QueryToolCategoryDto } from './dto/query-tool-category.dto';
import { UpdateToolCategoryDto } from './dto/update-tool-category.dto';
import { type ToolCategoryResponse } from './tool-category.types';
export declare class ToolCategoryService {
    private readonly prisma;
    private readonly runtimeCacheInvalidator;
    constructor(prisma: PrismaService, runtimeCacheInvalidator: RuntimeCacheInvalidator);
    create(dto: CreateToolCategoryDto): Promise<ToolCategoryResponse>;
    findPage(query: QueryToolCategoryDto): Promise<PaginatedResult<ToolCategoryResponse>>;
    findOne(id: number): Promise<ToolCategoryResponse>;
    update(id: number, dto: UpdateToolCategoryDto): Promise<ToolCategoryResponse>;
    remove(id: number): Promise<ToolCategoryResponse>;
    private buildWhere;
    private buildOrderBy;
    private normalizeOptionalText;
}
