export type SkillRunnableCapabilities = {
    skillToolIds: number[];
    hostToolIds: number[];
    workflowId?: number | null;
};
export declare function skillIsWorkflowBound(skill: {
    workflowId?: number | null;
}): boolean;
export type SkillRunnableKind = 'http' | 'host' | 'both';
export declare function normalizeSkillRunnableCapabilities(skill: {
    skillToolIds?: number[];
    toolIds?: number[];
    hostToolIds?: number[];
}): SkillRunnableCapabilities;
export declare function deriveSkillRunnableKind(skill: SkillRunnableCapabilities): SkillRunnableKind;
export declare function skillIsHostOnlySkill(skill: SkillRunnableCapabilities): boolean;
export declare function skillMatchesPageHostTools(skill: SkillRunnableCapabilities, scopedHostToolIds: ReadonlySet<number>): boolean;
export declare function skillIsVisibleOnClientPage(skill: SkillRunnableCapabilities, scopedHostToolIds: ReadonlySet<number>): boolean;
export declare function skillIsResolvableInScope(skill: SkillRunnableCapabilities, scopedToolIds: ReadonlySet<number>, scopedHostToolIds?: ReadonlySet<number>): boolean;
export declare function skillIsResolvableForRequested(skill: SkillRunnableCapabilities): boolean;
export declare function skillIsRunnableForUser(skill: {
    toolIds: number[];
    hostToolIds?: number[];
    workflowId?: number | null;
}, allowedToolIds: ReadonlySet<number>): boolean;
export declare function skillIsRunnable(skill: {
    toolIds: number[];
    hostToolIds?: number[];
}, allowedToolIds: ReadonlySet<number>): boolean;
export declare function skillHasRunnableToolIds(skill: {
    toolIds: number[];
    hostToolIds?: number[];
}, allowedToolIds: ReadonlySet<number>): boolean;
export declare function filterRunnableSkills<T extends {
    toolIds: number[];
    hostToolIds?: number[];
    workflowId?: number | null;
}>(skills: T[], allowedToolIds: ReadonlySet<number>): T[];
export declare function filterSkillsWithRunnableToolIds<T extends {
    toolIds: number[];
    hostToolIds?: number[];
}>(skills: T[], allowedToolIds: ReadonlySet<number>): T[];
