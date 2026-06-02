import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ToolLevel } from '../../../generated/prisma/client';
import {
  type PaginatedResult,
  resolvePagination,
  resolveSortOrder,
  toPaginatedResult,
} from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto, type RoleOrderByField } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { toRoleResponse, toRoleResponseList } from './role.mapper';
import { ROLE_DETAIL_INCLUDE, type RoleResponse } from './role.types';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto): Promise<RoleResponse> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }
    try {
      const row = await this.prisma.role.create({
        data: {
          name,
          description: this.normalizeOptionalText(dto.description),
          allowToolLevel: dto.allowToolLevel ?? ToolLevel.L1,
        },
        include: ROLE_DETAIL_INCLUDE,
      });
      return toRoleResponse(row);
    } catch (error) {
      this.rethrowUniqueConflict(error, name);
      throw error;
    }
  }

  async findPage(query: QueryRoleDto): Promise<PaginatedResult<RoleResponse>> {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        orderBy,
        skip,
        take,
        include: ROLE_DETAIL_INCLUDE,
      }),
      this.prisma.role.count({ where }),
    ]);
    return toPaginatedResult(
      toRoleResponseList(rows),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: number): Promise<RoleResponse> {
    const row = await this.prisma.role.findUnique({
      where: { id },
      include: ROLE_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`role ${id} not found`);
    }
    return toRoleResponse(row);
  }

  async update(id: number, dto: UpdateRoleDto): Promise<RoleResponse> {
    await this.findOne(id);
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('name cannot be empty');
    }
    try {
      const row = await this.prisma.role.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          description:
            dto.description === undefined
              ? undefined
              : this.normalizeOptionalText(dto.description),
          allowToolLevel: dto.allowToolLevel,
        },
        include: ROLE_DETAIL_INCLUDE,
      });
      return toRoleResponse(row);
    } catch (error) {
      if (dto.name) {
        this.rethrowUniqueConflict(error, dto.name.trim());
      }
      throw error;
    }
  }

  async remove(id: number): Promise<RoleResponse> {
    const row = await this.findOne(id);
    if (row._count.userApps > 0) {
      throw new BadRequestException(
        `role ${id} is assigned to ${row._count.userApps} user app binding(s); reassign users before deleting`,
      );
    }
    await this.prisma.role.delete({ where: { id } });
    return row;
  }

  private buildWhere(query: QueryRoleDto): Prisma.RoleWhereInput {
    const where: Prisma.RoleWhereInput = {};
    if (query.id != null) {
      where.id = query.id;
    }
    if (query.name?.trim()) {
      where.name = { contains: query.name.trim(), mode: 'insensitive' };
    }
    if (query.allowToolLevel != null) {
      where.allowToolLevel = query.allowToolLevel;
    }
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private buildOrderBy(
    orderBy?: RoleOrderByField,
    order?: 'asc' | 'desc',
  ): Prisma.RoleOrderByWithRelationInput {
    const direction = resolveSortOrder(order);
    switch (orderBy ?? 'id') {
      case 'name':
        return { name: direction };
      case 'allowToolLevel':
        return { allowToolLevel: direction };
      case 'createdAt':
        return { createdAt: direction };
      case 'id':
      default:
        return { id: direction };
    }
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    if (value == null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private rethrowUniqueConflict(error: unknown, name: string): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(`role name "${name}" already exists`);
    }
  }
}
