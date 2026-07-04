import type { PrismaService } from '../../prisma/prisma.service';
import type { AgentGraphNodeBundle } from '../agent-engine/engine/main/agent-graph/types/graph.types';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import {
  loadWorkflowForRunDetailed,
  parseWorkflowOverridesJson,
  type LoadedWorkflowForRun,
  type WorkflowLoadFailureReason,
} from './load-workflow-definition.util';

/** workflow_init 对 Skill.workflowId 的解析结果（对应设计里的两条步序来源 + 硬失败）。 */
export type SkillWorkflowInitResolution =
  | { kind: 'no_workflow_binding' }
  | { kind: 'loaded'; workflow: LoadedWorkflowForRun }
  | { kind: 'scope_incompatible'; workflowId: number }
  | {
      kind: 'load_failed';
      workflowId: number;
      reason: Exclude<WorkflowLoadFailureReason, 'scope_incompatible'>;
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
 * Skill 步序来源解析：
 * - `no_workflow_binding`：无 workflowId → 由 plan 阶段已产出的 taskPlan 走 plan_compile
 * - `loaded`：有 workflowId 且 DB 加载成功 → workflow_db
 * - `scope_incompatible`：有 workflowId 但与当前 scope 不兼容 → 回退 plan_compile
 * - `load_failed`：有 workflowId 但资产不可用 → 硬失败
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
      workflowId: true,
      workflowVersion: true,
      workflowOverrides: true,
    },
  });
  if (!skillRow?.workflowId || skillRow.workflowId <= 0) {
    return { kind: 'no_workflow_binding' };
  }
  const loadResult = await loadWorkflowForRunDetailed(prisma, {
    workflowId: skillRow.workflowId,
    appClientId: input.appClientId,
    workflowVersion: skillRow.workflowVersion,
    workflowOverrides: parseWorkflowOverridesJson(skillRow.workflowOverrides),
    scope: input.scope,
  });
  if (loadResult.status === 'loaded') {
    const { status: _status, ...workflow } = loadResult;
    return { kind: 'loaded', workflow };
  }
  if (loadResult.reason === 'scope_incompatible') {
    return {
      kind: 'scope_incompatible',
      workflowId: loadResult.workflowId,
    };
  }
  return {
    kind: 'load_failed',
    workflowId: loadResult.workflowId,
    reason: loadResult.reason,
  };
}
