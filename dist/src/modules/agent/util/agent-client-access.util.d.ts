import { ToolLevel } from '../../../../generated/prisma/client';
import type { ToolListFilterInput } from '../../tool/tool-list-filter.util';
export type UserRoleToolAccessContext = {
    roleId: number;
    maxLevel: ToolLevel;
    roleToolIds: number[];
};
export declare function resolveMaxToolLevel(levels: ToolLevel[]): ToolLevel;
export declare function allowedToolLevels(maxLevel: ToolLevel): ToolLevel[];
export declare function buildRoleAccessibleToolWhere(appClientId: number, ctx: UserRoleToolAccessContext, toolFilter: ToolListFilterInput): import("../../../../generated/prisma/models").ToolWhereInput;
