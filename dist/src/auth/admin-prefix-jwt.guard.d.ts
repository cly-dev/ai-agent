import { ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { AdminRole } from '../../generated/prisma/client';
type JwtUser = {
    userId?: number;
    email?: string;
    username?: string;
    adminRole?: AdminRole;
};
declare const AdminPrefixJwtGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class AdminPrefixJwtGuard extends AdminPrefixJwtGuard_base {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
    handleRequest<TUser = JwtUser>(err: unknown, user: TUser, info: unknown, context: ExecutionContext): TUser;
}
export {};
