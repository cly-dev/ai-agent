import { AdminRole } from '../../generated/prisma/client';
export declare const ADMIN_ROLES_KEY = "adminRoles";
export declare const AdminRoles: (...roles: AdminRole[]) => import("@nestjs/common").CustomDecorator<string>;
