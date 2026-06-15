import type { ToolLevel } from '../../../../../generated/prisma/client';
import type { ToolDecisionRole } from '../../../tool-engine/tool-decision-role.enum';
import type {
  TaskDeliverable,
  TaskPlanSource,
  TaskPlanStep,
  TaskStepPhase,
} from './task-plan.types';

/** 单层 Plan 帧：外层编排或某个 skill 展开后的内层步序。 */
export type PlanFrame = {
  frameId: string;
  skillId: number | null;
  skillName: string | null;
  source: TaskPlanSource;
  steps: TaskPlanStep[];
  pendingStepIds: string[];
  completedStepIds: string[];
  taskPhase: TaskStepPhase;
  currentObjective: string;
  currentStepId: string | null;
  /** 外层 kind=skill 步 id，内层帧完成后用于弹出并标记完成。 */
  parentSkillStepId?: string | null;
  skillPrompt?: string | null;
  skillDescription?: string | null;
  skillConfig?: unknown;
  skillRiskLevel?: ToolLevel | null;
};
