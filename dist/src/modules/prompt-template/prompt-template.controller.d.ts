import { CreatePromptTemplateVersionDto } from './dto/create-prompt-template-version.dto';
import { QueryPromptTemplateDto } from './dto/query-prompt-template.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';
import { PromptTemplateService } from './prompt-template.service';
export declare class PromptTemplateController {
    private readonly service;
    constructor(service: PromptTemplateService);
    listCreatableKeys(): {
        keys: import("../../core/prompt").PromptTemplateCatalogItem[];
    };
    findPage(query: QueryPromptTemplateDto): Promise<import("../../common/pagination").PaginatedResult<{
        id: number;
        key: string;
        version: number;
        appClientId: number;
        agentId: number;
        locale: string;
        category: string;
        title: string;
        description: string;
        content: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    findOne(id: number): Promise<{
        id: number;
        key: string;
        version: number;
        appClientId: number;
        agentId: number;
        locale: string;
        category: string;
        title: string;
        description: string;
        content: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createVersion(body: CreatePromptTemplateVersionDto): Promise<{
        id: number;
        key: string;
        version: number;
        appClientId: number;
        agentId: number;
        locale: string;
        category: string;
        title: string;
        description: string;
        content: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: number, body: UpdatePromptTemplateDto): Promise<{
        id: number;
        key: string;
        version: number;
        appClientId: number;
        agentId: number;
        locale: string;
        category: string;
        title: string;
        description: string;
        content: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    publish(id: number): Promise<{
        id: number;
        key: string;
        version: number;
        appClientId: number;
        agentId: number;
        locale: string;
        category: string;
        title: string;
        description: string;
        content: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: number): Promise<{
        deleted: {
            id: number;
            key: string;
            version: number;
            appClientId: number;
            agentId: number;
            locale: string;
            category: string;
            title: string;
            description: string;
            content: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
