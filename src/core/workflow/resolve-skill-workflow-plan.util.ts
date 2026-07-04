import type { PrismaService } from '../../prisma/prisma.service';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import { compileTaskPlanFromWorkflow } from './compile-task-plan-from-workflow.util';
import {
  loadWorkflowForRun,
  parseWorkflowOverridesJson,
} from './load-workflow-definition.util';

export type SkillWorkflowBinding = {
  workflowId: number;
  workflowVersion?: number | null;
  workflowOverrides?: unknown;
};

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
  const loaded = await loadWorkflowForRun(prisma, {
    workflowId: input.binding.workflowId,
    appClientId: input.appClientId,
    workflowVersion: input.binding.workflowVersion,
    workflowOverrides: parseWorkflowOverridesJson(
      input.binding.workflowOverrides,
    ),
    scope: hasScope
      ? {
          allowedToolIds: input.allowedToolIds ?? [],
          allowedHostToolIds: input.allowedHostToolIds ?? [],
        }
      : undefined,
  });
  if (!loaded) {
    return null;
  }
  return compileTaskPlanFromWorkflow({
    nodes: loaded.nodes,
    originalUserRequest: input.userMessage,
    goal: input.goal,
  });
}
