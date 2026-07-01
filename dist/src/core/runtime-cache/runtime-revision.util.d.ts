import type { RuntimeRevision } from './runtime-cache.types';
type RevisionRow = {
    id: number;
    updatedAt?: Date | string | null;
};
export declare function toRevisionIso(value: Date | string | null | undefined): string;
export declare function buildEntityRevisionsFingerprint(rows: RevisionRow[]): string;
export declare function buildToolsRuntimeRevision(tools: Array<{
    id: number;
    updatedAt?: Date | string;
    integration?: {
        id: number;
        updatedAt?: Date | string;
    };
}>): Pick<RuntimeRevision, 'tools' | 'integrations'>;
export declare function buildSkillsRuntimeRevision(skills: Array<{
    id: number;
    updatedAt?: Date | string;
}>): string;
export declare function buildHostToolCatalogRevision(input: {
    hostTools: Array<{
        id: number;
        updatedAt: Date | string;
    }>;
    skillBindings: Array<{
        id: number;
        updatedAt: Date | string;
    }>;
    agentBoundHostToolIds: number[];
}): string;
export declare function isRuntimeRevisionEqual(left: RuntimeRevision | null | undefined, right: RuntimeRevision | null | undefined): boolean;
export {};
