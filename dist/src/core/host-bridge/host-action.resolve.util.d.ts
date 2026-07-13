export type SkillHostBridgeConfig = {
    reason?: string;
};
export declare function parseSkillHostBridgeConfig(skillConfig: unknown): SkillHostBridgeConfig | null;
export declare function resolveHostActionMetadata(pageContext?: {
    metadata?: Record<string, unknown>;
} | null): Record<string, unknown> | undefined;
