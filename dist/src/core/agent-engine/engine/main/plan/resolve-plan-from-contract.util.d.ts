import type { LlmService } from '../../../../llm/llm.service';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import type { TurnExecutionContract } from '../../turn/turn-execution-contract.types';
import type { AutoOuterPlanSkillSelection } from './outer-plan-skill-resolve.util';
import type { ResolveOuterPlanInput, ResolveTaskPlanResult } from './task-plan.types';
import type { PlanTurnAxes } from './plan-turn-context.util';
export declare function resolvePlanFromContract(input: {
    contract: TurnExecutionContract;
    autoSkillCandidate: AutoOuterPlanSkillSelection | null;
    llmService: LlmService;
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
    planInput: ResolveOuterPlanInput;
    planTurnAxes: PlanTurnAxes;
}): Promise<ResolveTaskPlanResult>;
