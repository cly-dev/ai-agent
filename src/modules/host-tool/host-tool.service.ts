import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  HostToolSkillTrigger,
  Prisma,
} from '../../../generated/prisma/client';
import {
  resolvePagination,
  toPaginatedResult,
  type PaginatedResult,
} from '../../common/pagination';
import {
  resolveHostToolArgsTemplate,
  resolveHostToolPageScope,
  type AgentChatPageContext,
  type HostActionHostToolInvocation,
  type HostToolDecisionDefinition,
} from '../../core/host-bridge';
import {
  isHostToolResolveDebugEnabled,
  logHostToolResolve,
} from '../../core/host-bridge/host-tool-resolve-debug.util';
import {
  buildHostToolCatalogFilterDiagnostics,
  resolveLlmHostToolsFromCatalog,
  resolvePreferredHostToolIdsFromCatalog,
} from '../../core/runtime-cache/host-tool-catalog-resolve.util';
import { AgentHostToolCatalogService } from '../../core/runtime-cache/agent-host-tool-catalog.service';
import { loadAgentHostToolCandidateIds } from '../../core/runtime-cache/agent-capability-load.util';
import { RuntimeCacheInvalidator } from '../../core/runtime-cache/runtime-cache-invalidator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowService } from '../workflow/workflow.service';
import {
  CreateHostPageDto,
  UpdateHostPageDto,
} from './dto/host-page.dto';
import {
  CreateHostToolDto,
  QueryClientHostToolDto,
  QueryHostPageDto,
  QueryHostToolDto,
  RegisterClientHostToolsDto,
  UpdateHostToolDto,
} from './dto/host-tool.dto';
import {
  BindAgentHostToolsDto,
  ReplaceSkillHostToolsDto,
} from './dto/host-tool-binding.dto';
import {
  toAgentHostToolsBindingResponse,
  toClientHostToolCatalogItem,
  toHostPageResponse,
  toHostToolResponse,
  toSkillHostToolsBindingResponse,
} from './host-tool.mapper';
import {
  HOST_PAGE_DETAIL_INCLUDE,
  HOST_TOOL_DETAIL_INCLUDE,
  type ClientHostToolCatalogItem,
  type HostPageResponse,
  type HostToolResponse,
} from './host-tool.types';

export type ClientHostToolRegisterResultItem = {
  name: string;
  id: number;
  created: boolean;
  tool?: HostToolResponse;
};

export type ClientHostToolRegisterSkippedItem = {
  name: string;
  id: number;
  reason: 'already_exists';
};

export type ClientHostToolRegisterResult = {
  created: ClientHostToolRegisterResultItem[];
  skipped: ClientHostToolRegisterSkippedItem[];
};

const LLM_SKILL_TRIGGERS: HostToolSkillTrigger[] = [
  HostToolSkillTrigger.LLM_SCOPED,
  HostToolSkillTrigger.ON_PLAN_STEP,
];

@Injectable()
export class HostToolService {
  private readonly logger = new Logger(HostToolService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hostToolCatalogService: AgentHostToolCatalogService,
    private readonly runtimeCacheInvalidator: RuntimeCacheInvalidator,
    private readonly workflowService: WorkflowService,
  ) {}

  // ── HostPage ─────────────────────────────────────────────────────────────

  async createHostPage(dto: CreateHostPageDto): Promise<HostPageResponse> {
    await this.assertAppClientExists(dto.appClientId);
    const row = await this.prisma.hostPage.create({
      data: {
        appClientId: dto.appClientId,
        scope: dto.scope.trim(),
        label: dto.label.trim(),
        description: dto.description?.trim() || null,
        routePattern: dto.routePattern?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: HOST_PAGE_DETAIL_INCLUDE,
    });
    return toHostPageResponse(row);
  }

  async findHostPagePage(
    appClientId: number,
    query: QueryHostPageDto,
  ): Promise<PaginatedResult<HostPageResponse>> {
    await this.assertAppClientExists(appClientId);
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where: Prisma.HostPageWhereInput = {
      appClientId,
      ...(query.id != null ? { id: query.id } : {}),
      ...(query.isActive != null ? { isActive: query.isActive } : {}),
      ...(query.scope?.trim()
        ? { scope: { contains: query.scope.trim(), mode: 'insensitive' } }
        : {}),
      ...(query.keyword?.trim()
        ? {
            OR: [
              { scope: { contains: query.keyword.trim(), mode: 'insensitive' } },
              { label: { contains: query.keyword.trim(), mode: 'insensitive' } },
              {
                description: {
                  contains: query.keyword.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.hostPage.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: HOST_PAGE_DETAIL_INCLUDE,
      }),
      this.prisma.hostPage.count({ where }),
    ]);
    return toPaginatedResult(
      rows.map(toHostPageResponse),
      total,
      page,
      pageSize,
    );
  }

  async findHostPageOne(id: number): Promise<HostPageResponse> {
    const row = await this.prisma.hostPage.findUnique({
      where: { id },
      include: HOST_PAGE_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`host page ${id} not found`);
    }
    return toHostPageResponse(row);
  }

  async updateHostPage(
    id: number,
    dto: UpdateHostPageDto,
  ): Promise<HostPageResponse> {
    await this.findHostPageOne(id);
    const row = await this.prisma.hostPage.update({
      where: { id },
      data: {
        scope: dto.scope?.trim(),
        label: dto.label?.trim(),
        description: dto.description,
        routePattern: dto.routePattern,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
      include: HOST_PAGE_DETAIL_INCLUDE,
    });
    await this.invalidateHostToolsForHostPage(id);
    return toHostPageResponse(row);
  }

  async removeHostPage(id: number): Promise<HostPageResponse> {
    const existing = await this.findHostPageOne(id);
    await this.invalidateHostToolsForHostPage(id);
    await this.prisma.hostPage.delete({ where: { id } });
    return existing;
  }

  private async invalidateHostToolsForHostPage(hostPageId: number): Promise<void> {
    const hostTools = await this.prisma.hostTool.findMany({
      where: { hostPageId },
      select: { id: true },
    });
    if (hostTools.length > 0) {
      await this.runtimeCacheInvalidator.invalidateForHostTools(
        hostTools.map((row) => row.id),
      );
    }
  }

  // ── HostTool ─────────────────────────────────────────────────────────────

  async createHostTool(dto: CreateHostToolDto): Promise<HostToolResponse> {
    await this.assertAppClientExists(dto.appClientId);
    if (dto.hostPageId != null) {
      await this.assertHostPageInApp(dto.hostPageId, dto.appClientId);
    }
    const row = await this.prisma.hostTool.create({
      data: {
        appClientId: dto.appClientId,
        hostPageId: dto.hostPageId ?? null,
        definitionKey: dto.definitionKey.trim(),
        name: dto.name.trim(),
        description: dto.description,
        argsSchema: dto.argsSchema as Prisma.InputJsonValue,
        argsTemplate:
          dto.argsTemplate == null
            ? undefined
            : (dto.argsTemplate as Prisma.InputJsonValue),
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        config:
          dto.config == null
            ? undefined
            : (dto.config as Prisma.InputJsonValue),
      },
      include: HOST_TOOL_DETAIL_INCLUDE,
    });
    return toHostToolResponse(row);
  }

  async findHostToolPage(
    appClientId: number,
    query: QueryHostToolDto,
  ): Promise<PaginatedResult<HostToolResponse>> {
    await this.assertAppClientExists(appClientId);
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where: Prisma.HostToolWhereInput = {
      appClientId,
      ...(query.id != null ? { id: query.id } : {}),
      ...(query.isActive != null ? { isActive: query.isActive } : {}),
      ...(query.genericOnly === true ? { hostPageId: null } : {}),
      ...(query.scope?.trim()
        ? {
            hostPage: {
              scope: { equals: query.scope.trim(), mode: 'insensitive' },
            },
          }
        : {}),
      ...(query.keyword?.trim()
        ? {
            OR: [
              { name: { contains: query.keyword.trim(), mode: 'insensitive' } },
              {
                definitionKey: {
                  contains: query.keyword.trim(),
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.keyword.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.hostTool.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: HOST_TOOL_DETAIL_INCLUDE,
      }),
      this.prisma.hostTool.count({ where }),
    ]);
    return toPaginatedResult(
      rows.map(toHostToolResponse),
      total,
      page,
      pageSize,
    );
  }

  async findHostToolOne(id: number): Promise<HostToolResponse> {
    const row = await this.prisma.hostTool.findUnique({
      where: { id },
      include: HOST_TOOL_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`host tool ${id} not found`);
    }
    return toHostToolResponse(row);
  }

  async updateHostTool(
    id: number,
    dto: UpdateHostToolDto,
  ): Promise<HostToolResponse> {
    const existing = await this.prisma.hostTool.findUnique({
      where: { id },
      select: { id: true, appClientId: true },
    });
    if (!existing) {
      throw new NotFoundException(`host tool ${id} not found`);
    }
    if (dto.hostPageId != null) {
      await this.assertHostPageInApp(dto.hostPageId, existing.appClientId);
    }
    const row = await this.prisma.hostTool.update({
      where: { id },
      data: {
        hostPageId: dto.hostPageId,
        definitionKey: dto.definitionKey?.trim(),
        name: dto.name?.trim(),
        description: dto.description,
        argsSchema: dto.argsSchema as Prisma.InputJsonValue | undefined,
        argsTemplate:
          dto.argsTemplate === undefined
            ? undefined
            : dto.argsTemplate === null
              ? Prisma.JsonNull
              : (dto.argsTemplate as Prisma.InputJsonValue),
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
        config:
          dto.config === undefined
            ? undefined
            : dto.config === null
              ? Prisma.JsonNull
              : (dto.config as Prisma.InputJsonValue),
      },
      include: HOST_TOOL_DETAIL_INCLUDE,
    });
    await this.runtimeCacheInvalidator.invalidateForHostTools([id]);
    return toHostToolResponse(row);
  }

  async removeHostTool(id: number): Promise<HostToolResponse> {
    const existing = await this.findHostToolOne(id);
    await this.prisma.hostTool.delete({ where: { id } });
    await this.runtimeCacheInvalidator.invalidateForHostTools([id]);
    return existing;
  }

  // ── Agent bindings ───────────────────────────────────────────────────────

  async getHostToolsForAgent(
    agentId: number,
    appClientId: number,
    query: QueryHostToolDto,
  ) {
    await this.assertAgentInAppClient(agentId, appClientId);
    const pageResult = await this.findHostToolPage(appClientId, query);
    const boundIds = new Set(
      (
        await this.prisma.agentHostTool.findMany({
          where: { agentId },
          select: { hostToolId: true },
        })
      ).map((row) => row.hostToolId),
    );
    return {
      agentId,
      appClientId,
      ...pageResult,
      items: pageResult.items.map((item) => ({
        ...item,
        bound: boundIds.has(item.id),
      })),
    };
  }

  async addHostToolsToAgent(
    agentId: number,
    appClientId: number,
    dto: BindAgentHostToolsDto,
  ) {
    await this.assertAgentInAppClient(agentId, appClientId);
    await this.assertHostToolsBelongToApp(dto.hostToolIds, appClientId);
    await this.prisma.agentHostTool.createMany({
      data: dto.hostToolIds.map((hostToolId) => ({ agentId, hostToolId })),
      skipDuplicates: true,
    });
    await this.runtimeCacheInvalidator.invalidateForAgent({ agentId, appClientId });
    await this.runtimeCacheInvalidator.invalidateForHostTools(dto.hostToolIds);
    return this.listAgentHostToolBindings(agentId, appClientId);
  }

  async removeHostToolsFromAgent(
    agentId: number,
    appClientId: number,
    dto: BindAgentHostToolsDto,
  ) {
    await this.assertAgentInAppClient(agentId, appClientId);
    await this.prisma.agentHostTool.deleteMany({
      where: {
        agentId,
        hostToolId: { in: dto.hostToolIds },
      },
    });
    await this.runtimeCacheInvalidator.invalidateForAgent({ agentId, appClientId });
    await this.runtimeCacheInvalidator.invalidateForHostTools(dto.hostToolIds);
    return this.listAgentHostToolBindings(agentId, appClientId);
  }

  private async listAgentHostToolBindings(
    agentId: number,
    appClientId: number,
  ) {
    const bindings = await this.prisma.agentHostTool.findMany({
      where: { agentId },
      include: { hostTool: { include: HOST_TOOL_DETAIL_INCLUDE } },
      orderBy: { id: 'asc' },
    });
    const response = toAgentHostToolsBindingResponse(
      agentId,
      appClientId,
      bindings,
    );
    return {
      ...response,
      /** @deprecated 使用 hostTools */
      items: response.hostTools,
    };
  }

  // ── Skill bindings ─────────────────────────────────────────────────────

  async replaceSkillHostTools(skillId: number, dto: ReplaceSkillHostToolsDto) {
    const skill = await this.getSkillOrThrow(skillId);
    const hostToolIds = dto.tools.map((item) => item.hostToolId);
    await this.assertHostToolsInApp(skill.appClientId, hostToolIds);

    if (skill.workflowId != null && skill.workflowId > 0) {
      const skillTools = await this.prisma.skillTool.findMany({
        where: { skillId },
        select: { toolId: true },
      });
      await this.workflowService.assertSkillWorkflowBindingsCompatible({
        workflowId: skill.workflowId,
        appClientId: skill.appClientId,
        workflowVersion: skill.workflowVersion,
        skillToolIds: skillTools.map((row) => row.toolId),
        skillHostToolIds: hostToolIds,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.skillHostTool.deleteMany({ where: { skillId } });
      if (dto.tools.length > 0) {
        await tx.skillHostTool.createMany({
          data: dto.tools.map((item) => ({
            skillId,
            hostToolId: item.hostToolId,
            trigger: item.trigger ?? HostToolSkillTrigger.ON_MUTATION_SUCCESS,
            argsTemplate:
              item.argsTemplate == null
                ? undefined
                : (item.argsTemplate as Prisma.InputJsonValue),
            priority: item.priority ?? 0,
            isRequired: item.isRequired ?? false,
          })),
        });
      }
    });
    await this.runtimeCacheInvalidator.invalidateForAppClient(skill.appClientId);
    if (hostToolIds.length > 0) {
      await this.runtimeCacheInvalidator.invalidateForHostTools(hostToolIds);
    }
    return this.listSkillHostToolBindings(skillId);
  }

  async listSkillHostToolBindings(skillId: number) {
    const skill = await this.getSkillOrThrow(skillId);
    const bindings = await this.prisma.skillHostTool.findMany({
      where: { skillId },
      include: { hostTool: { include: HOST_TOOL_DETAIL_INCLUDE } },
      orderBy: [{ priority: 'asc' }, { id: 'asc' }],
    });
    const response = toSkillHostToolsBindingResponse(
      skillId,
      skill.appClientId,
      bindings,
    );
    return {
      ...response,
      /** @deprecated 使用 skillHostTools */
      items: response.skillHostTools.map((row) => ({
        ...row.hostTool,
        trigger: row.trigger,
        priority: row.priority,
        isRequired: row.isRequired,
        skillArgsTemplate: row.skillArgsTemplate,
      })),
    };
  }

  // ── Client catalog ─────────────────────────────────────────────────────

  /**
   * C 端幂等注册：App 内 `name` 首次写入 HostTool；已存在则跳过（不更新）。
   * 页内工具可带 scope，自动 ensure HostPage。
   */
  async registerClientHostTools(
    appClientId: number,
    dto: RegisterClientHostToolsDto,
  ): Promise<ClientHostToolRegisterResult> {
    await this.assertAppClientExists(appClientId);
    const batchScope = dto.scope?.trim() || undefined;
    const created: ClientHostToolRegisterResultItem[] = [];
    const skipped: ClientHostToolRegisterSkippedItem[] = [];

    for (const item of dto.tools) {
      const name = item.name.trim();
      const itemScope = item.scope?.trim() || batchScope;
      const isGeneric = item.generic === true || !itemScope;

      const existing = await this.prisma.hostTool.findUnique({
        where: {
          appClientId_name: { appClientId, name },
        },
        select: { id: true, name: true },
      });
      if (existing) {
        skipped.push({
          name: existing.name,
          id: existing.id,
          reason: 'already_exists',
        });
        continue;
      }

      let hostPageId: number | null = null;
      if (!isGeneric && itemScope) {
        hostPageId = await this.ensureHostPageForScope(
          appClientId,
          itemScope,
          dto.pageLabel,
          dto.routePattern,
        );
      }

      const definitionKey =
        item.definitionKey?.trim() ||
        (isGeneric ? name : `${itemScope}.${name}`);

      const row = await this.prisma.hostTool.create({
        data: {
          appClientId,
          hostPageId,
          definitionKey,
          name,
          description: item.description,
          argsSchema: item.argsSchema as Prisma.InputJsonValue,
          argsTemplate:
            item.argsTemplate == null
              ? undefined
              : (item.argsTemplate as Prisma.InputJsonValue),
          isActive: true,
        },
        include: HOST_TOOL_DETAIL_INCLUDE,
      });
      created.push({
        name: row.name,
        id: row.id,
        created: true,
        tool: toHostToolResponse(row),
      });
    }

    return { created, skipped };
  }

  async findClientCatalog(
    appClientId: number,
    query: QueryClientHostToolDto,
  ): Promise<ClientHostToolCatalogItem[]> {
    const scope = query.scope?.trim() || undefined;
    const where: Prisma.HostToolWhereInput = {
      appClientId,
      isActive: true,
      ...(scope
        ? {
            OR: [{ hostPageId: null }, { hostPage: { scope } }],
          }
        : {}),
      ...(query.agentId != null
        ? {
            agentHostTools: { some: { agentId: query.agentId } },
          }
        : {}),
    };
    const rows = await this.prisma.hostTool.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: HOST_TOOL_DETAIL_INCLUDE,
    });
    return rows.map(toClientHostToolCatalogItem);
  }

  // ── Decision / Plan LLM resolution ─────────────────────────────────────────

  private async resolvePreferredHostToolIds(input: {
    agentId: number;
    skillId: number | null | undefined;
    skillTriggers: HostToolSkillTrigger[];
    runId?: number;
    sessionId?: string;
  }): Promise<{
    preferredIds: number[];
    skillBindings: Array<{
      hostToolId: number;
      argsTemplate: Prisma.JsonValue;
      isRequired: boolean;
    }>;
  }> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: input.agentId },
      select: { appClientId: true },
    });
    if (!agent) {
      return { preferredIds: [], skillBindings: [] };
    }
    const agentBoundIds = await loadAgentHostToolCandidateIds(
      this.prisma,
      agent.appClientId,
      input.agentId,
    );
    if (agentBoundIds.length === 0) {
      logHostToolResolve('resolvePreferredHostToolIds', {
        runId: input.runId ?? null,
        sessionId: input.sessionId ?? null,
        agentId: input.agentId,
        skillId: input.skillId ?? null,
        skillTriggers: input.skillTriggers,
        agentBoundIds,
        preferredIds: [],
        selectionBranch: 'empty_no_agent_bindings',
      });
      return { preferredIds: [], skillBindings: [] };
    }

    const allSkillBindings =
      input.skillId != null
        ? await this.prisma.skillHostTool.findMany({
            where: {
              skillId: input.skillId,
              hostToolId: { in: agentBoundIds },
            },
            orderBy: [{ priority: 'asc' }, { id: 'asc' }],
            select: {
              hostToolId: true,
              argsTemplate: true,
              trigger: true,
              isRequired: true,
            },
          })
        : [];

    const skillBindings = allSkillBindings
      .filter((row) => input.skillTriggers.includes(row.trigger))
      .map((row) => ({
        hostToolId: row.hostToolId,
        argsTemplate: row.argsTemplate,
        isRequired: row.isRequired,
      }));

    let preferredIds: number[];
    let selectionBranch:
      | 'skill_bindings'
      | 'agent_fallback_no_skill_bindings'
      | 'empty_skill_trigger_mismatch'
      | 'agent_whitelist_no_skill';
    if (input.skillId != null) {
      if (skillBindings.length > 0) {
        preferredIds = skillBindings.map((row) => row.hostToolId);
        selectionBranch = 'skill_bindings';
      } else if (allSkillBindings.length === 0) {
        this.logger.warn(
          `skill ${input.skillId} has no SkillHostTool bindings; falling back to AgentHostTool whitelist for triggers [${input.skillTriggers.join(', ')}]`,
        );
        preferredIds = agentBoundIds;
        selectionBranch = 'agent_fallback_no_skill_bindings';
      } else {
        preferredIds = [];
        selectionBranch = 'empty_skill_trigger_mismatch';
      }
    } else {
      preferredIds = agentBoundIds;
      selectionBranch = 'agent_whitelist_no_skill';
    }

    logHostToolResolve('resolvePreferredHostToolIds', {
      runId: input.runId ?? null,
      sessionId: input.sessionId ?? null,
      agentId: input.agentId,
      skillId: input.skillId ?? null,
      skillTriggers: input.skillTriggers,
      agentBoundIds,
      allSkillBindings: allSkillBindings.map((row) => ({
        hostToolId: row.hostToolId,
        trigger: row.trigger,
        isRequired: row.isRequired,
      })),
      skillBindingsAfterTriggerFilter: skillBindings.map((row) => row.hostToolId),
      preferredIds,
      selectionBranch,
    });

    return { preferredIds, skillBindings };
  }

  private async findScopedHostToolRows(input: {
    appClientId: number;
    pageScope: string;
    preferredIds: number[];
    runId?: number;
    sessionId?: string;
    agentId?: number;
    skillId?: number | null;
  }) {
    if (input.preferredIds.length === 0) {
      return [];
    }
    const tools = await this.prisma.hostTool.findMany({
      where: {
        id: { in: input.preferredIds },
        appClientId: input.appClientId,
        isActive: true,
        OR: input.pageScope.trim()
          ? [{ hostPageId: null }, { hostPage: { scope: input.pageScope } }]
          : [{ hostPageId: null }],
      },
      include: HOST_TOOL_DETAIL_INCLUDE,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    const toolById = new Map(tools.map((tool) => [tool.id, tool]));
    const matched = input.preferredIds
      .map((id) => toolById.get(id))
      .filter((tool): tool is NonNullable<typeof tool> => tool != null);

    logHostToolResolve('findScopedHostToolRows', {
      runId: input.runId ?? null,
      sessionId: input.sessionId ?? null,
      agentId: input.agentId ?? null,
      skillId: input.skillId ?? null,
      appClientId: input.appClientId,
      pageScope: input.pageScope,
      preferredIds: input.preferredIds,
      matchedIds: matched.map((tool) => tool.id),
      matchedNames: matched.map((tool) => tool.name),
      droppedPreferredIds: input.preferredIds.filter(
        (id) => !toolById.has(id),
      ),
      ...(isHostToolResolveDebugEnabled()
        ? {
            pageFilterDiagnostics:
              await this.diagnoseHostToolPageFilter(input),
          }
        : {}),
    });

    return matched;
  }

  private async diagnoseHostToolPageFilter(input: {
    appClientId: number;
    pageScope: string;
    preferredIds: number[];
  }) {
    if (input.preferredIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.hostTool.findMany({
      where: {
        id: { in: input.preferredIds },
        appClientId: input.appClientId,
      },
      include: { hostPage: { select: { scope: true } } },
    });
    const rowById = new Map(rows.map((row) => [row.id, row]));
    return input.preferredIds.map((id) => {
      const row = rowById.get(id);
      if (!row) {
        return {
          hostToolId: id,
          status: 'not_found_or_wrong_app_client',
        };
      }
      const reasons: string[] = [];
      if (!row.isActive) {
        reasons.push('inactive');
      }
      const hostPageScope = row.hostPage?.scope ?? null;
      if (row.hostPageId != null && hostPageScope !== input.pageScope) {
        reasons.push(
          `page_mismatch:expected=${input.pageScope},actual=${hostPageScope}`,
        );
      }
      return {
        hostToolId: id,
        name: row.name,
        status: reasons.length === 0 ? 'included' : 'filtered',
        hostPageScope,
        isActive: row.isActive,
        reasons,
      };
    });
  }

  private toHostToolDecisionDefinition(
    tool: Awaited<ReturnType<HostToolService['findScopedHostToolRows']>>[number],
    isRequired = false,
  ): HostToolDecisionDefinition {
    return {
      id: tool.id,
      name: tool.name,
      description: tool.description,
      argsSchema:
        tool.argsSchema &&
        typeof tool.argsSchema === 'object' &&
        !Array.isArray(tool.argsSchema)
          ? (tool.argsSchema as Record<string, unknown>)
          : { type: 'object' },
      hostPageScope: tool.hostPage?.scope ?? null,
      isRequired,
    };
  }

  async resolveLlmHostToolsForDecision(input: {
    appClientId: number;
    agentId: number;
    skillId: number | null | undefined;
    pageContext?: AgentChatPageContext | null;
    runId?: number;
    sessionId?: string;
  }): Promise<HostToolDecisionDefinition[]> {
    const pageScope = resolveHostToolPageScope(input.pageContext) ?? '';
    const catalog = await this.hostToolCatalogService.loadOrWarm(
      input.appClientId,
      input.agentId,
    );
    if (catalog) {
      const { preferredIds } = resolvePreferredHostToolIdsFromCatalog(catalog, {
        skillId: input.skillId,
        skillTriggers: LLM_SKILL_TRIGGERS,
      });
      const tools = resolveLlmHostToolsFromCatalog(catalog, {
        pageScope,
        skillId: input.skillId,
        skillTriggers: LLM_SKILL_TRIGGERS,
      });
      logHostToolResolve('resolveLlmHostToolsForDecision', {
        runId: input.runId ?? null,
        sessionId: input.sessionId ?? null,
        appClientId: input.appClientId,
        agentId: input.agentId,
        skillId: input.skillId ?? null,
        pageScope,
        routePath: input.pageContext?.routePath ?? null,
        source: 'catalog',
        catalogRevision: catalog.revision,
        agentBoundHostToolIds: catalog.agentBoundHostToolIds,
        preferredIds,
        toolCount: tools.length,
        toolNames: tools.map((tool) => tool.name),
        pageFilterDiagnostics: buildHostToolCatalogFilterDiagnostics(catalog, {
          pageScope,
          preferredIds,
        }),
      });
      return tools;
    }

    const tools = await this.resolveLlmHostToolsForDecisionFromDb(input);
    logHostToolResolve('resolveLlmHostToolsForDecision', {
      runId: input.runId ?? null,
      sessionId: input.sessionId ?? null,
      appClientId: input.appClientId,
      agentId: input.agentId,
      skillId: input.skillId ?? null,
      pageScope,
      routePath: input.pageContext?.routePath ?? null,
      source: 'db',
      toolCount: tools.length,
      toolNames: tools.map((tool) => tool.name),
    });
    return tools;
  }

  private async resolveLlmHostToolsForDecisionFromDb(input: {
    appClientId: number;
    agentId: number;
    skillId: number | null | undefined;
    pageContext?: AgentChatPageContext | null;
    runId?: number;
    sessionId?: string;
  }): Promise<HostToolDecisionDefinition[]> {
    const pageScope = resolveHostToolPageScope(input.pageContext) ?? '';

    const { preferredIds, skillBindings } =
      await this.resolvePreferredHostToolIds({
        agentId: input.agentId,
        skillId: input.skillId,
        skillTriggers: LLM_SKILL_TRIGGERS,
        runId: input.runId,
        sessionId: input.sessionId,
      });
    if (preferredIds.length === 0) {
      return [];
    }

    const requiredByToolId = new Map(
      skillBindings.map((row) => [row.hostToolId, row.isRequired]),
    );
    const tools = await this.findScopedHostToolRows({
      appClientId: input.appClientId,
      pageScope,
      preferredIds,
      runId: input.runId,
      sessionId: input.sessionId,
      agentId: input.agentId,
      skillId: input.skillId,
    });
    return tools.map((tool) =>
      this.toHostToolDecisionDefinition(
        tool,
        requiredByToolId.get(tool.id) ?? false,
      ),
    );
  }

  // ── Run completion resolution ────────────────────────────────────────────

  async resolveCompletionHostTools(input: {
    appClientId: number;
    agentId: number;
    skillId: number | null | undefined;
    pageContext?: AgentChatPageContext | null;
  }): Promise<HostActionHostToolInvocation[]> {
    const pageScope = resolveHostToolPageScope(input.pageContext) ?? '';

    const { preferredIds, skillBindings } =
      await this.resolvePreferredHostToolIds({
        agentId: input.agentId,
        skillId: input.skillId,
        skillTriggers: [HostToolSkillTrigger.ON_MUTATION_SUCCESS],
      });
    if (preferredIds.length === 0) {
      return [];
    }

    const orderedTools = await this.findScopedHostToolRows({
      appClientId: input.appClientId,
      pageScope,
      preferredIds,
    });

    const skillTemplateByToolId = new Map(
      skillBindings.map((row) => [row.hostToolId, row.argsTemplate]),
    );

    return orderedTools.map((tool) => ({
      name: tool.name,
      args: resolveHostToolArgsTemplate(
        skillTemplateByToolId.get(tool.id) ?? tool.argsTemplate,
        input.pageContext,
      ),
    }));
  }

  // ── Assertions ─────────────────────────────────────────────────────────

  private async ensureHostPageForScope(
    appClientId: number,
    scope: string,
    pageLabel?: string,
    routePattern?: string,
  ): Promise<number> {
    const existing = await this.prisma.hostPage.findUnique({
      where: { appClientId_scope: { appClientId, scope } },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
    const created = await this.prisma.hostPage.create({
      data: {
        appClientId,
        scope,
        label: pageLabel?.trim() || scope,
        routePattern: routePattern?.trim() || null,
      },
    });
    return created.id;
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

  private async assertHostPageInApp(
    hostPageId: number,
    appClientId: number,
  ): Promise<void> {
    const row = await this.prisma.hostPage.findFirst({
      where: { id: hostPageId, appClientId },
      select: { id: true },
    });
    if (!row) {
      throw new BadRequestException(
        `host page ${hostPageId} not found in appClient ${appClientId}`,
      );
    }
  }

  private async assertAgentInAppClient(
    agentId: number,
    appClientId: number,
  ): Promise<void> {
    const row = await this.prisma.agent.findFirst({
      where: { id: agentId, appClientId },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException(
        `agent ${agentId} not found in appClient ${appClientId}`,
      );
    }
  }

  private async assertHostToolsBelongToApp(
    hostToolIds: number[],
    appClientId: number,
  ): Promise<void> {
    if (hostToolIds.length === 0) {
      return;
    }
    const count = await this.prisma.hostTool.count({
      where: { id: { in: hostToolIds }, appClientId },
    });
    if (count !== hostToolIds.length) {
      throw new BadRequestException(
        'one or more host tools do not belong to this appClient',
      );
    }
  }

  private async assertHostToolsInApp(
    appClientId: number,
    hostToolIds: number[],
  ): Promise<void> {
    if (hostToolIds.length === 0) {
      return;
    }
    const count = await this.prisma.hostTool.count({
      where: {
        appClientId,
        id: { in: hostToolIds },
        isActive: true,
      },
    });
    if (count !== hostToolIds.length) {
      throw new BadRequestException(
        'skill host tools must belong to this appClient and be active',
      );
    }
  }

  private async getSkillOrThrow(skillId: number) {
    const row = await this.prisma.skill.findUnique({
      where: { id: skillId },
      select: {
        id: true,
        appClientId: true,
        workflowId: true,
        workflowVersion: true,
      },
    });
    if (!row) {
      throw new NotFoundException(`skill ${skillId} not found`);
    }
    return row;
  }
}
