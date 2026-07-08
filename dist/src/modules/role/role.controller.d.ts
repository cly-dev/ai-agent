import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleService } from './role.service';
export declare class RoleController {
    private readonly service;
    constructor(service: RoleService);
    create(body: CreateRoleDto): Promise<import("./role.types").RoleResponse>;
    findPage(query: QueryRoleDto): Promise<import("../../common/pagination").PaginatedResult<import("./role.types").RoleResponse>>;
    findOne(id: number): Promise<import("./role.types").RoleResponse>;
    update(id: number, body: UpdateRoleDto): Promise<import("./role.types").RoleResponse>;
    remove(id: number): Promise<import("./role.types").RoleResponse>;
}
