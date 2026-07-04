import type { PrismaService } from '../../prisma/prisma.service';
import { collectWorkflowNodeBindingRefs } from './derive-workflow-bindings-from-nodes.util';
import { parseWorkflowNodesJson } from './load-workflow-definition.util';

export type WorkflowNodeReferenceKind = 'tool' | 'host_tool';

export type WorkflowNodeReferenceUsage = {
  source: 'workflow' | 'workflow_revision';
  workflowId: number;
  workflowKey: string;
  workflowName: string;
  version: number;
  revisionId?: number;
};

function workflowRefsTarget(input: {
  refs: { toolIds: number[]; hostToolIds: number[] };
  kind: WorkflowNodeReferenceKind;
  targetId: number;
}): boolean {
  return input.kind === 'tool'
    ? input.refs.toolIds.includes(input.targetId)
    : input.refs.hostToolIds.includes(input.targetId);
}

export async function findWorkflowNodeReferences(
  prisma: PrismaService,
  input: {
    appClientId: number;
    kind: WorkflowNodeReferenceKind;
    targetId: number;
  },
): Promise<WorkflowNodeReferenceUsage[]> {
  const workflows = await prisma.workflow.findMany({
    where: { appClientId: input.appClientId },
    select: {
      id: true,
      workflowKey: true,
      name: true,
      version: true,
      nodes: true,
      revisions: {
        select: {
          id: true,
          version: true,
          nodes: true,
        },
      },
    },
  });
  const usages: WorkflowNodeReferenceUsage[] = [];
  for (const workflow of workflows) {
    const refs = collectWorkflowNodeBindingRefs(
      parseWorkflowNodesJson(workflow.nodes),
    );
    if (
      workflowRefsTarget({
        refs,
        kind: input.kind,
        targetId: input.targetId,
      })
    ) {
      usages.push({
        source: 'workflow',
        workflowId: workflow.id,
        workflowKey: workflow.workflowKey,
        workflowName: workflow.name,
        version: workflow.version,
      });
    }
    for (const revision of workflow.revisions) {
      const revisionRefs = collectWorkflowNodeBindingRefs(
        parseWorkflowNodesJson(revision.nodes),
      );
      if (
        workflowRefsTarget({
          refs: revisionRefs,
          kind: input.kind,
          targetId: input.targetId,
        })
      ) {
        usages.push({
          source: 'workflow_revision',
          workflowId: workflow.id,
          workflowKey: workflow.workflowKey,
          workflowName: workflow.name,
          version: revision.version,
          revisionId: revision.id,
        });
      }
    }
  }
  return usages;
}
