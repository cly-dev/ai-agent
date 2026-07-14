import type { StoredTaskPlan } from '../../../memory/goa/session-goa.types';
import type { AgentGraphState } from '../main/types/agent-engine.types';
import type { BuildTurnExecutionContractInput, TurnExecutionContract } from './turn-execution-contract.types';
import type { TurnWriteChannel } from './turn-write-channel.types';
export declare function turnRouteFromContract(contract: Pick<TurnExecutionContract, 'taskKind'>): import("./turn-routing.types").TurnRouteKind;
export declare function turnWriteChannelFromContract(contract: Pick<TurnExecutionContract, 'taskKind'>): TurnWriteChannel;
export declare function pageContextEntityIdFromGraphState(state: Pick<AgentGraphState, 'turnExecutionContract' | 'pageContext'>): string | null;
export declare function buildTurnExecutionContract(input: BuildTurnExecutionContractInput): TurnExecutionContract;
export declare function buildWriteConfirmResumeContract(reason: string, writeChannel?: TurnWriteChannel): TurnExecutionContract;
export declare function buildRestrictiveTurnExecutionContract(reason: string): TurnExecutionContract;
export declare function resolveTurnExecutionContract(state: Pick<AgentGraphState, 'turnExecutionContract'>, reason?: string, log?: Pick<Console, 'warn'> | {
    warn: (message: string) => void;
}): TurnExecutionContract;
export declare function storedPlanCompatibleWithContract(contract: TurnExecutionContract, stored: StoredTaskPlan): boolean;
