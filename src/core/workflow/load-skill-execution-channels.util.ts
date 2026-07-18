import type { PrismaService } from '../../prisma/prisma.service';
import {
  deriveSkillExecutionChannels,
  type SkillExecutionChannels,
} from './derive-skill-execution-channels.util';
import { deriveSkillExecutionChannelsFromIr } from './derive-skill-execution-channels-from-ir.util';
import { parseWorkflowIrDocument } from './parse-workflow-ir.util';

/**
 * 从 Skill 绑定的 Flow 推导 executionChannels。
 * 运行时不再读 legacy Workflow；缺 flowId / 钉版本缺失 → 空通道（与 loadFlowForRunDetailed 失败语义对齐）。
 */
export async function loadSkillExecutionChannels(
  prisma: PrismaService,
  input: {
    flowId?: number | null;
    flowVersion?: number | null;
    /** @deprecated 忽略 */
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

  const flowId = input.flowId ?? null;
  if (flowId == null || flowId <= 0) {
    return deriveSkillExecutionChannels({ ...base, nodes: [] });
  }

  return loadChannelsFromFlow(prisma, {
    ...base,
    flowId,
    flowVersion: input.flowVersion ?? null,
  });
}

async function loadChannelsFromFlow(
  prisma: PrismaService,
  input: {
    flowId: number;
    flowVersion: number | null;
    skillToolIds: readonly number[];
    hostToolIds: readonly number[];
  },
): Promise<SkillExecutionChannels> {
  const base = {
    skillToolIds: input.skillToolIds,
    hostToolIds: input.hostToolIds,
  };
  const flow = await prisma.flow.findFirst({
    where: { id: input.flowId, isActive: true },
    select: { ir: true, deliverable: true, version: true },
  });
  if (!flow) {
    return deriveSkillExecutionChannels({ ...base, nodes: [] });
  }

  let irJson: unknown = flow.ir;
  let deliverable = flow.deliverable;
  const pinVersion = input.flowVersion;
  if (pinVersion != null && pinVersion !== flow.version) {
    const revision = await prisma.flowRevision.findUnique({
      where: {
        flowId_version: { flowId: input.flowId, version: pinVersion },
      },
      select: { ir: true, deliverable: true },
    });
    // 与 loadFlowForRunDetailed 一致：钉版本缺失 → 空通道，禁止静默用 head。
    if (!revision) {
      console.warn(
        `[loadSkillExecutionChannels] flow revision missing flowId=${input.flowId} version=${pinVersion}; empty channels`,
      );
      return deriveSkillExecutionChannels({ ...base, nodes: [] });
    }
    irJson = revision.ir;
    deliverable = revision.deliverable;
  }

  const ir = parseWorkflowIrDocument(irJson);
  if (!ir || ir.nodes.length === 0) {
    return deriveSkillExecutionChannels({ ...base, nodes: [] });
  }
  // 通道真源优先 IR type，免 lower（与 loadFlowForRun 物化路径解耦）。
  const fromIr = deriveSkillExecutionChannelsFromIr({
    ir,
    deliverable,
  });
  return fromIr;
}
