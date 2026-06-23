import type { ToolLevel } from '../../../generated/prisma/client';
import { allowedToolLevels } from '../../modules/agent/util/agent-client-access.util';
import type { UserRoleToolAccessContext } from '../../modules/agent/util/agent-client-access.util';
import type { AgentToolCatalogRow } from './agent-tool-catalog.types';
import type { AgentToolCatalogSnapshot } from './runtime-cache.types';

export function resolveAllowedToolsFromCatalog(
  catalog: AgentToolCatalogSnapshot,
  roleCtx: UserRoleToolAccessContext,
): AgentToolCatalogRow[] {
  const roleToolIds = new Set(roleCtx.roleToolIds);
  const allowedLevels = new Set<ToolLevel>(allowedToolLevels(roleCtx.maxLevel));
  const toolById = new Map(catalog.tools.map((tool) => [tool.id, tool]));
  return catalog.agentBoundToolIds
    .filter((id) => roleToolIds.has(id))
    .map((id) => toolById.get(id))
    .filter(
      (tool): tool is AgentToolCatalogRow =>
        tool != null && tool.isActive && allowedLevels.has(tool.riskLevel),
    );
}
