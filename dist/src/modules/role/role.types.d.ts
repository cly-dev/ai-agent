import type { Prisma, ToolLevel } from '../../../generated/prisma/client';
export declare const ROLE_DETAIL_INCLUDE: {
    readonly _count: {
        readonly select: {
            readonly userApps: true;
            readonly roleTools: true;
            readonly roleSkills: true;
        };
    };
};
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
