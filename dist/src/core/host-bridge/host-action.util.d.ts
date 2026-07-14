import type { HostActionHostToolInvocation, HostActionSsePayload } from './host-action.types';
import type { HostMutationRunStep, HostMutationScopedTool } from './host-mutation-step.types';
import { type SkillHostBridgeConfig } from './host-action.resolve.util';
import type { AgentChatPageContext } from './page-context.types';
export type { SkillHostBridgeConfig };
export declare function hasSuccessfulMutationStep(steps: HostMutationRunStep[], scopedTools: HostMutationScopedTool[]): boolean;
export declare function buildHostActionPayload(input: {
    pageContext?: AgentChatPageContext | null;
    runId: number;
    turnId: number;
    hostTools: HostActionHostToolInvocation[];
    skillConfig?: unknown;
    planStepId?: string | null;
    reason?: string;
}): HostActionSsePayload;
export declare function buildHostActionSyncPayload(input: Parameters<typeof buildHostActionPayload>[0]): HostActionSsePayload;
