import type { PrismaService } from '../../prisma/prisma.service';
import type { WorkflowDefinition, WorkflowNodeDef, WorkflowOverrides, WorkflowRunState } from './workflow.types';
export declare function parseWorkflowNodesJson(value: unknown): WorkflowNodeDef[];
export declare function parseWorkflowOverridesJson(value: unknown): WorkflowOverrides | null;
export type LoadedWorkflowForRun = {
    nodes: WorkflowNodeDef[];
    workflowRun: WorkflowRunState;
    workflowId: number;
    version: number;
    compiledFrom: 'workflow_db';
};
export type WorkflowLoadFailureReason = 'asset_missing' | 'revision_missing' | 'empty_nodes' | 'scope_incompatible';
export type WorkflowLoadResult = ({
    status: 'loaded';
} & LoadedWorkflowForRun) | {
    status: 'failed';
    reason: WorkflowLoadFailureReason;
    workflowId: number;
};
export declare function loadWorkflowForRunDetailed(prisma: PrismaService, input: {
    workflowId: number;
    appClientId: number;
    workflowVersion?: number | null;
    workflowOverrides?: WorkflowOverrides | null;
    scope?: {
        allowedToolIds: number[];
        allowedHostToolIds: number[];
    };
}): Promise<WorkflowLoadResult>;
export declare function loadWorkflowForRun(prisma: PrismaService, input: {
    workflowId: number;
    appClientId: number;
    workflowVersion?: number | null;
    workflowOverrides?: WorkflowOverrides | null;
    scope?: {
        allowedToolIds: number[];
        allowedHostToolIds: number[];
    };
}): Promise<LoadedWorkflowForRun | null>;
export declare function toWorkflowDefinition(row: {
    workflowKey: string;
    name: string;
    profile: WorkflowDefinition['profile'];
    goal?: string | null;
    constraints?: unknown;
    nodes: unknown;
}): WorkflowDefinition;
