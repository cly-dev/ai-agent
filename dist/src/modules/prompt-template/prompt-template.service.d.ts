import type { PromptTemplate } from '../../../generated/prisma/client';
import { type PaginatedResult } from '../../common/pagination';
import { PromptRegistryService } from '../../core/prompt/prompt-registry.service';
import type { PromptResolveScope } from '../../core/prompt/prompt-registry.types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromptTemplateVersionDto } from './dto/create-prompt-template-version.dto';
import { QueryPromptTemplateDto } from './dto/query-prompt-template.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';
export declare class PromptTemplateService {
    private readonly prisma;
    private readonly promptRegistry;
    constructor(prisma: PrismaService, promptRegistry: PromptRegistryService);
    listCreatableKeys(): {
        keys: import("../../core/prompt/prompt-template.catalog").PromptTemplateCatalogItem[];
    };
    findPage(query: QueryPromptTemplateDto): Promise<PaginatedResult<PromptTemplate>>;
    findOne(id: number): Promise<PromptTemplate>;
    createVersion(dto: CreatePromptTemplateVersionDto): Promise<PromptTemplate>;
    update(id: number, dto: UpdatePromptTemplateDto): Promise<PromptTemplate>;
    remove(id: number): Promise<{
        deleted: PromptTemplate;
    }>;
    publish(id: number): Promise<PromptTemplate>;
    previewResolve(key: string, scope: PromptResolveScope, variables?: Record<string, string | number | boolean | undefined>): Promise<{
        content: string;
        resolved: Awaited<ReturnType<PromptRegistryService['resolve']>>;
    }>;
    private scopeWhere;
    private buildWhere;
    private assertAppClientExists;
    private assertAgentExists;
}
