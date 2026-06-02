import type { Prisma, ToolLevel } from '../../../generated/prisma/client';

export const ROLE_DETAIL_INCLUDE = {
  _count: {
    select: {
      userApps: true,
      roleTools: true,
      roleSkills: true,
    },
  },
} as const satisfies Prisma.RoleInclude;

export type RoleWithCounts = Prisma.RoleGetPayload<{
  include: typeof ROLE_DETAIL_INCLUDE;
}>;

export type RoleResponse = {
  id: number;
  name: string;
  description: string | null;
  allowToolLevel: ToolLevel;
  createdAt: Date;
  _count: {
    userApps: number;
    roleTools: number;
    roleSkills: number;
  };
};
