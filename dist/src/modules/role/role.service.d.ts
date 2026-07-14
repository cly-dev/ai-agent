import { type PaginatedResult } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { type RoleResponse } from './role.types';
export declare class RoleService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateRoleDto): Promise<RoleResponse>;
    findPage(query: QueryRoleDto): Promise<PaginatedResult<RoleResponse>>;
    findOne(id: number): Promise<RoleResponse>;
    update(id: number, dto: UpdateRoleDto): Promise<RoleResponse>;
    remove(id: number): Promise<RoleResponse>;
    private buildWhere;
    private buildOrderBy;
    private normalizeOptionalText;
    private rethrowUniqueConflict;
}
