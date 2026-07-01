import type { Prisma } from '../../../../generated/prisma/client';
import { AGENT_LINKED_TOOL_SELECT } from '../../agent/types/agent.types';
import type { SkillHostToolBindingResponse, HostToolResponse } from '../../host-tool/host-tool.types';
export declare const SKILL_APP_CLIENT_SELECT: {
    id: true;
    name: true;
    dsn: true;
    description: true;
    isActive: true;
    createdAt: true;
    updatedAt: true;
};
export declare const SKILL_TOOLS_INCLUDE_FRAGMENT: {
    skillTools: {
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
export declare const SKILL_LIST_INCLUDE: {
    _count: {
        select: {
            skillTools: true;
            roleSkills: true;
            skillHostTools: true;
            agentSkills: true;
        };
    };
    skillTools: {
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
    appClient: {
        select: {
            id: true;
            name: true;
            dsn: true;
            description: true;
            isActive: true;
            createdAt: true;
            updatedAt: true;
        };
    };
};
export declare const SKILL_DETAIL_INCLUDE: {
    skillHostTools: {
        orderBy: ({
            priority: "asc";
            id?: undefined;
        } | {
            id: "asc";
            priority?: undefined;
        })[];
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
    _count: {
        select: {
            skillTools: true;
            roleSkills: true;
            agentSkills: true;
        };
    };
    skillTools: {
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
    appClient: {
        select: {
            id: true;
            name: true;
            dsn: true;
            description: true;
            isActive: true;
            createdAt: true;
            updatedAt: true;
        };
    };
};
export type SkillDetailRow = Prisma.SkillGetPayload<{
    include: typeof SKILL_DETAIL_INCLUDE;
}>;
export type SkillListRow = Prisma.SkillGetPayload<{
    include: typeof SKILL_LIST_INCLUDE;
}>;
export type SkillToolBindingResponse = {
    id: number;
    toolId: number;
    isRequired: boolean;
    requiresWriteConfirmation: boolean;
    tool: Prisma.ToolGetPayload<{
        select: typeof AGENT_LINKED_TOOL_SELECT;
    }>;
};
export type SkillAppClientSummary = Prisma.AppClientGetPayload<{
    select: typeof SKILL_APP_CLIENT_SELECT;
}>;
export type SkillResponse = {
    id: number;
    appClientId: number;
    appClientName: string;
    name: string;
    capabilityKey: string | null;
    description: string | null;
    prompt: string;
    riskLevel: import('../../../../generated/prisma/client').ToolLevel;
    requiresWriteConfirmation: boolean;
    config: unknown;
    workflowId: number | null;
    workflowVersion: number | null;
    workflowOverrides: unknown;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    appClient: SkillAppClientSummary;
    skillTools: SkillToolBindingResponse[];
    hostTools: HostToolResponse[];
    skillHostTools: SkillHostToolBindingResponse[];
    toolCount: number;
    hostToolCount: number;
    roleSkillCount: number;
    agentSkillCount: number;
};
export type SkillClientListItem = {
    id: number;
    name: string;
    description: string | null;
    capabilityKey: string | null;
    riskLevel: import('../../../../generated/prisma/client').ToolLevel;
    requiresWriteConfirmation: boolean;
    toolIds: number[];
    hostToolIds: number[];
    pageMatched?: boolean;
};
