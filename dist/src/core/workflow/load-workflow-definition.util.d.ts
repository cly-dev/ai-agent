import type { PrismaService } from '../../prisma/prisma.service';
import { parseWorkflowGraphJson, serializeWorkflowGraphJson, type ParsedWorkflowGraph } from './graph/workflow-edge.util';
import type { WorkflowDefinition, WorkflowEdge, WorkflowNodeDef, WorkflowOverrides, WorkflowRunState } from './workflow.types';
export declare function parseWorkflowNodesJson(value: unknown): WorkflowNodeDef[];
export { parseWorkflowGraphJson, serializeWorkflowGraphJson, type ParsedWorkflowGraph, };
export declare function parseWorkflowOverridesJson(value: unknown): WorkflowOverrides | null;
export type LoadedWorkflowForRun = {
    nodes: WorkflowNodeDef[];
    edges: WorkflowEdge[];
    entryNodeId: string | null;
    edgesDeclared: boolean;
    workflowRun: WorkflowRunState;
    workflowId: number;
    version: number;
    compiledFrom: 'workflow_db' | 'flow_db';
    ir?: import('./workflow-ir.types').WorkflowIrDocument;
    materializedDirectFromIr?: boolean;
    executionMode?: import('./workflow-ir-native-direct.util').WorkflowExecutionMode;
};
export type WorkflowLoadFailureReason = 'asset_missing' | 'revision_missing' | 'empty_nodes' | 'invalid_edges' | 'scope_incompatible';
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
