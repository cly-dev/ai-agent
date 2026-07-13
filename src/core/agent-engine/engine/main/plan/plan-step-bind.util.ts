import type { ToolDecisionRole } from '../../../../tool-engine/tool-decision-role.enum';
import type { BuildTaskPlanInput, TaskPlanStep } from './task-plan.types';

export type ScopedToolSummary = BuildTaskPlanInput['scopedToolSummaries'][number];

/** 将 plan tool 步编译为可执行绑定（step.id / pinnedToolNames → toolRole）。 */
export function compilePlanToolSteps(
  steps: TaskPlanStep[],
  scopedToolSummaries: ScopedToolSummary[],
): TaskPlanStep[] {
  if (scopedToolSummaries.length === 0) {
    return steps;
  }
  const toolByName = new Map(
    scopedToolSummaries.map((tool) => [tool.name, tool]),
  );
  return steps.map((step) => bindPlanToolStep(step, toolByName));
}

function bindPlanToolStep(
  step: TaskPlanStep,
  toolByName: Map<string, ScopedToolSummary>,
): TaskPlanStep {
  if (step.kind !== 'tool') {
    return step;
  }

  let pinnedToolNames = step.pinnedToolNames?.length
    ? [...step.pinnedToolNames]
    : undefined;
  const pinnedFromId = toolByName.get(step.id);
  if (pinnedFromId) {
    pinnedToolNames = [pinnedFromId.name];
  }

  let toolRole = step.toolRole;
  if (pinnedToolNames?.length) {
    for (const name of pinnedToolNames) {
      const summary = toolByName.get(name);
      if (summary && !toolRole) {
        toolRole = summary.role;
        break;
      }
    }
  } else if (pinnedFromId && !toolRole) {
    toolRole = pinnedFromId.role;
  }

  if (
    pinnedToolNames === step.pinnedToolNames &&
    toolRole === step.toolRole
  ) {
    return step;
  }

  return {
    ...step,
    ...(toolRole ? { toolRole } : {}),
    ...(pinnedToolNames ? { pinnedToolNames } : {}),
  };
}

export function planToolStepsAreExecutable(steps: TaskPlanStep[]): boolean {
  for (const step of steps) {
    if (step.kind === 'tool' && !step.toolRole) {
      return false;
    }
  }
  return true;
}

export function scopedToolSummaryByName(
  scopedToolSummaries: ScopedToolSummary[],
): Map<string, ScopedToolSummary> {
  return new Map(scopedToolSummaries.map((tool) => [tool.name, tool]));
}

export function resolveToolRoleForPlanStepId(
  stepId: string,
  toolByName: Map<string, ScopedToolSummary>,
): ToolDecisionRole | undefined {
  return toolByName.get(stepId)?.role;
}
