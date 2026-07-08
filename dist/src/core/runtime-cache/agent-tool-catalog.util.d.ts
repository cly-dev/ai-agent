import type { UserRoleToolAccessContext } from '../../modules/agent/util/agent-client-access.util';
import type { AgentToolCatalogRow } from './agent-tool-catalog.types';
import type { AgentToolCatalogSnapshot } from './runtime-cache.types';
export declare function resolveAllowedToolsFromCatalog(catalog: AgentToolCatalogSnapshot, roleCtx: UserRoleToolAccessContext): AgentToolCatalogRow[];
