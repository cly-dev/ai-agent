import type { ToolDecisionRole } from '../../../../tool-engine/tool-decision-role.enum';
import type { BuildTaskPlanInput, TaskPlanStep } from './task-plan.types';
export type ScopedToolSummary = BuildTaskPlanInput['scopedToolSummaries'][number];
export declare function compilePlanToolSteps(steps: TaskPlanStep[], scopedToolSummaries: ScopedToolSummary[]): TaskPlanStep[];
export declare function planToolStepsAreExecutable(steps: TaskPlanStep[]): boolean;
export declare function scopedToolSummaryByName(scopedToolSummaries: ScopedToolSummary[]): Map<string, ScopedToolSummary>;
export declare function resolveToolRoleForPlanStepId(stepId: string, toolByName: Map<string, ScopedToolSummary>): ToolDecisionRole | undefined;
