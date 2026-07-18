import type { Prisma } from '../../../generated/prisma/client';
import { AGENT_LINKED_TOOL_SELECT } from '../agent/types/agent.types';
import { type HostToolResponse } from '../host-tool/host-tool.types';
export declare const FLOW_DETAIL_INCLUDE: {
    appClient: {
        select: {
            id: true;
            name: true;
            dsn: true;
        };
    };
    flowTools: {
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
    flowHostTools: {
        orderBy: {
            hostToolId: "asc";
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
                            updatedAt: true;
                        };
                    };
                };
            };
        };
    };
    _count: {
        select: {
            skills: true;
            pageActions: true;
            revisions: true;
        };
    };
};
export declare const FLOW_LIST_INCLUDE: {
    appClient: {
        select: {
            id: true;
            name: true;
            dsn: true;
        };
    };
    _count: {
        select: {
            skills: true;
            pageActions: true;
        };
    };
};
export type FlowDetailRow = Prisma.FlowGetPayload<{
    include: typeof FLOW_DETAIL_INCLUDE;
}>;
export type FlowListRow = Prisma.FlowGetPayload<{
    include: typeof FLOW_LIST_INCLUDE;
}>;
export type FlowResponse = {
    id: number;
    appClientId: number;
    appClientName: string;
    flowKey: string;
    name: string;
    description: string | null;
    goal: string | null;
    profile: string;
    deliverable: string;
    intent: unknown;
    ir: unknown;
    version: number;
    constraints: unknown;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    flowTools: Array<{
        id: number;
        toolId: number;
        isRequired: boolean;
        tool: Prisma.ToolGetPayload<{
            select: typeof AGENT_LINKED_TOOL_SELECT;
        }>;
    }>;
    flowHostTools: Array<{
        id: number;
        hostToolId: number;
        isRequired: boolean;
        hostTool: HostToolResponse;
    }>;
    skillRefCount: number;
    pageActionRefCount: number;
    revisionCount: number;
};
export type FlowListItem = Omit<FlowResponse, 'flowTools' | 'flowHostTools' | 'revisionCount' | 'intent' | 'ir' | 'constraints' | 'goal'> & {
    irNodeCount: number;
};
export type FlowRevisionResponse = {
    id: number;
    flowId: number;
    version: number;
    deliverable: string;
    intent: unknown;
    ir: unknown;
    constraints: unknown;
    changeNote: string | null;
    createdAt: Date;
    isCurrent: boolean;
};
export type FlowRevisionSummaryResponse = Omit<FlowRevisionResponse, 'intent' | 'ir' | 'constraints'>;
export type MigrateFlowFromWorkflowResponse = {
    flow: FlowResponse;
    sourceWorkflowId: number;
    matchedPattern: string;
    warnings: string[];
    rebind: {
        skillsUpdated: number;
        pageActionsUpdated: number;
    };
    sourceDeactivated: boolean;
};
export type MigrateFlowFromWorkflowPreview = {
    sourceWorkflowId: number;
    suggestedFlowKey: string;
    profile: string;
    canMigrate: boolean;
    lossy: boolean;
    matchedPattern: string | null;
    warnings: string[];
    intent: unknown | null;
    error: {
        code: string;
        message: string;
    } | null;
    flowKeyAvailable: boolean;
    rebind: {
        skillCount: number;
        pageActionCount: number;
    };
};
export type FlowMigrationCandidate = {
    workflowId: number;
    workflowKey: string;
    name: string;
    profile: string;
    isActive: boolean;
    skillRefCount: number;
    pageActionRefCount: number;
    previewPath: string;
    migratePath: string;
};
