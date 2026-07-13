import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UserAdminController {
    private readonly service;
    constructor(service: UserService);
    create(body: CreateUserDto): Promise<{
        generatedPassword: string;
        id: number;
        employeeId: string;
        email: string;
        password: string;
        username: string;
        status: import("../../../generated/prisma/enums").UserStatus;
        mustChangePassword: boolean;
        createdAt: Date;
    }>;
    findAll(): Promise<{
        id: number;
        employeeId: string;
        email: string;
        password: string;
        username: string;
        status: import("../../../generated/prisma/enums").UserStatus;
        mustChangePassword: boolean;
        createdAt: Date;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        employeeId: string;
        email: string;
        password: string;
        username: string;
        status: import("../../../generated/prisma/enums").UserStatus;
        mustChangePassword: boolean;
        createdAt: Date;
    }>;
    update(id: number, body: UpdateUserDto): Promise<{
        id: number;
        employeeId: string;
        email: string;
        password: string;
        username: string;
        status: import("../../../generated/prisma/enums").UserStatus;
        mustChangePassword: boolean;
        createdAt: Date;
    }>;
    remove(id: number): Promise<{
        id: number;
        employeeId: string;
        email: string;
        password: string;
        username: string;
        status: import("../../../generated/prisma/enums").UserStatus;
        mustChangePassword: boolean;
        createdAt: Date;
    }>;
}
