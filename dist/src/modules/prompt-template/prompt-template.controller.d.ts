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
        description: string;
        isActive: boolean;
        updatedAt: Date;
        appClientId: number;
        agentId: number;
        title: string;
        content: string;
        key: string;
        version: number;
        locale: string;
        category: string;
    }>>;
    findOne(id: number): Promise<{
        id: number;
        createdAt: Date;
        description: string;
        isActive: boolean;
        updatedAt: Date;
        appClientId: number;
        agentId: number;
        title: string;
        content: string;
        key: string;
        version: number;
        locale: string;
        category: string;
    }>;
    createVersion(body: CreatePromptTemplateVersionDto): Promise<{
        id: number;
        createdAt: Date;
        description: string;
        isActive: boolean;
        updatedAt: Date;
        appClientId: number;
        agentId: number;
        title: string;
        content: string;
        key: string;
        version: number;
        locale: string;
        category: string;
    }>;
    update(id: number, body: UpdatePromptTemplateDto): Promise<{
        id: number;
        createdAt: Date;
        description: string;
        isActive: boolean;
        updatedAt: Date;
        appClientId: number;
        agentId: number;
        title: string;
        content: string;
        key: string;
        version: number;
        locale: string;
        category: string;
    }>;
    publish(id: number): Promise<{
        id: number;
        createdAt: Date;
        description: string;
        isActive: boolean;
        updatedAt: Date;
        appClientId: number;
        agentId: number;
        title: string;
        content: string;
        key: string;
        version: number;
        locale: string;
        category: string;
    }>;
    remove(id: number): Promise<{
        deleted: {
            id: number;
            createdAt: Date;
            description: string;
            isActive: boolean;
            updatedAt: Date;
            appClientId: number;
            agentId: number;
            title: string;
            content: string;
            key: string;
            version: number;
            locale: string;
            category: string;
        };
    }>;
}
