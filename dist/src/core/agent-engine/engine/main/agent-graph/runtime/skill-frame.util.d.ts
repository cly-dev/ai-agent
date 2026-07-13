import type { PlanSyncSite } from '../../plan/plan-sync.util';
import type { TaskPlanAdvanceResult } from '../../plan/task-plan.types';
import type { AgentGraphState } from '../../types/agent-engine.types';
import type { AgentGraphDeps, AgentGraphRunContext } from '../types/graph.types';
import type { AgentGraphRunHelpers } from './run.helpers';
export interface AgentGraphSkillFrameHelpers {
    applySkillFrameContext: (state: AgentGraphState) => Promise<AgentGraphState>;
    withPlanSyncStep: (graphState: AgentGraphState, planAdvance: TaskPlanAdvanceResult | null, fromStepId: string | null, site: PlanSyncSite) => AgentGraphState;
    prepareReActPlanState: (state: AgentGraphState) => Promise<{
        state: AgentGraphState;
        planAdvance: TaskPlanAdvanceResult | null;
        fromStepId: string | null;
    }>;
}
export declare function createAgentGraphSkillFrameHelpers(deps: AgentGraphDeps, ctx: AgentGraphRunContext, runHelpers: AgentGraphRunHelpers): AgentGraphSkillFrameHelpers;
