import type { EntityMaterializationSource } from './entity-materialization.types';
export declare function buildEntityFingerprint(input: {
    source: EntityMaterializationSource;
    path: string;
}): string;
