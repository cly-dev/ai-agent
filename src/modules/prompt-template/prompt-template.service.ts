import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, PromptTemplate } from '../../../generated/prisma/client';
import {
  type PaginatedResult,
  resolvePagination,
  toPaginatedResult,
} from '../../common/pagination';
import {
  getPromptTemplateCatalogItem,
  isAllowedPromptTemplateKey,
  listCreatablePromptTemplateKeys,
} from '../../core/prompt/prompt-template.catalog';
import { PromptRegistryService } from '../../core/prompt/prompt-registry.service';
import type { PromptResolveScope } from '../../core/prompt/prompt-registry.types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromptTemplateVersionDto } from './dto/create-prompt-template-version.dto';
import { QueryPromptTemplateDto } from './dto/query-prompt-template.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';

@Injectable()
export class PromptTemplateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promptRegistry: PromptRegistryService,
  ) {}

  listCreatableKeys() {
    return { keys: listCreatablePromptTemplateKeys() };
  }

  async findPage(
    query: QueryPromptTemplateDto,
  ): Promise<PaginatedResult<PromptTemplate>> {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where = this.buildWhere(query);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.promptTemplate.findMany({
        where,
        orderBy: [
          { key: 'asc' },
          { appClientId: 'asc' },
          { agentId: 'asc' },
          { version: 'desc' },
        ],
        skip,
        take,
      }),
      this.prisma.promptTemplate.count({ where }),
    ]);
    return toPaginatedResult(rows, total, page, pageSize);
  }

  async findOne(id: number): Promise<PromptTemplate> {
    const row = await this.prisma.promptTemplate.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`prompt template ${id} not found`);
    }
    return row;
  }

  async createVersion(
    dto: CreatePromptTemplateVersionDto,
  ): Promise<PromptTemplate> {
    const key = dto.key.trim();
    if (!isAllowedPromptTemplateKey(key)) {
      throw new BadRequestException(
        `prompt key "${key}" is not allowed; use GET /prompt-template/keys`,
      );
    }
    const locale = dto.locale?.trim() || 'zh-CN';
    const appClientId = dto.appClientId ?? null;
    const agentId = dto.agentId ?? null;
    if (agentId != null && appClientId == null) {
      throw new BadRequestException(
        'agentId requires appClientId for scoped prompts',
      );
    }
    if (appClientId != null) {
      await this.assertAppClientExists(appClientId);
    }
    if (agentId != null) {
      await this.assertAgentExists(agentId, appClientId);
    }

    const catalog = getPromptTemplateCatalogItem(key);
    const max = await this.prisma.promptTemplate.aggregate({
      where: { key, appClientId, agentId, locale },
      _max: { version: true },
    });
    const version = (max._max.version ?? 0) + 1;

    const row = await this.prisma.promptTemplate.create({
      data: {
        key,
        version,
        appClientId,
        agentId,
        locale,
        category: dto.category?.trim() || catalog?.category || null,
        title: dto.title?.trim() || catalog?.title || null,
        description: dto.description?.trim() || catalog?.description || null,
        content: dto.content,
        isActive: false,
      },
    });

    if (dto.publish === true) {
      return this.publish(row.id);
    }
    return row;
  }

  async update(
    id: number,
    dto: UpdatePromptTemplateDto,
  ): Promise<PromptTemplate> {
    await this.findOne(id);
    const data: Prisma.PromptTemplateUpdateInput = {};

    if (dto.content !== undefined) {
      const content = dto.content.trim();
      if (!content) {
        throw new BadRequestException('content must not be empty');
      }
      data.content = content;
    }
    if (dto.category !== undefined) {
      data.category = dto.category.trim() || null;
    }
    if (dto.title !== undefined) {
      data.title = dto.title.trim() || null;
    }
    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('at least one field is required to update');
    }

    const updated = await this.prisma.promptTemplate.update({
      where: { id },
      data,
    });
    if (updated.isActive) {
      await this.promptRegistry.syncActiveRowToRedis(updated);
    }
    return updated;
  }

  async remove(id: number): Promise<{ deleted: PromptTemplate }> {
    const row = await this.findOne(id);
    if (row.isActive) {
      throw new BadRequestException(
        'cannot delete an active prompt template; publish another version first',
      );
    }

    const scopeWhere = this.scopeWhere(row);
    const versionCount = await this.prisma.promptTemplate.count({
      where: scopeWhere,
    });
    if (versionCount <= 1) {
      throw new BadRequestException(
        'cannot delete the last version for this key and scope; at least one version must remain',
      );
    }

    await this.prisma.promptTemplate.delete({ where: { id } });
    return { deleted: row };
  }

  async publish(id: number): Promise<PromptTemplate> {
    const row = await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.promptTemplate.updateMany({
        where: {
          key: row.key,
          appClientId: row.appClientId,
          agentId: row.agentId,
          locale: row.locale,
          isActive: true,
        },
        data: { isActive: false },
      }),
      this.prisma.promptTemplate.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);
    const published = await this.findOne(id);
    await this.promptRegistry.syncActiveRowToRedis(published);
    return published;
  }

  async previewResolve(
    key: string,
    scope: PromptResolveScope,
    variables?: Record<string, string | number | boolean | undefined>,
  ): Promise<{ content: string; resolved: Awaited<ReturnType<PromptRegistryService['resolve']>> }> {
    const resolved = await this.promptRegistry.resolve(key, scope);
    const content = await this.promptRegistry.render(key, scope, variables ?? {});
    return { content, resolved };
  }

  private scopeWhere(
    row: Pick<PromptTemplate, 'key' | 'appClientId' | 'agentId' | 'locale'>,
  ): Prisma.PromptTemplateWhereInput {
    return {
      key: row.key,
      appClientId: row.appClientId,
      agentId: row.agentId,
      locale: row.locale,
    };
  }

  private buildWhere(query: QueryPromptTemplateDto): Prisma.PromptTemplateWhereInput {
    const where: Prisma.PromptTemplateWhereInput = {};
    if (query.key?.trim()) {
      where.key = { contains: query.key.trim(), mode: 'insensitive' };
    }
    if (query.appClientId != null) {
      where.appClientId = query.appClientId;
    }
    if (query.agentId != null) {
      where.agentId = query.agentId;
    }
    if (query.locale?.trim()) {
      where.locale = query.locale.trim();
    }
    if (query.isActive != null) {
      where.isActive = query.isActive;
    }
    return where;
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

  private async assertAgentExists(
    agentId: number,
    appClientId: number | null,
  ): Promise<void> {
    const row = await this.prisma.agent.findFirst({
      where: {
        id: agentId,
        ...(appClientId != null ? { appClientId } : {}),
      },
      select: { id: true },
    });
    if (!row) {
      throw new BadRequestException(`agent ${agentId} not found`);
    }
  }
}
