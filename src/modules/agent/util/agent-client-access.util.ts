import { ToolLevel } from '../../../../generated/prisma/client';
import { buildToolWhereFromFilters } from '../../tool/tool-list-filter.util';
import type { ToolListFilterInput } from '../../tool/tool-list-filter.util';

export type UserRoleToolAccessContext = {
  roleId: number;
  maxLevel: ToolLevel;
  roleToolIds: number[];
};

export function resolveMaxToolLevel(levels: ToolLevel[]): ToolLevel {
  if (levels.includes(ToolLevel.L3)) {
    return ToolLevel.L3;
  }
  if (levels.includes(ToolLevel.L2)) {
    return ToolLevel.L2;
  }
  return ToolLevel.L1;
}

export function allowedToolLevels(maxLevel: ToolLevel): ToolLevel[] {
  if (maxLevel === ToolLevel.L3) {
    return [ToolLevel.L1, ToolLevel.L2, ToolLevel.L3];
  }
  if (maxLevel === ToolLevel.L2) {
    return [ToolLevel.L1, ToolLevel.L2];
  }
  return [ToolLevel.L1];
}

/** 角色可用 Tool 查询条件：RoleTool ∩ 风险等级 ∩ 可选 Tool 筛选。 */
export function buildRoleAccessibleToolWhere(
  appClientId: number,
  ctx: UserRoleToolAccessContext,
  toolFilter: ToolListFilterInput,
) {
  const requireActive = toolFilter.isActive !== false;
  return buildToolWhereFromFilters(toolFilter, {
    id: { in: ctx.roleToolIds },
    appClientId,
    ...(requireActive ? { isActive: true } : {}),
    riskLevel: { in: allowedToolLevels(ctx.maxLevel) },
  });
}
