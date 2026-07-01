import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UserAdminController {
    private readonly service;
    constructor(service: UserService);
    create(body: CreateUserDto): Promise<{
        generatedPassword: string;
        id: number;
        createdAt: Date;
        email: string;
        password: string;
        username: string;
        mustChangePassword: boolean;
        employeeId: string;
        status: import("../../../generated/prisma/enums").UserStatus;
    }>;
    findAll(): Promise<{
        id: number;
        createdAt: Date;
        email: string;
        password: string;
        username: string;
        mustChangePassword: boolean;
        employeeId: string;
        status: import("../../../generated/prisma/enums").UserStatus;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        createdAt: Date;
        email: string;
        password: string;
        username: string;
        mustChangePassword: boolean;
        employeeId: string;
        status: import("../../../generated/prisma/enums").UserStatus;
    }>;
    update(id: number, body: UpdateUserDto): Promise<{
        id: number;
        createdAt: Date;
        email: string;
        password: string;
        username: string;
        mustChangePassword: boolean;
        employeeId: string;
        status: import("../../../generated/prisma/enums").UserStatus;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        email: string;
        password: string;
        username: string;
        mustChangePassword: boolean;
        employeeId: string;
        status: import("../../../generated/prisma/enums").UserStatus;
    }>;
}
