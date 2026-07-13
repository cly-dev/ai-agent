import type { SessionGoaPayload } from '../../../../memory/goa/session-goa.types';
import type { ToolObservation } from '../types/agent-engine.types';
import type { PlanSessionWorkingMemory } from '../plan/task-plan.types';
import { type PlanScopedTool } from '../plan/task-plan.util';
export declare function buildPlanSessionWorkingMemory(input: {
    goa: SessionGoaPayload | null;
    scopedTools: PlanScopedTool[];
    runOwnedObservations: ToolObservation[];
}): PlanSessionWorkingMemory | null;
