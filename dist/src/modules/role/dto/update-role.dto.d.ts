import { ToolLevel } from '../../../../generated/prisma/client';
export declare class UpdateRoleDto {
    name?: string;
    description?: string | null;
    allowToolLevel?: ToolLevel;
}
