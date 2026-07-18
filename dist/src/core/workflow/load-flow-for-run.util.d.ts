import type { PrismaService } from '../../prisma/prisma.service';
import type { LoadedWorkflowForRun, WorkflowLoadFailureReason, WorkflowLoadResult } from './load-workflow-definition.util';
import type { WorkflowOverrides } from './workflow.types';
export type FlowLoadResult = WorkflowLoadResult;
export declare function loadFlowForRunDetailed(prisma: PrismaService, input: {
    flowId: number;
    appClientId: number;
    flowVersion?: number | null;
    workflowOverrides?: WorkflowOverrides | null;
    scope?: {
        allowedToolIds: number[];
        allowedHostToolIds: number[];
    };
}): Promise<FlowLoadResult>;
export declare function loadFlowForRun(prisma: PrismaService, input: {
    flowId: number;
    appClientId: number;
    flowVersion?: number | null;
    workflowOverrides?: WorkflowOverrides | null;
    scope?: {
        allowedToolIds: number[];
        allowedHostToolIds: number[];
    };
}): Promise<LoadedWorkflowForRun | null>;
export type { WorkflowLoadFailureReason };
