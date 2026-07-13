import type { Prisma } from '../../../generated/prisma/client';
export declare function isCapabilityAppDefaultEnabled(): boolean;
export type AgentCapabilityRestrictFlags = {
    restrictTools: boolean;
    restrictHostTools: boolean;
    restrictSkills: boolean;
};
export type AgentBindingCounts = {
    toolBindings: number;
    hostToolBindings: number;
    skillBindings: number;
};
export declare function resolveEffectiveRestrictTools(flags: Pick<AgentCapabilityRestrictFlags, 'restrictTools'>, bindings: Pick<AgentBindingCounts, 'toolBindings'>, appDefaultEnabled?: boolean): boolean;
export declare function resolveEffectiveRestrictHostTools(flags: Pick<AgentCapabilityRestrictFlags, 'restrictHostTools'>, bindings: Pick<AgentBindingCounts, 'hostToolBindings'>, appDefaultEnabled?: boolean): boolean;
export declare function resolveEffectiveRestrictSkills(flags: Pick<AgentCapabilityRestrictFlags, 'restrictSkills'>, bindings: Pick<AgentBindingCounts, 'skillBindings'>, appDefaultEnabled?: boolean): boolean;
export declare function resolveAgentToolCandidateIds(input: {
    appDefaultEnabled?: boolean;
    restrictTools: boolean;
    whitelistIds: number[];
    appActiveIds: number[];
}): number[];
export declare function resolveAgentHostToolCandidateIds(input: {
    appDefaultEnabled?: boolean;
    restrictHostTools: boolean;
    whitelistIds: number[];
    appActiveIds: number[];
}): number[];
export declare function buildAgentSkillVisibilityWhere(input: {
    appClientId: number;
    agentId: number;
    restrictSkills: boolean;
    skillWhitelistIds: number[];
    appDefaultEnabled?: boolean;
}): Prisma.SkillWhereInput;
