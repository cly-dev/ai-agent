export declare function resolvePlanGoal(input: {
    userMessage: string;
    skillDescription?: string | null;
    skillName?: string | null;
}): string;
export declare function resolveSkillCapabilityConstraints(input: {
    skillDescription?: string | null;
    skillName?: string | null;
}): string[];
export declare function mergePlanConstraints(base: string[], extra: string[]): string[];
export declare function formatPlanConstraintsForPrompt(constraints: string[] | null | undefined): string | null;
