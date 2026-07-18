import type { PrismaService } from '../../prisma/prisma.service';
import type { AgentGraphNodeBundle } from '../agent-engine/engine/main/agent-graph/types/graph.types';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import { loadFlowForRunDetailed } from './load-flow-for-run.util';
import type {
  LoadedWorkflowForRun,
  WorkflowLoadFailureReason,
} from './load-workflow-definition.util';
import { parseWorkflowOverridesJson } from './load-workflow-definition.util';

/** workflow_init 对 Skill.flowId 的解析结果（运行时不再读 Skill.workflowId）。 */
export type SkillWorkflowInitResolution =
  | { kind: 'no_workflow_binding' }
  | { kind: 'loaded'; workflow: LoadedWorkflowForRun; source: 'flow' }
  | { kind: 'scope_incompatible'; workflowId: number; source: 'flow' }
  | {
      kind: 'load_failed';
      workflowId: number;
      reason: Exclude<WorkflowLoadFailureReason, 'scope_incompatible'>;
      source: 'flow';
    };

export function resolveWorkflowBoundSkillId(
  bundle: AgentGraphNodeBundle,
  state: AgentGraphState,
): number | null {
  if (state.turnExecutionContract?.skillAlignment?.status === 'intent_first') {
    return null;
  }
  const skillId =
    bundle.ctx.input.requestedSkillId ??
    bundle.ctx.requestedSkillCtx?.skillId ??
    state.activeSkillId ??
    state.taskPlan?.autoSelectedSkillId ??
    null;
  return skillId != null && skillId > 0 ? skillId : null;
}

/**
 * Skill 步序来源：仅 Flow（Intent/IR）。
 * 未绑 flowId 的存量 Skill.workflowId 不再加载；须先 migrate。
 */
export async function resolveSkillWorkflowForInit(
  prisma: PrismaService,
  input: {
    skillId: number;
    appClientId: number;
    scope?: {
      allowedToolIds: number[];
      allowedHostToolIds: number[];
    };
  },
): Promise<SkillWorkflowInitResolution> {
  const skillRow = await prisma.skill.findUnique({
    where: { id: input.skillId },
    select: {
      flowId: true,
      flowVersion: true,
      workflowOverrides: true,
    },
  });

  const overrides = parseWorkflowOverridesJson(skillRow?.workflowOverrides);

  if (skillRow?.flowId == null || skillRow.flowId <= 0) {
    return { kind: 'no_workflow_binding' };
  }

  const loadResult = await loadFlowForRunDetailed(prisma, {
    flowId: skillRow.flowId,
    appClientId: input.appClientId,
    flowVersion: skillRow.flowVersion,
    workflowOverrides: overrides,
    scope: input.scope,
  });
  return mapLoadResult(loadResult);
}

function mapLoadResult(
  loadResult: Awaited<ReturnType<typeof loadFlowForRunDetailed>>,
): SkillWorkflowInitResolution {
  if (loadResult.status === 'loaded') {
    const { status: _status, ...workflow } = loadResult;
    return { kind: 'loaded', workflow, source: 'flow' };
  }
  if (loadResult.reason === 'scope_incompatible') {
    return {
      kind: 'scope_incompatible',
      workflowId: loadResult.workflowId,
      source: 'flow',
    };
  }
  return {
    kind: 'load_failed',
    workflowId: loadResult.workflowId,
    reason: loadResult.reason,
    source: 'flow',
  };
}
