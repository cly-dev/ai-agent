import { type HostToolDecisionDefinition, type HostToolDeliveryProfile, type HostToolProduceMode } from '../host-bridge';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { HostToolDetailRow } from '../../modules/host-tool/host-tool.types';
export type ResolvedPageActionHostTool = {
    definition: HostToolDecisionDefinition;
    streamablePath: string | null;
    delivery: HostToolDeliveryProfile;
    produceMode: HostToolProduceMode;
};
export declare function hostToolRowToDecisionDefinition(row: HostToolDetailRow): HostToolDecisionDefinition;
export declare function assertPageActionScopeMatch(input: {
    pageScope: string | null | undefined;
    hostPageScope: string | null | undefined;
    pageContext: AgentChatPageContext | null | undefined;
}): void;
export declare function resolvePageActionHostTool(hostTool: HostToolDetailRow, pageContext: AgentChatPageContext | null | undefined): ResolvedPageActionHostTool;
