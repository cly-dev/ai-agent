import type { Prisma } from '../../../generated/prisma/client';
import { AGENT_LINKED_TOOL_SELECT } from '../agent/types/agent.types';
import { type HostToolResponse } from '../host-tool/host-tool.types';
export declare const WORKFLOW_DETAIL_INCLUDE: {
    appClient: {
        select: {
            id: true;
            name: true;
            dsn: true;
        };
    };
    workflowTools: {
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
    workflowHostTools: {
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
export declare const WORKFLOW_LIST_INCLUDE: {
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
export type WorkflowDetailRow = Prisma.WorkflowGetPayload<{
    include: typeof WORKFLOW_DETAIL_INCLUDE;
}>;
export type WorkflowListRow = Prisma.WorkflowGetPayload<{
    include: typeof WORKFLOW_LIST_INCLUDE;
}>;
export type WorkflowToolBindingResponse = {
    id: number;
    toolId: number;
    isRequired: boolean;
    tool: Prisma.ToolGetPayload<{
        select: typeof AGENT_LINKED_TOOL_SELECT;
    }>;
};
export type WorkflowHostToolBindingResponse = {
    id: number;
    hostToolId: number;
    isRequired: boolean;
    hostTool: HostToolResponse;
};
export type WorkflowResponse = {
    id: number;
    appClientId: number;
    appClientName: string;
    workflowKey: string;
    name: string;
    description: string | null;
    goal: string | null;
    profile: string;
    deliverable: string;
    nodes: unknown;
    version: number;
    constraints: unknown;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    workflowTools: WorkflowToolBindingResponse[];
    workflowHostTools: WorkflowHostToolBindingResponse[];
    skillRefCount: number;
    pageActionRefCount: number;
    revisionCount: number;
};
export type WorkflowListItem = Omit<WorkflowResponse, 'workflowTools' | 'workflowHostTools' | 'revisionCount' | 'nodes' | 'constraints' | 'goal'> & {
    nodeCount: number;
};
export type WorkflowRevisionResponse = {
    id: number;
    workflowId: number;
    version: number;
    deliverable: string;
    nodes: unknown;
    constraints: unknown;
    changeNote: string | null;
    createdAt: Date;
    isCurrent: boolean;
};
export type WorkflowRevisionSummaryResponse = Omit<WorkflowRevisionResponse, 'nodes' | 'constraints'>;
