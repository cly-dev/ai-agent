import type { PlanFrame } from './plan-stack.types';
import type { TaskPlanSnapshot, TaskPlanSource, TaskPlanStep, TaskStepPhase } from './task-plan.types';
export declare function getActivePlanFrame(plan: TaskPlanSnapshot): PlanFrame;
export declare function syncPlanFromActiveFrame(plan: TaskPlanSnapshot): TaskPlanSnapshot;
export declare function updateActivePlanFrame(plan: TaskPlanSnapshot, updater: (frame: PlanFrame) => PlanFrame): TaskPlanSnapshot;
export declare function createOuterPlanFrame(input: {
    source: TaskPlanSource;
    steps: TaskPlanStep[];
    pendingStepIds: string[];
    completedStepIds: string[];
    taskPhase: TaskStepPhase;
    currentObjective: string;
    currentStepId: string | null;
}): PlanFrame;
export declare function wrapSnapshotWithPlanStack(plan: Omit<TaskPlanSnapshot, 'frames' | 'activeFrameIndex'>): TaskPlanSnapshot;
export declare function pushPlanFrame(plan: TaskPlanSnapshot, frame: PlanFrame): TaskPlanSnapshot;
export declare function popPlanFrameIfInnerComplete(plan: TaskPlanSnapshot): TaskPlanSnapshot;
export declare function applyActiveFrameStepComplete(plan: TaskPlanSnapshot, completedStepId: string): TaskPlanSnapshot;
export declare function resolveSkillContextFromPlan(plan: TaskPlanSnapshot | null): {
    skillApplied: boolean;
    activeSkillId: number | null;
    activeSkillName: string | null;
    activeSkillDescription: string | null;
    activeSkillPrompt: string | null;
    activeSkillConfig: unknown;
    activeSkillRiskLevel: PlanFrame['skillRiskLevel'];
};
export declare function isPendingSkillEntryStep(plan: TaskPlanSnapshot | null | undefined): boolean;
export declare function isSkillFrameActiveForPendingStep(plan: TaskPlanSnapshot): boolean;
