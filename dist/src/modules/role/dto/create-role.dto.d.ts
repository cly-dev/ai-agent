import { ToolLevel } from '../../../../generated/prisma/client';
export declare class CreateRoleDto {
    name: string;
    description?: string;
    allowToolLevel?: ToolLevel;
}
