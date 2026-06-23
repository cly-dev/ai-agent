import type { PlanFrame } from './plan-stack.types';
import type {
  TaskPlanSnapshot,
  TaskPlanSource,
  TaskPlanStep,
  TaskStepPhase,
} from './task-plan.types';

export function getActivePlanFrame(plan: TaskPlanSnapshot): PlanFrame {
  return plan.frames[plan.activeFrameIndex];
}

export function syncPlanFromActiveFrame(
  plan: TaskPlanSnapshot,
): TaskPlanSnapshot {
  const frame = plan.frames[plan.activeFrameIndex];
  if (!frame) {
    return plan;
  }
  return {
    ...plan,
    source: frame.source,
    steps: frame.steps,
    pendingStepIds: [...frame.pendingStepIds],
    completedStepIds: [...frame.completedStepIds],
    taskPhase: frame.taskPhase,
    currentObjective: frame.currentObjective,
    currentStepId: frame.currentStepId,
  };
}

export function updateActivePlanFrame(
  plan: TaskPlanSnapshot,
  updater: (frame: PlanFrame) => PlanFrame,
): TaskPlanSnapshot {
  const frames = plan.frames.map((frame, index) =>
    index === plan.activeFrameIndex ? updater(frame) : frame,
  );
  return syncPlanFromActiveFrame({ ...plan, frames });
}

export function createOuterPlanFrame(input: {
  source: TaskPlanSource;
  steps: TaskPlanStep[];
  pendingStepIds: string[];
  completedStepIds: string[];
  taskPhase: TaskStepPhase;
  currentObjective: string;
  currentStepId: string | null;
}): PlanFrame {
  return {
    frameId: 'outer',
    skillId: null,
    skillName: null,
    source: input.source,
    steps: input.steps,
    pendingStepIds: input.pendingStepIds,
    completedStepIds: input.completedStepIds,
    taskPhase: input.taskPhase,
    currentObjective: input.currentObjective,
    currentStepId: input.currentStepId,
    parentSkillStepId: null,
  };
}

export function wrapSnapshotWithPlanStack(
  plan: Omit<TaskPlanSnapshot, 'frames' | 'activeFrameIndex'>,
): TaskPlanSnapshot {
  const outer = createOuterPlanFrame({
    source: plan.source,
    steps: plan.steps,
    pendingStepIds: plan.pendingStepIds,
    completedStepIds: plan.completedStepIds,
    taskPhase: plan.taskPhase,
    currentObjective: plan.currentObjective,
    currentStepId: plan.currentStepId,
  });
  return syncPlanFromActiveFrame({
    ...plan,
    frames: [outer],
    activeFrameIndex: 0,
  });
}

export function pushPlanFrame(
  plan: TaskPlanSnapshot,
  frame: PlanFrame,
): TaskPlanSnapshot {
  const frames = [...plan.frames, frame];
  return syncPlanFromActiveFrame({
    ...plan,
    frames,
    activeFrameIndex: frames.length - 1,
  });
}

function advancePlanFrameStep(
  frame: PlanFrame,
  completedStepId: string,
): PlanFrame {
  const pendingStepIds = frame.pendingStepIds.filter(
    (id) => id !== completedStepId,
  );
  const completedStepIds = frame.completedStepIds.includes(completedStepId)
    ? frame.completedStepIds
    : [...frame.completedStepIds, completedStepId];
  const nextStep =
    frame.steps.find((step) => step.id === (pendingStepIds[0] ?? '')) ?? null;
  return {
    ...frame,
    pendingStepIds,
    completedStepIds,
    currentStepId: nextStep?.id ?? null,
    currentObjective: nextStep?.objective ?? frame.currentObjective,
    taskPhase: nextStep?.phase ?? 'answer',
  };
}

/** 内层帧完成后弹出，并在外层完成对应的 kind=skill 步。 */
export function popPlanFrameIfInnerComplete(
  plan: TaskPlanSnapshot,
): TaskPlanSnapshot {
  if (plan.activeFrameIndex === 0) {
    return plan;
  }
  const active = getActivePlanFrame(plan);
  if (active.pendingStepIds.length > 0) {
    return plan;
  }
  const parentIndex = plan.activeFrameIndex - 1;
  const parentFrame = plan.frames[parentIndex];
  const skillStepId =
    active.parentSkillStepId ?? parentFrame.pendingStepIds[0] ?? null;
  const frames = [...plan.frames];
  if (skillStepId) {
    frames[parentIndex] = advancePlanFrameStep(parentFrame, skillStepId);
  }
  return syncPlanFromActiveFrame({
    ...plan,
    frames,
    activeFrameIndex: parentIndex,
  });
}

export function applyActiveFrameStepComplete(
  plan: TaskPlanSnapshot,
  completedStepId: string,
): TaskPlanSnapshot {
  let updated = updateActivePlanFrame(plan, (frame) =>
    advancePlanFrameStep(frame, completedStepId),
  );
  updated = popPlanFrameIfInnerComplete(updated);
  return updated;
}

export function resolveSkillContextFromPlan(plan: TaskPlanSnapshot | null): {
  skillApplied: boolean;
  activeSkillId: number | null;
  activeSkillName: string | null;
  activeSkillDescription: string | null;
  activeSkillPrompt: string | null;
  activeSkillConfig: unknown;
  activeSkillRiskLevel: PlanFrame['skillRiskLevel'];
} {
  if (!plan) {
    return {
      skillApplied: false,
      activeSkillId: null,
      activeSkillName: null,
      activeSkillDescription: null,
      activeSkillPrompt: null,
      activeSkillConfig: null,
      activeSkillRiskLevel: null,
    };
  }
  const frame = getActivePlanFrame(plan);
  if (!frame.skillId) {
    return {
      skillApplied: false,
      activeSkillId: null,
      activeSkillName: null,
      activeSkillDescription: null,
      activeSkillPrompt: null,
      activeSkillConfig: null,
      activeSkillRiskLevel: null,
    };
  }
  return {
    skillApplied: true,
    activeSkillId: frame.skillId,
    activeSkillName: frame.skillName,
    activeSkillDescription: frame.skillDescription ?? null,
    activeSkillPrompt: frame.skillPrompt ?? null,
    activeSkillConfig: frame.skillConfig ?? null,
    activeSkillRiskLevel: frame.skillRiskLevel ?? null,
  };
}

export function isPendingSkillEntryStep(
  plan: TaskPlanSnapshot | null | undefined,
): boolean {
  if (!plan) {
    return false;
  }
  const stepId = plan.pendingStepIds[0] ?? plan.currentStepId;
  if (!stepId) {
    return false;
  }
  const step = plan.steps.find((row) => row.id === stepId);
  return step?.kind === 'skill' && step.skillId != null;
}

export function isSkillFrameActiveForPendingStep(
  plan: TaskPlanSnapshot,
): boolean {
  if (plan.activeFrameIndex === 0) {
    return false;
  }
  const active = getActivePlanFrame(plan);
  if (!active.parentSkillStepId) {
    return false;
  }
  const parentFrame = plan.frames[plan.activeFrameIndex - 1];
  return parentFrame?.pendingStepIds[0] === active.parentSkillStepId;
}
