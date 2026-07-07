import { Request } from 'express';
import { UserService } from './user.service';
import { LoginUserDto } from './dto/login-user.dto';
export declare class UserController {
    private readonly service;
    constructor(service: UserService);
    login(body: LoginUserDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            employeeId: string;
            email: string;
            password: string;
            username: string;
            status: import("../../../generated/prisma/enums").UserStatus;
            mustChangePassword: boolean;
            createdAt: Date;
        };
        mustChangePassword: boolean;
    }>;
    getPasswordReminder(req: Request & {
        user?: {
            userId?: number;
        };
    }): Promise<{
        mustChangePassword: boolean;
        message: string;
    }>;
}
