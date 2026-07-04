import type {
  StoredPlanFrame,
  StoredTaskPlan,
} from '../../../../memory/goa/session-goa.types';
import type { PlanFrame } from '../plan/plan-stack.types';
import type { OuterPlanSkillSelectMethod } from '../plan/outer-plan-skill-resolve.util';
import { syncPlanFromActiveFrame, wrapSnapshotWithPlanStack } from '../plan/plan-stack.util';
import type { TaskDeliverable, TaskPlanSnapshot, TaskPlanStep } from '../plan/task-plan.types';

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

function mapStoredStep(step: StoredTaskPlan['steps'][number]): TaskPlanStep {
  return {
    id: step.id,
    phase: step.phase as TaskPlanStep['phase'],
    kind: step.kind as TaskPlanStep['kind'],
    objective: step.objective,
    ...(step.skillId != null ? { skillId: step.skillId } : {}),
    ...(step.toolRole
      ? { toolRole: step.toolRole as TaskPlanStep['toolRole'] }
      : {}),
    ...(step.hostToolNames?.length ? { hostToolNames: step.hostToolNames } : {}),
    ...(step.hostToolIds?.length ? { hostToolIds: step.hostToolIds } : {}),
    ...(step.stopWhen
      ? { stopWhen: step.stopWhen as TaskPlanStep['stopWhen'] }
      : {}),
  };
}

function mapStoredFrame(frame: StoredPlanFrame): PlanFrame {
  return {
    frameId: frame.frameId,
    skillId: frame.skillId,
    skillName: frame.skillName ?? null,
    source: frame.source as PlanFrame['source'],
    steps: frame.steps.map(mapStoredStep),
    pendingStepIds: [...frame.pendingStepIds],
    completedStepIds: [...frame.completedStepIds],
    taskPhase: frame.taskPhase as PlanFrame['taskPhase'],
    currentObjective: frame.currentObjective,
    currentStepId: frame.currentStepId,
    parentSkillStepId: frame.parentSkillStepId ?? null,
    skillPrompt: frame.skillPrompt ?? null,
    skillDescription: frame.skillDescription ?? null,
    skillConfig: frame.skillConfig,
    skillRiskLevel:
      frame.skillRiskLevel === 'L1' ||
      frame.skillRiskLevel === 'L2' ||
      frame.skillRiskLevel === 'L3'
        ? frame.skillRiskLevel
        : null,
  };
}

function mapFrameToStored(frame: PlanFrame): StoredPlanFrame {
  return {
    frameId: frame.frameId,
    skillId: frame.skillId,
    skillName: frame.skillName,
    source: frame.source,
    steps: frame.steps.map((step) => ({
      id: step.id,
      phase: step.phase,
      kind: step.kind,
      objective: step.objective,
      ...(step.skillId != null ? { skillId: step.skillId } : {}),
      ...(step.toolRole ? { toolRole: step.toolRole } : {}),
      ...(step.hostToolNames?.length
        ? { hostToolNames: step.hostToolNames }
        : {}),
      ...(step.hostToolIds?.length ? { hostToolIds: step.hostToolIds } : {}),
      ...(step.stopWhen ? { stopWhen: step.stopWhen } : {}),
    })),
    pendingStepIds: [...frame.pendingStepIds],
    completedStepIds: [...frame.completedStepIds],
    taskPhase: frame.taskPhase,
    currentObjective: frame.currentObjective,
    currentStepId: frame.currentStepId,
    parentSkillStepId: frame.parentSkillStepId ?? null,
    skillPrompt: frame.skillPrompt ?? null,
    skillDescription: frame.skillDescription ?? null,
    skillConfig: frame.skillConfig,
    skillRiskLevel: frame.skillRiskLevel ?? null,
  };
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
      objective: step.objective,
      ...(step.skillId != null ? { skillId: step.skillId } : {}),
      ...(step.toolRole ? { toolRole: step.toolRole } : {}),
      ...(step.hostToolNames?.length
        ? { hostToolNames: step.hostToolNames }
        : {}),
      ...(step.hostToolIds?.length ? { hostToolIds: step.hostToolIds } : {}),
      ...(step.stopWhen ? { stopWhen: step.stopWhen } : {}),
    })),
    pendingStepIds: [...plan.pendingStepIds],
    completedStepIds: [...plan.completedStepIds],
    taskPhase: plan.taskPhase,
    currentObjective: plan.currentObjective,
    currentStepId: plan.currentStepId,
    frames: plan.frames.map(mapFrameToStored),
    activeFrameIndex: plan.activeFrameIndex,
    ...(plan.outerSkillSelectMethod
      ? { outerSkillSelectMethod: plan.outerSkillSelectMethod }
      : {}),
    ...(plan.autoSelectedSkillId !== undefined
      ? { autoSelectedSkillId: plan.autoSelectedSkillId }
      : {}),
  };
}

function planSelectMetadataFromStored(
  stored: StoredTaskPlan,
): Pick<TaskPlanSnapshot, 'outerSkillSelectMethod' | 'autoSelectedSkillId'> {
  const method = stored.outerSkillSelectMethod?.trim();
  return {
    ...(method
      ? { outerSkillSelectMethod: method as OuterPlanSkillSelectMethod }
      : {}),
    ...(stored.autoSelectedSkillId !== undefined
      ? { autoSelectedSkillId: stored.autoSelectedSkillId }
      : {}),
  };
}

export function fromStoredTaskPlan(stored: StoredTaskPlan): TaskPlanSnapshot {
  const selectMeta = planSelectMetadataFromStored(stored);
  if (stored.frames && stored.frames.length > 0) {
    const frames = stored.frames.map(mapStoredFrame);
    const activeFrameIndex =
      typeof stored.activeFrameIndex === 'number' &&
      stored.activeFrameIndex >= 0 &&
      stored.activeFrameIndex < frames.length
        ? stored.activeFrameIndex
        : 0;
    return {
      ...syncPlanFromActiveFrame({
        source: stored.source as TaskPlanSnapshot['source'],
        originalUserRequest: stored.originalUserRequest,
        goal: stored.goal,
        deliverable: asTaskDeliverable(stored.deliverable),
        constraints: [...stored.constraints],
        steps: [],
        pendingStepIds: [],
        completedStepIds: [],
        taskPhase: 'answer',
        currentObjective: stored.currentObjective,
        currentStepId: null,
        frames,
        activeFrameIndex,
      }),
      ...selectMeta,
    };
  }

  const steps = stored.steps.map(mapStoredStep);
  return {
    ...wrapSnapshotWithPlanStack({
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
    }),
    ...selectMeta,
  };
}
