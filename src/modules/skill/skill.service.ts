import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ToolLevel } from '../../../generated/prisma/client';
import {
  type PaginatedResult,
  resolvePagination,
  toPaginatedResult,
} from '../../common/pagination';
import { skillRequiresWriteConfirmation } from '../../core/risk/risk-level.util';
import {
  filterRunnableSkills,
  normalizeSkillRunnableCapabilities,
  skillIsVisibleOnClientPage,
  skillMatchesPageHostTools,
} from '../../core/skill/skill-runnable.util';
import { SkillService as SkillRuntimeService } from '../../core/skill/skill.service';
import { RuntimeCacheInvalidator } from '../../core/runtime-cache/runtime-cache-invalidator.service';
import { buildAgentSkillVisibilityWhere } from '../../core/runtime-cache/capability-candidate.util';
import { loadAgentSkillVisibilityContext } from '../../core/runtime-cache/agent-capability-load.util';
import { AgentHostToolCatalogService } from '../../core/runtime-cache/agent-host-tool-catalog.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentService } from '../agent/agent.service';
import { WorkflowService } from '../workflow/workflow.service';
import { normalizeCapabilityKey } from './util/skill-capability-key.util';
import { CreateSkillDto } from './dto/create-skill.dto';
import { QueryClientSkillByAgentDto } from './dto/query-client-skill-by-agent.dto';
import { QuerySkillDto } from './dto/query-skill.dto';
import { ReplaceSkillToolsDto } from './dto/skill-tool-binding.dto';
import type { SkillToolBindingItemDto } from './dto/skill-tool-binding.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { toSkillListResponseList, toSkillResponse } from './mapper/skill.mapper';
import { resolveSkillRiskLevel } from './util/skill-risk.util';
import {
  buildSkillFilterFields,
  buildSkillOrderBy,
  buildSkillWhereForAppClient,
} from './util/skill-query.util';
import {
  SKILL_DETAIL_INCLUDE,
  SKILL_LIST_INCLUDE,
  type SkillClientListItem,
  type SkillResponse,
} from './types/skill.types';

@Injectable()
export class SkillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skillRuntime: SkillRuntimeService,
    private readonly agentService: AgentService,
    private readonly runtimeCacheInvalidator: RuntimeCacheInvalidator,
    private readonly hostToolCatalogService: AgentHostToolCatalogService,
    private readonly workflowService: WorkflowService,
  ) {}

  async create(
    agentId: number,
    appClientId: number,
    dto: CreateSkillDto,
  ): Promise<SkillResponse> {
    await this.assertAgentInAppClient(agentId, appClientId);
    return this.createForAppClient(appClientId, dto, agentId);
  }

  async createForAppClient(
    appClientId: number,
    dto: CreateSkillDto,
    linkAgentId?: number,
  ): Promise<SkillResponse> {
    await this.assertAppClientExists(appClientId);
    if (linkAgentId != null) {
      await this.assertAgentInAppClient(linkAgentId, appClientId);
    }
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
    await this.assertToolsInApp(appClientId, toolBindings);
    const riskLevel = resolveSkillRiskLevel({
      explicit: dto.riskLevel,
      toolRiskLevels: await this.fetchToolRiskLevels(
        toolBindings.map((item) => item.toolId),
      ),
    });
    if (dto.workflowId != null) {
      await this.workflowService.assertWorkflowReferenceCompatible({
        workflowId: dto.workflowId,
        appClientId,
        entry: 'skill',
      });
      await this.assertSkillWorkflowBindingsIfNeeded({
        workflowId: dto.workflowId,
        workflowVersion: dto.workflowVersion,
        appClientId,
        skillToolIds: toolBindings.map((item) => item.toolId),
        skillHostToolIds: [],
      });
    }

    const row = await this.prisma.skill.create({
      data: {
        appClientId,
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
        workflowId: dto.workflowId ?? undefined,
        workflowVersion: dto.workflowVersion ?? undefined,
        workflowOverrides:
          dto.workflowOverrides === undefined
            ? undefined
            : dto.workflowOverrides === null
              ? Prisma.JsonNull
              : (dto.workflowOverrides as Prisma.InputJsonValue),
        skillTools:
          toolBindings.length > 0
            ? {
                create: toolBindings.map((item) => ({
                  toolId: item.toolId,
                  isRequired: item.isRequired,
                })),
              }
            : undefined,
        ...(linkAgentId != null
          ? {
              agentSkills: {
                create: [{ agentId: linkAgentId }],
              },
            }
          : {}),
      },
      include: SKILL_DETAIL_INCLUDE,
    });
    await this.invalidateAppClientSkillCaches(appClientId);
    return toSkillResponse(row);
  }

  async findPageByAgent(
    agentId: number,
    appClientId: number,
    query: QuerySkillDto,
  ): Promise<PaginatedResult<SkillResponse>> {
    await this.assertAgentInAppClient(agentId, appClientId);
    const skillCtx = await loadAgentSkillVisibilityContext(
      this.prisma,
      appClientId,
      agentId,
    );
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where: Prisma.SkillWhereInput = {
      ...buildAgentSkillVisibilityWhere({
        appClientId,
        agentId,
        restrictSkills: skillCtx.restrictSkills,
        skillWhitelistIds: skillCtx.skillWhitelistIds,
      }),
      ...buildSkillFilterFields(query),
    };
    const orderBy = buildSkillOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        orderBy,
        skip,
        take,
        include: SKILL_LIST_INCLUDE,
      }),
      this.prisma.skill.count({ where }),
    ]);
    return toPaginatedResult(
      toSkillListResponseList(rows),
      total,
      page,
      pageSize,
    );
  }

  /**
   * C 端：按 agentId 返回当前用户可选且可运行的 active Skill 摘要。
   * 角色可见 + Skill 至少有一个可运行能力：HTTP Tool 与用户允许 Tool 有交集，
   * 或 SkillHostTool 落在 Agent Host Tool 白名单内（与 POST messages skillId 校验一致）。
   */
  async findClientListByAgentForUser(
    agentId: number,
    userId: number,
    appClientId: number,
    query: QueryClientSkillByAgentDto = {},
  ): Promise<SkillClientListItem[]> {
    await this.assertAgentInAppClient(agentId, appClientId);
    const allowedTools = await this.agentService.getAllowedTools(
      agentId,
      userId,
      appClientId,
    );
    const allowedToolIds = new Set(allowedTools.map((tool) => tool.id));
    const rows = filterRunnableSkills(
      await this.skillRuntime.listAgentSkillsForUser({
        agentId,
        userId,
        appClientId,
      }),
      allowedToolIds,
    );
    const filtered = rows.filter((row) =>
      this.matchesClientSkillQuery(row, query),
    );
    const pageScope = query.page?.trim() ?? '';
    const pageHostToolIds =
      pageScope.length > 0
        ? await this.resolvePageScopedHostToolIds(
            appClientId,
            agentId,
            pageScope,
          )
        : null;
    const pageFiltered =
      pageHostToolIds != null
        ? filtered.filter((row) =>
            skillIsVisibleOnClientPage(
              normalizeSkillRunnableCapabilities(row),
              pageHostToolIds,
            ),
          )
        : filtered;
    return pageFiltered.map((row) => {
      const item: SkillClientListItem = {
        id: row.id,
        name: row.name,
        description: row.description,
        capabilityKey: row.capabilityKey,
        riskLevel: row.riskLevel,
        requiresWriteConfirmation: skillRequiresWriteConfirmation(row.riskLevel),
        toolIds: row.toolIds,
        hostToolIds: row.hostToolIds,
      };
      if (pageHostToolIds != null) {
        item.pageMatched = skillMatchesPageHostTools(
          normalizeSkillRunnableCapabilities(row),
          pageHostToolIds,
        );
      }
      return item;
    });
  }

  private async resolvePageScopedHostToolIds(
    appClientId: number,
    agentId: number,
    pageScope: string,
  ): Promise<Set<number>> {
    const { tools } = await this.hostToolCatalogService.resolveLlmHostTools({
      appClientId,
      agentId,
      skillId: null,
      pageScope,
    });
    return new Set(tools.map((tool) => tool.id));
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
    const where = buildSkillWhereForAppClient(
      appClientId,
      query,
      query.agentId,
    );
    const orderBy = buildSkillOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        orderBy,
        skip,
        take,
        include: SKILL_LIST_INCLUDE,
      }),
      this.prisma.skill.count({ where }),
    ]);
    return toPaginatedResult(
      toSkillListResponseList(rows),
      total,
      page,
      pageSize,
    );
  }

  async findOne(skillId: number): Promise<SkillResponse> {
    return toSkillResponse(await this.getSkillOrThrow(skillId));
  }

  async update(skillId: number, dto: UpdateSkillDto): Promise<SkillResponse> {
    const existing = await this.getSkillOrThrow(skillId);
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
    if (dto.workflowId != null) {
      await this.workflowService.assertWorkflowReferenceCompatible({
        workflowId: dto.workflowId,
        appClientId: existing.appClientId,
        entry: 'skill',
      });
    }

    const nextWorkflowId =
      dto.workflowId !== undefined ? dto.workflowId : existing.workflowId;
    const nextWorkflowVersion =
      dto.workflowVersion !== undefined
        ? dto.workflowVersion
        : existing.workflowVersion;
    if (nextWorkflowId != null && nextWorkflowId > 0) {
      await this.assertSkillWorkflowBindingsIfNeeded({
        workflowId: nextWorkflowId,
        workflowVersion: nextWorkflowVersion,
        appClientId: existing.appClientId,
        skillToolIds: existing.skillTools.map((row) => row.toolId),
        skillHostToolIds: existing.skillHostTools.map((row) => row.hostToolId),
      });
    }
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
        ...(dto.workflowId !== undefined
          ? { workflowId: dto.workflowId }
          : {}),
        ...(dto.workflowVersion !== undefined
          ? { workflowVersion: dto.workflowVersion }
          : {}),
        ...(dto.workflowOverrides !== undefined
          ? {
              workflowOverrides:
                dto.workflowOverrides === null
                  ? Prisma.JsonNull
                  : (dto.workflowOverrides as Prisma.InputJsonValue),
            }
          : {}),
      },
      include: SKILL_DETAIL_INCLUDE,
    });
    await this.invalidateAppClientSkillCaches(existing.appClientId);
    return toSkillResponse(row);
  }

  async replaceTools(
    skillId: number,
    dto: ReplaceSkillToolsDto,
  ): Promise<SkillResponse> {
    const existing = await this.getSkillOrThrow(skillId);
    const toolBindings = this.normalizeToolBindings(dto.tools);
    await this.assertToolsInApp(existing.appClientId, toolBindings);

    if (existing.workflowId != null && existing.workflowId > 0) {
      await this.assertSkillWorkflowBindingsIfNeeded({
        workflowId: existing.workflowId,
        workflowVersion: existing.workflowVersion,
        appClientId: existing.appClientId,
        skillToolIds: toolBindings.map((item) => item.toolId),
        skillHostToolIds: existing.skillHostTools.map((row) => row.hostToolId),
      });
    }

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
    await this.invalidateAppClientSkillCaches(existing.appClientId);
    return toSkillResponse(row);
  }

  async remove(skillId: number): Promise<SkillResponse> {
    const row = await this.getSkillOrThrow(skillId);
    await this.prisma.skill.delete({ where: { id: skillId } });
    await this.invalidateAppClientSkillCaches(row.appClientId);
    return toSkillResponse(row);
  }

  private async invalidateAppClientSkillCaches(
    appClientId: number,
  ): Promise<void> {
    await this.runtimeCacheInvalidator.invalidateForAppClient(appClientId);
  }

  private async invalidateAgentRuntimeCache(
    agentId: number,
    appClientId: number,
  ): Promise<void> {
    await this.runtimeCacheInvalidator.invalidateForSkillAgent(
      agentId,
      appClientId,
    );
  }

  private matchesClientSkillQuery(
    row: {
      name: string;
      description: string | null;
      capabilityKey: string | null;
    },
    query: QueryClientSkillByAgentDto,
  ): boolean {
    if (query.name?.trim()) {
      const needle = query.name.trim().toLowerCase();
      if (!row.name.toLowerCase().includes(needle)) {
        return false;
      }
    }
    if (query.capabilityKey?.trim()) {
      const needle = query.capabilityKey.trim().toLowerCase();
      if (!row.capabilityKey?.toLowerCase().includes(needle)) {
        return false;
      }
    }
    if (query.keyword?.trim()) {
      const needle = query.keyword.trim().toLowerCase();
      const haystacks = [
        row.name,
        row.description ?? '',
        row.capabilityKey ?? '',
      ];
      if (!haystacks.some((text) => text.toLowerCase().includes(needle))) {
        return false;
      }
    }
    return true;
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

  private async assertToolsInApp(
    appClientId: number,
    bindings: Array<{ toolId: number; isRequired: boolean }>,
  ): Promise<void> {
    if (bindings.length === 0) {
      return;
    }
    const toolIds = bindings.map((item) => item.toolId);
    const rows = await this.prisma.tool.findMany({
      where: {
        appClientId,
        id: { in: toolIds },
        isActive: true,
      },
      select: { id: true },
    });
    if (rows.length !== toolIds.length) {
      const found = new Set(rows.map((row) => row.id));
      const missing = toolIds.filter((id) => !found.has(id));
      throw new BadRequestException(
        `tool id(s) must belong to appClient ${appClientId} and be active: ${missing.join(', ')}`,
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

  private async assertSkillWorkflowBindingsIfNeeded(input: {
    workflowId: number;
    workflowVersion?: number | null;
    appClientId: number;
    skillToolIds: number[];
    skillHostToolIds: number[];
  }): Promise<void> {
    await this.workflowService.assertSkillWorkflowBindingsCompatible(input);
  }
}
