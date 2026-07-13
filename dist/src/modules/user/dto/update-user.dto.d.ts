import { UserStatus } from '../../../../generated/prisma/client';
export declare class UpdateUserDto {
    email?: string;
    password?: string;
    username?: string;
    status?: UserStatus;
}
