import type { PrismaService } from '../../prisma/prisma.service';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import { compileTaskPlanFromWorkflow } from './compile-task-plan-from-workflow.util';
import { loadFlowForRunDetailed } from './load-flow-for-run.util';
import { parseWorkflowOverridesJson } from './load-workflow-definition.util';

export type SkillWorkflowBinding = {
  flowId?: number | null;
  flowVersion?: number | null;
  /** @deprecated 运行时忽略；仅保留类型兼容至配置列清理 */
  workflowId?: number | null;
  workflowVersion?: number | null;
  workflowOverrides?: unknown;
};

/** 仅从 Skill.flowId 编译 TaskPlan；不再回退 legacy Workflow。 */
export async function tryBuildTaskPlanFromSkillWorkflow(
  prisma: PrismaService,
  input: {
    appClientId: number;
    userMessage: string;
    binding: SkillWorkflowBinding;
    goal?: string;
    allowedToolIds?: number[];
    allowedHostToolIds?: number[];
  },
): Promise<TaskPlanSnapshot | null> {
  const hasScope =
    input.allowedToolIds !== undefined || input.allowedHostToolIds !== undefined;
  const scope = hasScope
    ? {
        allowedToolIds: input.allowedToolIds ?? [],
        allowedHostToolIds: input.allowedHostToolIds ?? [],
      }
    : undefined;
  const overrides = parseWorkflowOverridesJson(
    input.binding.workflowOverrides,
  );

  const flowId = input.binding.flowId ?? null;
  if (flowId == null || flowId <= 0) {
    return null;
  }

  const detailed = await loadFlowForRunDetailed(prisma, {
    flowId,
    appClientId: input.appClientId,
    flowVersion: input.binding.flowVersion,
    workflowOverrides: overrides,
    scope,
  });
  if (detailed.status !== 'loaded') {
    return null;
  }
  return compileTaskPlanFromWorkflow({
    nodes: detailed.nodes,
    originalUserRequest: input.userMessage,
    goal: input.goal,
  });
}
