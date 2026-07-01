import type { PrismaService } from '../../prisma/prisma.service';
import {
  deriveSkillExecutionChannels,
  type SkillExecutionChannels,
} from './derive-skill-execution-channels.util';
import { parseWorkflowNodesJson } from './load-workflow-definition.util';

export async function loadSkillExecutionChannels(
  prisma: PrismaService,
  input: {
    workflowId?: number | null;
    workflowVersion?: number | null;
    skillToolIds: readonly number[];
    hostToolIds: readonly number[];
  },
): Promise<SkillExecutionChannels> {
  const base = {
    skillToolIds: input.skillToolIds,
    hostToolIds: input.hostToolIds,
  };
  const workflowId = input.workflowId ?? null;
  if (workflowId == null || workflowId <= 0) {
    return deriveSkillExecutionChannels({ ...base, nodes: [] });
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { nodes: true, deliverable: true, version: true },
  });
  if (!workflow) {
    return deriveSkillExecutionChannels({ ...base, nodes: [] });
  }

  let nodesJson: unknown = workflow.nodes;
  let deliverable = workflow.deliverable;
  const pinVersion = input.workflowVersion ?? null;
  if (pinVersion != null && pinVersion !== workflow.version) {
    const revision = await prisma.workflowRevision.findUnique({
      where: {
        workflowId_version: { workflowId, version: pinVersion },
      },
      select: { nodes: true, deliverable: true },
    });
    if (revision) {
      nodesJson = revision.nodes;
      deliverable = revision.deliverable;
    } else {
      console.warn(
        `[loadSkillExecutionChannels] workflow revision missing workflowId=${workflowId} version=${pinVersion}; using current workflow head`,
      );
    }
  }

  return deriveSkillExecutionChannels({
    ...base,
    nodes: parseWorkflowNodesJson(nodesJson),
    deliverable,
  });
}
