import type { Prisma } from '../../../../generated/prisma/client';
import type { PaginatedResult } from '../../../common/pagination';
import type { AgentHostToolBindingResponse, HostToolResponse } from '../../host-tool/host-tool.types';
export declare const AGENT_LINKED_TOOL_SELECT: {
    id: true;
    appClientId: true;
    definitionKey: true;
    name: true;
    description: true;
    riskLevel: true;
    method: true;
    path: true;
    integrationId: true;
    toolCategoryId: true;
    isActive: true;
    agentMetadata: true;
    timeout: true;
    createdAt: true;
    updatedAt: true;
    toolCategory: true;
    integration: {
        select: {
            id: true;
            name: true;
            baseUrl: true;
            authMode: true;
            updatedAt: true;
        };
    };
};
export declare const AGENT_TOOLS_INCLUDE_FRAGMENT: {
    agentTools: {
        orderBy: {
            toolId: "asc";
        };
        include: {
            tool: {
                select: {
                    id: true;
                    appClientId: true;
                    definitionKey: true;
                    name: true;
                    description: true;
                    riskLevel: true;
                    method: true;
                    path: true;
                    integrationId: true;
                    toolCategoryId: true;
                    isActive: true;
                    agentMetadata: true;
                    timeout: true;
                    createdAt: true;
                    updatedAt: true;
                    toolCategory: true;
                    integration: {
                        select: {
                            id: true;
                            name: true;
                            baseUrl: true;
                            authMode: true;
                            updatedAt: true;
                        };
                    };
                };
            };
        };
    };
};
export declare const AGENT_LIST_INCLUDE: {
    _count: {
        select: {
            agentHostTools: true;
        };
    };
    agentTools: {
        orderBy: {
            toolId: "asc";
        };
        include: {
            tool: {
                select: {
                    id: true;
                    appClientId: true;
                    definitionKey: true;
                    name: true;
                    description: true;
                    riskLevel: true;
                    method: true;
                    path: true;
                    integrationId: true;
                    toolCategoryId: true;
                    isActive: true;
                    agentMetadata: true;
                    timeout: true;
                    createdAt: true;
                    updatedAt: true;
                    toolCategory: true;
                    integration: {
                        select: {
                            id: true;
                            name: true;
                            baseUrl: true;
                            authMode: true;
                            updatedAt: true;
                        };
                    };
                };
            };
        };
    };
};
export declare const AGENT_WITH_TOOLS_INCLUDE: {
    agentHostTools: {
        orderBy: {
            id: "asc";
        };
        include: {
            hostTool: {
                include: {
                    appClient: {
                        select: {
                            id: true;
                            name: true;
                            dsn: true;
                        };
                    };
                    hostPage: {
                        select: {
                            id: true;
                            scope: true;
                            label: true;
                        };
                    };
                };
            };
        };
    };
    agentTools: {
        orderBy: {
            toolId: "asc";
        };
        include: {
            tool: {
                select: {
                    id: true;
                    appClientId: true;
                    definitionKey: true;
                    name: true;
                    description: true;
                    riskLevel: true;
                    method: true;
                    path: true;
                    integrationId: true;
                    toolCategoryId: true;
                    isActive: true;
                    agentMetadata: true;
                    timeout: true;
                    createdAt: true;
                    updatedAt: true;
                    toolCategory: true;
                    integration: {
                        select: {
                            id: true;
                            name: true;
                            baseUrl: true;
                            authMode: true;
                            updatedAt: true;
                        };
                    };
                };
            };
        };
    };
};
export type AgentLinkedToolRow = Prisma.ToolGetPayload<{
    select: typeof AGENT_LINKED_TOOL_SELECT;
}>;
export type AgentLinkedToolResponse = AgentLinkedToolRow & {
    tags: string[];
};
export type AgentWithToolsRow = Prisma.AgentGetPayload<{
    include: typeof AGENT_WITH_TOOLS_INCLUDE;
}>;
export type AgentListRow = Prisma.AgentGetPayload<{
    include: typeof AGENT_LIST_INCLUDE;
}>;
export type AgentToolBindingItem = {
    id: number;
    agentId: number;
    toolId: number;
    tool: AgentLinkedToolResponse;
};
export type AgentToolsBindingResponse = {
    agentId: number;
    appClientId: number;
    tools: AgentLinkedToolResponse[];
    agentTools: AgentToolBindingItem[];
};
export type AgentToolsPageResponse = {
    agentId: number;
    appClientId: number;
} & PaginatedResult<AgentToolBindingItem>;
export type AgentWithToolsResponse = Omit<AgentWithToolsRow, 'agentTools' | 'agentHostTools'> & {
    tools: AgentLinkedToolResponse[];
    agentTools: AgentToolBindingItem[];
    hostTools: HostToolResponse[];
    agentHostTools: AgentHostToolBindingResponse[];
    hostToolCount: number;
};
export type AgentClientListItem = {
    id: number;
    name: string;
    description: string | null;
};
