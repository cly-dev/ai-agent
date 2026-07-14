import { HostToolSkillTrigger } from '../../../generated/prisma/client';
import type { HostToolDecisionDefinition } from '../host-bridge';
import type { AgentHostToolCatalogSnapshot } from './runtime-cache.types';
export declare function resolvePreferredHostToolIdsFromCatalog(catalog: AgentHostToolCatalogSnapshot, input: {
    skillId: number | null | undefined;
    skillTriggers: HostToolSkillTrigger[];
}): {
    preferredIds: number[];
    requiredByToolId: Map<number, boolean>;
};
export declare function filterHostToolCatalogRowsForPage(input: {
    catalog: AgentHostToolCatalogSnapshot;
    pageScope: string;
    preferredIds: number[];
}): AgentHostToolCatalogSnapshot['agentBoundTools'];
export declare function toHostToolDecisionDefinitions(tools: AgentHostToolCatalogSnapshot['agentBoundTools'], requiredByToolId: Map<number, boolean>, preferredIds: number[]): HostToolDecisionDefinition[];
export type HostToolCatalogFilterDiagnostic = {
    hostToolId: number;
    name: string;
    included: boolean;
    reasons: string[];
    hostPageScope: string | null;
    isActive: boolean;
};
export declare function buildHostToolCatalogFilterDiagnostics(catalog: AgentHostToolCatalogSnapshot, input: {
    pageScope: string;
    preferredIds: number[];
}): HostToolCatalogFilterDiagnostic[];
export declare function resolveLlmHostToolsFromCatalog(catalog: AgentHostToolCatalogSnapshot, input: {
    pageScope: string;
    skillId: number | null | undefined;
    skillTriggers: HostToolSkillTrigger[];
}): HostToolDecisionDefinition[];
