import type { StoredTaskPlan } from '../../../memory/goa/session-goa.types';
import type { TaskDeliverable, TaskPlanSnapshot, TaskPlanStep } from './task-plan.types';

function asTaskDeliverable(value: string): TaskDeliverable {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'analysis' ||
    normalized === 'list' ||
    normalized === 'detail' ||
    normalized === 'mutation' ||
    normalized === 'answer'
  ) {
    return normalized;
  }
  return 'answer';
}

export function toStoredTaskPlan(plan: TaskPlanSnapshot): StoredTaskPlan {
  return {
    source: plan.source,
    originalUserRequest: plan.originalUserRequest,
    goal: plan.goal,
    deliverable: plan.deliverable,
    constraints: [...plan.constraints],
    steps: plan.steps.map((step) => ({
      id: step.id,
      phase: step.phase,
      kind: step.kind,
      ...(step.toolRole ? { toolRole: step.toolRole } : {}),
      objective: step.objective,
      ...(step.stopWhen ? { stopWhen: step.stopWhen } : {}),
    })),
    pendingStepIds: [...plan.pendingStepIds],
    completedStepIds: [...plan.completedStepIds],
    taskPhase: plan.taskPhase,
    currentObjective: plan.currentObjective,
    currentStepId: plan.currentStepId,
  };
}

export function fromStoredTaskPlan(stored: StoredTaskPlan): TaskPlanSnapshot {
  const steps: TaskPlanStep[] = stored.steps.map((step) => ({
    id: step.id,
    phase: step.phase as TaskPlanStep['phase'],
    kind: step.kind as TaskPlanStep['kind'],
    objective: step.objective,
    ...(step.toolRole
      ? { toolRole: step.toolRole as TaskPlanStep['toolRole'] }
      : {}),
    ...(step.stopWhen
      ? { stopWhen: step.stopWhen as TaskPlanStep['stopWhen'] }
      : {}),
  }));
  return {
    source: stored.source as TaskPlanSnapshot['source'],
    originalUserRequest: stored.originalUserRequest,
    goal: stored.goal,
    deliverable: asTaskDeliverable(stored.deliverable),
    constraints: [...stored.constraints],
    steps,
    pendingStepIds: [...stored.pendingStepIds],
    completedStepIds: [...stored.completedStepIds],
    taskPhase: stored.taskPhase as TaskPlanSnapshot['taskPhase'],
    currentObjective: stored.currentObjective,
    currentStepId: stored.currentStepId,
  };
}
