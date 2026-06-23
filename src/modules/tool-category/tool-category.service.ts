import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import {
  type PaginatedResult,
  resolvePagination,
  resolveSortOrder,
  toPaginatedResult,
} from '../../common/pagination';
import { RuntimeCacheInvalidator } from '../../core/runtime-cache/runtime-cache-invalidator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateToolCategoryDto } from './dto/create-tool-category.dto';
import {
  QueryToolCategoryDto,
  type ToolCategoryOrderByField,
} from './dto/query-tool-category.dto';
import { UpdateToolCategoryDto } from './dto/update-tool-category.dto';
import {
  toToolCategoryResponse,
  toToolCategoryResponseList,
} from './tool-category.mapper';
import {
  TOOL_CATEGORY_DETAIL_INCLUDE,
  type ToolCategoryResponse,
} from './tool-category.types';

@Injectable()
export class ToolCategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtimeCacheInvalidator: RuntimeCacheInvalidator,
  ) {}

  async create(dto: CreateToolCategoryDto): Promise<ToolCategoryResponse> {
    const label = dto.label.trim();
    if (!label) {
      throw new BadRequestException('label is required');
    }
    const row = await this.prisma.toolCategory.create({
      data: {
        label,
        description: this.normalizeOptionalText(dto.description),
        sortOrder: dto.sortOrder ?? 0,
      },
      include: TOOL_CATEGORY_DETAIL_INCLUDE,
    });
    return toToolCategoryResponse(row);
  }

  async findPage(
    query: QueryToolCategoryDto,
  ): Promise<PaginatedResult<ToolCategoryResponse>> {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.toolCategory.findMany({
        where,
        orderBy,
        skip,
        take,
        include: TOOL_CATEGORY_DETAIL_INCLUDE,
      }),
      this.prisma.toolCategory.count({ where }),
    ]);
    return toPaginatedResult(
      toToolCategoryResponseList(rows),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: number): Promise<ToolCategoryResponse> {
    const row = await this.prisma.toolCategory.findUnique({
      where: { id },
      include: TOOL_CATEGORY_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`toolCategory ${id} not found`);
    }
    return toToolCategoryResponse(row);
  }

  async update(
    id: number,
    dto: UpdateToolCategoryDto,
  ): Promise<ToolCategoryResponse> {
    await this.findOne(id);
    if (dto.label !== undefined && !dto.label.trim()) {
      throw new BadRequestException('label cannot be empty');
    }
    const row = await this.prisma.toolCategory.update({
      where: { id },
      data: {
        label: dto.label?.trim(),
        description:
          dto.description === undefined
            ? undefined
            : this.normalizeOptionalText(dto.description),
        sortOrder: dto.sortOrder,
      },
      include: TOOL_CATEGORY_DETAIL_INCLUDE,
    });
    this.runtimeCacheInvalidator.invalidateToolCategories();
    return toToolCategoryResponse(row);
  }

  async remove(id: number): Promise<ToolCategoryResponse> {
    const row = await this.findOne(id);
    if ((row._count?.tools ?? 0) > 0) {
      throw new BadRequestException(
        `toolCategory ${id} has bound tools, unbind tools before deleting`,
      );
    }
    await this.prisma.toolCategory.delete({ where: { id } });
    this.runtimeCacheInvalidator.invalidateToolCategories();
    return row;
  }

  private buildWhere(query: QueryToolCategoryDto): Prisma.ToolCategoryWhereInput {
    const where: Prisma.ToolCategoryWhereInput = {};
    if (query.id != null) {
      where.id = query.id;
    }
    if (query.label?.trim()) {
      where.label = { contains: query.label.trim(), mode: 'insensitive' };
    }
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { label: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private buildOrderBy(
    orderBy?: ToolCategoryOrderByField,
    order?: 'asc' | 'desc',
  ): Prisma.ToolCategoryOrderByWithRelationInput {
    const direction = resolveSortOrder(order);
    switch (orderBy ?? 'sortOrder') {
      case 'id':
        return { id: direction };
      case 'label':
        return { label: direction };
      case 'createdAt':
        return { createdAt: direction };
      case 'updatedAt':
        return { updatedAt: direction };
      case 'sortOrder':
      default:
        return { sortOrder: direction };
    }
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    if (value == null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
