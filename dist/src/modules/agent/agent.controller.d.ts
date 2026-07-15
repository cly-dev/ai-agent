import { Request } from 'express';
import { AgentService } from './agent.service';
import { BindAgentToolsDto } from './dto/bind-agent-tools.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { QueryAgentToolsDto } from './dto/query-agent-tools.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
export declare class AgentController {
    private readonly service;
    constructor(service: AgentService);
    private appClientId;
    private userId;
    create(body: CreateAgentDto): Promise<import("./types/agent.types").AgentWithToolsResponse>;
    findAll(): Promise<import("./types/agent.types").AgentWithToolsResponse[]>;
    findByAppClient(appClientId: number): Promise<{
        id: number;
        name: string;
        appClientId: number;
        description: string;
        createdAt: Date;
        config: import("@prisma/client/runtime/client").JsonValue;
        systemPrompt: string;
        maxSteps: number;
        enableToolCall: boolean;
        restrictTools: boolean;
        restrictHostTools: boolean;
        restrictSkills: boolean;
    }[]>;
    listForClient(req: Request): Promise<import("./types/agent.types").AgentClientListItem[]>;
    listAvailableForClient(req: Request & {
        user?: {
            userId?: number;
        };
    }): Promise<import("./types/agent.types").AgentClientListItem[]>;
    getAgentTools(agentId: number, appClientId: number, query: QueryAgentToolsDto): Promise<import("./types/agent.types").AgentToolsPageResponse>;
    addAgentTools(agentId: number, appClientId: number, body: BindAgentToolsDto): Promise<import("./types/agent.types").AgentToolsBindingResponse>;
    removeAgentTools(agentId: number, appClientId: number, body: BindAgentToolsDto): Promise<import("./types/agent.types").AgentToolsBindingResponse>;
    findOne(id: number): Promise<import("./types/agent.types").AgentWithToolsResponse>;
    update(id: number, body: UpdateAgentDto): Promise<import("./types/agent.types").AgentWithToolsResponse>;
    remove(id: number): Promise<import("./types/agent.types").AgentWithToolsResponse>;
    getAllowedTools(req: Request, agentId: number, userId: number): Promise<({
        integration: {
            id: number;
            name: string;
            updatedAt: Date;
            baseUrl: string;
            apiKey: string;
            authMode: import("../../../generated/prisma/enums").IntegrationAuthMode;
        };
    } & {
        definitionKey: string;
        id: number;
        name: string;
        appClientId: number;
        description: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        riskLevel: import("../../../generated/prisma/enums").ToolLevel;
        schema: import("@prisma/client/runtime/client").JsonValue;
        inputSchema: import("@prisma/client/runtime/client").JsonValue;
        outputSchema: import("@prisma/client/runtime/client").JsonValue;
        responseProfile: import("@prisma/client/runtime/client").JsonValue;
        agentMetadata: import("@prisma/client/runtime/client").JsonValue;
        method: import("../../../generated/prisma/enums").HttpMethod;
        path: string;
        integrationId: number;
        toolCategoryId: number;
        timeout: number;
    })[]>;
}
