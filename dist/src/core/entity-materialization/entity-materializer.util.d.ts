import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { ToolResponseProfile } from '../tool-engine/tool-response-profile.types';
import type { EntityMaterializationSource, MaterializedEntity } from './entity-materialization.types';
export declare function materializeEntitiesFromRuntimeContext(input: {
    pageContext?: AgentChatPageContext | null;
    actionContext?: Record<string, unknown> | null;
}): MaterializedEntity[];
export declare function materializeEntitiesFromToolOutput(input: {
    raw: unknown;
    profile: ToolResponseProfile | null;
}): MaterializedEntity[];
export declare function mergeMaterializedEntities(existing: readonly MaterializedEntity[], incoming: readonly MaterializedEntity[]): MaterializedEntity[];
export declare function collectImageUrlsFromMaterializedEntities(entities: readonly MaterializedEntity[], sources: readonly EntityMaterializationSource[]): string[];
export declare function resolveImageUrlsForVision(input: {
    from: 'page_context' | 'upstream' | 'all';
    entities?: readonly MaterializedEntity[];
    pageContext?: unknown;
    upstreamOutputs?: Record<string, unknown>;
}): string[];
