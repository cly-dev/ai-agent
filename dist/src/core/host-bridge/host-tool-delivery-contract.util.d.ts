import type { HostToolDecisionDefinition } from './host-tool-decision.types';
export type HostToolDeliveryProfile = 'fill_stream' | 'instant' | 'observation';
export type HostToolProduceMode = 'prose_stream' | 'structured';
export type HostToolDeliveryContract = {
    toolName: string;
    produceMode: HostToolProduceMode;
    delivery: HostToolDeliveryProfile;
    streamablePath: string | null;
};
export declare function pickHostToolProseStreamArgKey(properties: Record<string, unknown>): string | null;
export declare function hostToolArgsSchemaIsStructured(argsSchema: Record<string, unknown> | null | undefined): boolean;
export declare function resolveHostToolDeliveryContract(tool: HostToolDecisionDefinition): HostToolDeliveryContract;
export declare function resolveHostToolDeliveryContracts(input: {
    hostTools: HostToolDecisionDefinition[];
    allowedToolNames?: Set<string>;
}): HostToolDeliveryContract[];
export declare function hostToolContractDispatchesDsl(contract: HostToolDeliveryContract): boolean;
export declare function hostToolContractWillDispatchLive(contract: HostToolDeliveryContract, isStreamEnabled: boolean): boolean;
