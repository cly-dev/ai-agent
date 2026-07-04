import { AdminRole } from '../../generated/prisma/client';
declare const JwtStrategy_base: new (...args: any[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: {
        sub: number;
        email: string;
        username: string;
        adminRole?: AdminRole;
    }): Promise<{
        userId: number;
        email: string;
        username: string;
        adminRole: AdminRole;
    }>;
}
export {};
