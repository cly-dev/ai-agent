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
        createdAt: Date;
        appClientId: number;
        agentId: number;
        title: string;
        updatedAt: Date;
        isActive: boolean;
        description: string;
        key: string;
        version: number;
        locale: string;
        category: string;
        content: string;
    }>>;
    findOne(id: number): Promise<{
        id: number;
        createdAt: Date;
        appClientId: number;
        agentId: number;
        title: string;
        updatedAt: Date;
        isActive: boolean;
        description: string;
        key: string;
        version: number;
        locale: string;
        category: string;
        content: string;
    }>;
    createVersion(body: CreatePromptTemplateVersionDto): Promise<{
        id: number;
        createdAt: Date;
        appClientId: number;
        agentId: number;
        title: string;
        updatedAt: Date;
        isActive: boolean;
        description: string;
        key: string;
        version: number;
        locale: string;
        category: string;
        content: string;
    }>;
    update(id: number, body: UpdatePromptTemplateDto): Promise<{
        id: number;
        createdAt: Date;
        appClientId: number;
        agentId: number;
        title: string;
        updatedAt: Date;
        isActive: boolean;
        description: string;
        key: string;
        version: number;
        locale: string;
        category: string;
        content: string;
    }>;
    publish(id: number): Promise<{
        id: number;
        createdAt: Date;
        appClientId: number;
        agentId: number;
        title: string;
        updatedAt: Date;
        isActive: boolean;
        description: string;
        key: string;
        version: number;
        locale: string;
        category: string;
        content: string;
    }>;
    remove(id: number): Promise<{
        deleted: {
            id: number;
            createdAt: Date;
            appClientId: number;
            agentId: number;
            title: string;
            updatedAt: Date;
            isActive: boolean;
            description: string;
            key: string;
            version: number;
            locale: string;
            category: string;
            content: string;
        };
    }>;
}
