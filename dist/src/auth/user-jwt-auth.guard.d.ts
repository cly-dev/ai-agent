import { ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
declare const UserJwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class UserJwtAuthGuard extends UserJwtAuthGuard_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export {};
