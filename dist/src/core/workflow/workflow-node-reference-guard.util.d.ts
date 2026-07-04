import type { PrismaService } from '../../prisma/prisma.service';
export type WorkflowNodeReferenceKind = 'tool' | 'host_tool';
export type WorkflowNodeReferenceUsage = {
    source: 'workflow' | 'workflow_revision';
    workflowId: number;
    workflowKey: string;
    workflowName: string;
    version: number;
    revisionId?: number;
};
export declare function findWorkflowNodeReferences(prisma: PrismaService, input: {
    appClientId: number;
    kind: WorkflowNodeReferenceKind;
    targetId: number;
}): Promise<WorkflowNodeReferenceUsage[]>;
