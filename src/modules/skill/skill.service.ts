import {
  BadRequestException,
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
import { normalizeCapabilityKey } from './skill-capability-key.util';
import { CreateSkillDto } from './dto/create-skill.dto';
import { QuerySkillDto, type SkillOrderByField } from './dto/query-skill.dto';
import { ReplaceSkillToolsDto } from './dto/skill-tool-binding.dto';
import type { SkillToolBindingItemDto } from './dto/skill-tool-binding.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { toSkillResponse, toSkillResponseList } from './skill.mapper';
import { resolveSkillRiskLevel } from './skill-risk.util';
import { SKILL_DETAIL_INCLUDE, type SkillResponse } from './skill.types';

@Injectable()
export class SkillService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    agentId: number,
    appClientId: number,
    dto: CreateSkillDto,
  ): Promise<SkillResponse> {
    await this.assertAgentInAppClient(agentId, appClientId);
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }
    const prompt = dto.prompt.trim();
    if (!prompt) {
      throw new BadRequestException('prompt is required');
    }
    const capabilityKey = normalizeCapabilityKey(dto.capabilityKey);
    const toolBindings = this.normalizeToolBindings(dto.tools);
    await this.assertToolsBoundToAgent(agentId, toolBindings);
    const riskLevel = resolveSkillRiskLevel({
      explicit: dto.riskLevel,
      toolRiskLevels: await this.fetchToolRiskLevels(
        toolBindings.map((item) => item.toolId),
      ),
    });

    const row = await this.prisma.skill.create({
      data: {
        agentId,
        name,
        capabilityKey,
        description: this.normalizeOptionalText(dto.description),
        prompt,
        riskLevel,
        config:
          dto.config === undefined
            ? undefined
            : (dto.config as Prisma.InputJsonValue),
        isActive: dto.isActive ?? true,
        skillTools:
          toolBindings.length > 0
            ? {
                create: toolBindings.map((item) => ({
                  toolId: item.toolId,
                  isRequired: item.isRequired,
                })),
              }
            : undefined,
      },
      include: SKILL_DETAIL_INCLUDE,
    });
    return toSkillResponse(row);
  }

  async findPageByAgent(
    agentId: number,
    appClientId: number,
    query: QuerySkillDto,
  ): Promise<PaginatedResult<SkillResponse>> {
    await this.assertAgentInAppClient(agentId, appClientId);
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where = this.buildWhere(agentId, query);
    const orderBy = this.buildOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        orderBy,
        skip,
        take,
        include: SKILL_DETAIL_INCLUDE,
      }),
      this.prisma.skill.count({ where }),
    ]);
    return toPaginatedResult(
      toSkillResponseList(rows),
      total,
      page,
      pageSize,
    );
  }

  async findPageByAppClient(
    appClientId: number,
    query: QuerySkillDto & { agentId?: number },
  ): Promise<PaginatedResult<SkillResponse>> {
    await this.assertAppClientExists(appClientId);
    if (query.agentId != null) {
      await this.assertAgentInAppClient(query.agentId, appClientId);
    }
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where: Prisma.SkillWhereInput = {
      agent: { appClientId },
      ...(query.agentId != null ? { agentId: query.agentId } : {}),
      ...this.buildFilterFields(query),
    };
    const orderBy = this.buildOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        orderBy,
        skip,
        take,
        include: SKILL_DETAIL_INCLUDE,
      }),
      this.prisma.skill.count({ where }),
    ]);
    return toPaginatedResult(
      toSkillResponseList(rows),
      total,
      page,
      pageSize,
    );
  }

  async findOne(skillId: number): Promise<SkillResponse> {
    return toSkillResponse(await this.getSkillOrThrow(skillId));
  }

  async update(skillId: number, dto: UpdateSkillDto): Promise<SkillResponse> {
    await this.getSkillOrThrow(skillId);
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('name cannot be empty');
    }
    if (dto.prompt !== undefined && !dto.prompt.trim()) {
      throw new BadRequestException('prompt cannot be empty');
    }
    const capabilityKey =
      dto.capabilityKey === undefined
        ? undefined
        : normalizeCapabilityKey(dto.capabilityKey);
    const row = await this.prisma.skill.update({
      where: { id: skillId },
      data: {
        name: dto.name?.trim(),
        prompt: dto.prompt?.trim(),
        capabilityKey,
        description:
          dto.description === undefined
            ? undefined
            : this.normalizeOptionalText(dto.description),
        config:
          dto.config === undefined
            ? undefined
            : dto.config === null
              ? Prisma.JsonNull
              : (dto.config as Prisma.InputJsonValue),
        isActive: dto.isActive,
        riskLevel: dto.riskLevel,
      },
      include: SKILL_DETAIL_INCLUDE,
    });
    return toSkillResponse(row);
  }

  async replaceTools(
    skillId: number,
    dto: ReplaceSkillToolsDto,
  ): Promise<SkillResponse> {
    const existing = await this.getSkillOrThrow(skillId);
    const toolBindings = this.normalizeToolBindings(dto.tools);
    await this.assertToolsBoundToAgent(existing.agentId, toolBindings);

    const riskLevel = resolveSkillRiskLevel({
      explicit: existing.riskLevel,
      toolRiskLevels: await this.fetchToolRiskLevels(
        toolBindings.map((item) => item.toolId),
      ),
    });
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.skillTool.deleteMany({ where: { skillId } });
      if (toolBindings.length > 0) {
        await tx.skillTool.createMany({
          data: toolBindings.map((item) => ({
            skillId,
            toolId: item.toolId,
            isRequired: item.isRequired,
          })),
        });
      }
      return tx.skill.update({
        where: { id: skillId },
        data: { riskLevel },
        include: SKILL_DETAIL_INCLUDE,
      });
    });
    return toSkillResponse(row);
  }

  async remove(skillId: number): Promise<SkillResponse> {
    const row = await this.getSkillOrThrow(skillId);
    await this.prisma.skill.delete({ where: { id: skillId } });
    return toSkillResponse(row);
  }

  private async getSkillOrThrow(skillId: number) {
    const row = await this.prisma.skill.findUnique({
      where: { id: skillId },
      include: SKILL_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`skill ${skillId} not found`);
    }
    return row;
  }

  private buildWhere(
    agentId: number,
    query: QuerySkillDto,
  ): Prisma.SkillWhereInput {
    return {
      agentId,
      ...this.buildFilterFields(query),
    };
  }

  private buildFilterFields(
    query: QuerySkillDto,
  ): Prisma.SkillWhereInput {
    const where: Prisma.SkillWhereInput = {};
    if (query.id != null) {
      where.id = query.id;
    }
    if (query.isActive != null) {
      where.isActive = query.isActive;
    }
    if (query.riskLevel != null) {
      where.riskLevel = query.riskLevel;
    }
    if (query.name?.trim()) {
      where.name = { contains: query.name.trim(), mode: 'insensitive' };
    }
    if (query.capabilityKey?.trim()) {
      where.capabilityKey = {
        contains: query.capabilityKey.trim(),
        mode: 'insensitive',
      };
    }
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { capabilityKey: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private buildOrderBy(
    orderBy?: SkillOrderByField,
    order?: 'asc' | 'desc',
  ): Prisma.SkillOrderByWithRelationInput {
    const direction = resolveSortOrder(order);
    switch (orderBy ?? 'createdAt') {
      case 'id':
        return { id: direction };
      case 'name':
        return { name: direction };
      case 'capabilityKey':
        return { capabilityKey: direction };
      case 'isActive':
        return { isActive: direction };
      case 'riskLevel':
        return { riskLevel: direction };
      case 'updatedAt':
        return { updatedAt: direction };
      case 'createdAt':
      default:
        return { createdAt: direction };
    }
  }

  private normalizeToolBindings(
    tools: SkillToolBindingItemDto[] | undefined,
  ): Array<{ toolId: number; isRequired: boolean }> {
    if (!tools?.length) {
      return [];
    }
    const seen = new Set<number>();
    const normalized: Array<{ toolId: number; isRequired: boolean }> = [];
    for (const item of tools) {
      if (seen.has(item.toolId)) {
        throw new BadRequestException(
          `duplicate toolId in skill tools: ${item.toolId}`,
        );
      }
      seen.add(item.toolId);
      normalized.push({
        toolId: item.toolId,
        isRequired: item.isRequired ?? false,
      });
    }
    return normalized;
  }

  private async assertToolsBoundToAgent(
    agentId: number,
    bindings: Array<{ toolId: number; isRequired: boolean }>,
  ): Promise<void> {
    if (bindings.length === 0) {
      return;
    }
    const toolIds = bindings.map((item) => item.toolId);
    const rows = await this.prisma.agentTool.findMany({
      where: {
        agentId,
        toolId: { in: toolIds },
      },
      select: { toolId: true },
    });
    if (rows.length !== toolIds.length) {
      const found = new Set(rows.map((row) => row.toolId));
      const missing = toolIds.filter((id) => !found.has(id));
      throw new BadRequestException(
        `tool id(s) must be bound to agent ${agentId}: ${missing.join(', ')}`,
      );
    }
  }

  private async assertAppClientExists(appClientId: number): Promise<void> {
    const row = await this.prisma.appClient.findUnique({
      where: { id: appClientId },
      select: { id: true },
    });
    if (!row) {
      throw new BadRequestException(`appClient ${appClientId} not found`);
    }
  }

  private async assertAgentInAppClient(
    agentId: number,
    appClientId: number,
  ): Promise<void> {
    await this.assertAppClientExists(appClientId);
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, appClientId },
      select: { id: true },
    });
    if (!agent) {
      throw new NotFoundException(
        `agent ${agentId} not found under appClient ${appClientId}`,
      );
    }
  }

  private async fetchToolRiskLevels(toolIds: number[]): Promise<ToolLevel[]> {
    if (toolIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.tool.findMany({
      where: { id: { in: toolIds } },
      select: { riskLevel: true },
    });
    return rows.map((row) => row.riskLevel);
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    if (value == null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
