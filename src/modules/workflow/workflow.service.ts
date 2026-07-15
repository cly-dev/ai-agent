import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkflowDeliverable } from '../../../generated/prisma/client';
import {
  resolvePagination,
  toPaginatedResult,
  type PaginatedResult,
} from '../../common/pagination';
import {
  parseWorkflowGraphJson,
  parseWorkflowNodesJson,
  serializeWorkflowGraphJson,
} from '../../core/workflow/load-workflow-definition.util';
import {
  synthesizeLinearWorkflowEdges,
  type ParsedWorkflowGraph,
} from '../../core/workflow/graph/workflow-edge.util';
import {
  collectWorkflowNodeBindingRefs,
  resolveWorkflowBindingsForSave,
} from '../../core/workflow/derive-workflow-bindings-from-nodes.util';
import { validateWorkflowDefinition } from '../../core/workflow/validate-workflow.util';
import {
  expandWorkflowPreset,
  listWorkflowPresetCatalog,
  parseWorkflowPresetConfig,
  validateWorkflowPresetInput,
} from '../../core/workflow/workflow-preset.util';
import type { WorkflowPresetKind } from '../../core/workflow/workflow-preset.types';
import type {
  WorkflowBindingRefs,
  WorkflowNodeDef,
  WorkflowProfile,
} from '../../core/workflow/workflow.types';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateWorkflowDto,
  QueryWorkflowDto,
  UpdateWorkflowDto,
  WorkflowHostToolBindingDto,
  WorkflowToolBindingDto,
} from './dto/workflow.dto';
import {
  toWorkflowListItem,
  toWorkflowResponse,
  toWorkflowRevisionResponse,
  toWorkflowRevisionSummaryResponse,
} from './workflow.mapper';
import type {
  WorkflowListItem,
  WorkflowResponse,
  WorkflowRevisionResponse,
  WorkflowRevisionSummaryResponse,
} from './workflow.types';
import {
  WORKFLOW_DETAIL_INCLUDE,
  WORKFLOW_LIST_INCLUDE,
} from './workflow.types';
import type { WorkflowEntryKind } from './workflow-profile.util';

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkflowDto): Promise<WorkflowResponse> {
    await this.assertAppClientExists(dto.appClientId);
    const workflowKey = dto.workflowKey.trim();
    const graph = this.normalizePersistedGraph(
      this.resolveWorkflowGraph({
        profile: dto.profile,
        preset: dto.preset,
        presetConfig: dto.presetConfig,
        nodes: dto.nodes,
        requireExplicitEdges: dto.preset == null,
      }),
    );
    const nodes = graph.nodes;
    const bindingResolution = resolveWorkflowBindingsForSave({
      nodes,
      explicitTools: dto.tools,
      explicitHostTools: dto.hostTools,
    });
    if (bindingResolution.issues.length > 0) {
      throw new BadRequestException({
        code: 'WORKFLOW_BINDING_RESOLUTION_FAILED',
        message:
          'Workflow tool bindings must be declared on node input.toolIds/toolId / input.hostToolIds/hostToolId; tools[] and hostTools[] may only set isRequired for those ids',
        issues: bindingResolution.issues,
      });
    }
    const tools = bindingResolution.tools;
    const hostTools = bindingResolution.hostTools;
    this.assertWorkflowValid({
      workflowKey,
      name: dto.name.trim(),
      profile: dto.profile,
      goal: dto.goal ?? null,
      constraints: dto.constraints ?? [],
      nodes,
      edges: graph.edges,
      entryNodeId: graph.entryNodeId ?? undefined,
      bindings: this.toBindingRefs(tools, hostTools),
    });
    await this.assertBindingsExist(dto.appClientId, tools, hostTools);

    const nodesJson = serializeWorkflowGraphJson(graph) as Prisma.InputJsonValue;

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const created = await tx.workflow.create({
          data: {
            appClientId: dto.appClientId,
            workflowKey,
            name: dto.name.trim(),
            description: dto.description?.trim() || null,
            goal: dto.goal?.trim() || null,
            profile: dto.profile,
            deliverable: dto.deliverable ?? WorkflowDeliverable.answer,
            nodes: nodesJson,
            version: 1,
            constraints: (dto.constraints ?? []) as Prisma.InputJsonValue,
            isActive: dto.isActive ?? true,
            sortOrder: dto.sortOrder ?? 0,
            workflowTools: tools.length
              ? {
                  create: tools.map((item) => ({
                    toolId: item.toolId,
                    isRequired: item.isRequired ?? false,
                  })),
                }
              : undefined,
            workflowHostTools: hostTools.length
              ? {
                  create: hostTools.map((item) => ({
                    hostToolId: item.hostToolId,
                    isRequired: item.isRequired ?? false,
                  })),
                }
              : undefined,
          },
        });
        await tx.workflowRevision.create({
          data: {
            workflowId: created.id,
            version: 1,
            nodes: created.nodes as Prisma.InputJsonValue,
            deliverable: created.deliverable,
            constraints: created.constraints as Prisma.InputJsonValue,
            changeNote: dto.changeNote?.trim() || 'initial version',
          },
        });
        return tx.workflow.findUniqueOrThrow({
          where: { id: created.id },
          include: WORKFLOW_DETAIL_INCLUDE,
        });
      });
      return toWorkflowResponse(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Workflow workflowKey "${workflowKey}" already exists for this AppClient`,
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateWorkflowDto): Promise<WorkflowResponse> {
    const existing = await this.findEntityOrThrow(id);
    if (dto.preset != null && this.isNodesPayloadProvided(dto.nodes)) {
      throw new BadRequestException({
        code: 'WORKFLOW_PRESET_NODES_CONFLICT',
        message: 'Provide either preset + presetConfig or nodes, not both',
      });
    }
    const expandedFromPreset =
      dto.preset != null
        ? this.normalizePersistedGraph(
            this.resolveWorkflowGraph({
              profile: existing.profile as WorkflowProfile,
              preset: dto.preset,
              presetConfig: dto.presetConfig,
              requireExplicitEdges: false,
            }),
          )
        : null;
    if (dto.nodes != null && dto.preset == null) {
      this.assertBEndNodesIncludeEdges(dto.nodes);
    }
    const graphFromDto =
      expandedFromPreset != null
        ? expandedFromPreset
        : dto.nodes != null
          ? this.normalizePersistedGraph(parseWorkflowGraphJson(dto.nodes))
          : null;
    const nodes = graphFromDto?.nodes;
    const tools =
      dto.tools != null ? this.normalizeToolBindings(dto.tools) : undefined;
    const hostTools =
      dto.hostTools != null
        ? this.normalizeHostToolBindings(dto.hostTools)
        : undefined;

    if (dto.isActive === false) {
      await this.assertCanDeactivate(id);
    }

    const existingGraph = this.normalizePersistedGraph(
      parseWorkflowGraphJson(existing.nodes),
    );
    const nextGraph: ParsedWorkflowGraph = graphFromDto ?? existingGraph;
    const nextNodes = nextGraph.nodes;

    const shouldResolveBindings =
      nodes != null || tools != null || hostTools != null;
    const bindingResolution = shouldResolveBindings
      ? resolveWorkflowBindingsForSave({
          nodes: nextNodes,
          explicitTools: tools,
          explicitHostTools: hostTools,
        })
      : null;
    if (bindingResolution?.issues.length) {
      throw new BadRequestException({
        code: 'WORKFLOW_BINDING_RESOLUTION_FAILED',
        message:
          'Workflow tool bindings must be declared on node input.toolIds/toolId / input.hostToolIds/hostToolId; tools[] and hostTools[] may only set isRequired for those ids',
        issues: bindingResolution.issues,
      });
    }
    const resolvedTools =
      bindingResolution?.tools ??
      existing.workflowTools.map((row) => ({
        toolId: row.toolId,
        isRequired: row.isRequired,
      }));
    const resolvedHostTools =
      bindingResolution?.hostTools ??
      existing.workflowHostTools.map((row) => ({
        hostToolId: row.hostToolId,
        isRequired: row.isRequired,
      }));

    const nextBindings = shouldResolveBindings
      ? this.toBindingRefs(resolvedTools, resolvedHostTools)
      : {
          toolIds: existing.workflowTools.map((row) => row.toolId),
          hostToolIds: existing.workflowHostTools.map((row) => row.hostToolId),
        };

    const nodesChanged =
      dto.preset != null ||
      dto.nodes != null ||
      dto.deliverable != null ||
      dto.constraints != null;

    this.assertWorkflowValid({
      workflowKey: existing.workflowKey,
      name: dto.name?.trim() ?? existing.name,
      profile: existing.profile,
      goal: dto.goal !== undefined ? dto.goal : existing.goal,
      constraints:
        dto.constraints ??
        (Array.isArray(existing.constraints)
          ? (existing.constraints as string[])
          : []),
      nodes: nextNodes,
      edges: nextGraph.edges,
      entryNodeId: nextGraph.entryNodeId ?? undefined,
      bindings: nextBindings,
    });

    if (shouldResolveBindings) {
      await this.assertBindingsExist(
        existing.appClientId,
        resolvedTools,
        resolvedHostTools,
      );
    }

    const nodesJson =
      graphFromDto != null
        ? (serializeWorkflowGraphJson(graphFromDto) as Prisma.InputJsonValue)
        : undefined;

    const row = await this.prisma.$transaction(async (tx) => {
      if (shouldResolveBindings) {
        await tx.workflowTool.deleteMany({ where: { workflowId: id } });
        if (resolvedTools.length > 0) {
          await tx.workflowTool.createMany({
            data: resolvedTools.map((item) => ({
              workflowId: id,
              toolId: item.toolId,
              isRequired: item.isRequired ?? false,
            })),
          });
        }
        await tx.workflowHostTool.deleteMany({ where: { workflowId: id } });
        if (resolvedHostTools.length > 0) {
          await tx.workflowHostTool.createMany({
            data: resolvedHostTools.map((item) => ({
              workflowId: id,
              hostToolId: item.hostToolId,
              isRequired: item.isRequired ?? false,
            })),
          });
        }
      }

      const nextVersion = nodesChanged ? existing.version + 1 : existing.version;
      const updated = await tx.workflow.update({
        where: { id },
        data: {
          ...(dto.name != null ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.goal !== undefined ? { goal: dto.goal?.trim() || null } : {}),
          ...(dto.deliverable != null ? { deliverable: dto.deliverable } : {}),
          ...(nodesJson != null ? { nodes: nodesJson } : {}),
          ...(dto.constraints != null
            ? { constraints: dto.constraints as Prisma.InputJsonValue }
            : {}),
          ...(dto.isActive != null ? { isActive: dto.isActive } : {}),
          ...(dto.sortOrder != null ? { sortOrder: dto.sortOrder } : {}),
          ...(nodesChanged ? { version: nextVersion } : {}),
        },
        include: WORKFLOW_DETAIL_INCLUDE,
      });

      if (nodesChanged) {
        await tx.workflowRevision.create({
          data: {
            workflowId: id,
            version: nextVersion,
            nodes: updated.nodes as Prisma.InputJsonValue,
            deliverable: updated.deliverable,
            constraints: updated.constraints as Prisma.InputJsonValue,
            changeNote: dto.changeNote?.trim() || null,
          },
        });
      }

      return updated;
    });

    if (nodesChanged || shouldResolveBindings) {
      await this.assertReferencingSkillsStillCompatible(id);
      await this.assertReferencingPageActionsStillCompatible(id);
    }

    return toWorkflowResponse(row);
  }

  async listPresets(profile?: WorkflowProfile) {
    return listWorkflowPresetCatalog(profile);
  }

  async findOne(id: number): Promise<WorkflowResponse> {
    const row = await this.findEntityOrThrow(id);
    return toWorkflowResponse(row);
  }

  async remove(id: number): Promise<{ ok: true; id: number }> {
    await this.findEntityOrThrow(id);
    await this.prisma.workflow.delete({ where: { id } });
    return { ok: true, id };
  }

  async findPage(
    query: QueryWorkflowDto,
  ): Promise<PaginatedResult<WorkflowListItem>> {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where: Prisma.WorkflowWhereInput = {
      ...(query.appClientId != null ? { appClientId: query.appClientId } : {}),
      ...(query.profile != null ? { profile: query.profile } : {}),
      ...(query.isActive != null ? { isActive: query.isActive } : {}),
      ...(query.keyword?.trim()
        ? {
            OR: [
              { workflowKey: { contains: query.keyword.trim() } },
              { name: { contains: query.keyword.trim() } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.workflow.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: WORKFLOW_LIST_INCLUDE,
      }),
      this.prisma.workflow.count({ where }),
    ]);
    return toPaginatedResult(
      rows.map(toWorkflowListItem),
      total,
      page,
      pageSize,
    );
  }

  async listRevisions(
    workflowId: number,
    query: { limit?: number; summary?: boolean } = {},
  ): Promise<WorkflowRevisionResponse[] | WorkflowRevisionSummaryResponse[]> {
    const workflow = await this.findEntityOrThrow(workflowId);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    if (query.summary) {
      const rows = await this.prisma.workflowRevision.findMany({
        where: { workflowId },
        orderBy: { version: 'desc' },
        take: limit,
        select: {
          id: true,
          workflowId: true,
          version: true,
          deliverable: true,
          changeNote: true,
          createdAt: true,
        },
      });
      return rows.map((row) =>
        toWorkflowRevisionSummaryResponse(row, workflow.version),
      );
    }
    const rows = await this.prisma.workflowRevision.findMany({
      where: { workflowId },
      orderBy: { version: 'desc' },
      take: limit,
    });
    return rows.map((row) => toWorkflowRevisionResponse(row, workflow.version));
  }

  async findRevision(
    workflowId: number,
    version: number,
  ): Promise<WorkflowRevisionResponse> {
    const workflow = await this.findEntityOrThrow(workflowId);
    const row = await this.prisma.workflowRevision.findUnique({
      where: {
        workflowId_version: {
          workflowId,
          version,
        },
      },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'WORKFLOW_REVISION_NOT_FOUND',
        message: `Workflow ${workflowId} revision version=${version} not found`,
      });
    }
    return toWorkflowRevisionResponse(row, workflow.version);
  }

  async assertWorkflowReferenceCompatible(input: {
    workflowId: number;
    appClientId: number;
    entry: WorkflowEntryKind;
  }): Promise<void> {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: input.workflowId,
        appClientId: input.appClientId,
        isActive: true,
      },
    });
    if (!workflow) {
      throw new BadRequestException(
        `Workflow ${input.workflowId} is not found or inactive for this AppClient`,
      );
    }
  }

  /** Skill 保存期：校验 Workflow 引用有效；工具/HostTool 能力边界由 Workflow 自身声明。 */
  async assertSkillWorkflowBindingsCompatible(input: {
    workflowId: number;
    appClientId: number;
    workflowVersion?: number | null;
    skillToolIds: number[];
    skillHostToolIds: number[];
  }): Promise<void> {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: input.workflowId,
        appClientId: input.appClientId,
        isActive: true,
      },
      select: { id: true, version: true },
    });
    if (!workflow) {
      throw new BadRequestException(
        `Workflow ${input.workflowId} is not found or inactive for this AppClient`,
      );
    }

    const pinVersion = input.workflowVersion ?? null;
    if (pinVersion != null && pinVersion !== workflow.version) {
      const revision = await this.prisma.workflowRevision.findUnique({
        where: {
          workflowId_version: {
            workflowId: workflow.id,
            version: pinVersion,
          },
        },
      });
      if (!revision) {
        throw new BadRequestException(
          `Workflow ${input.workflowId} revision version=${pinVersion} not found`,
        );
      }
    }
  }

  async assertPageActionWorkflowBindingsCompatible(input: {
    workflowId: number;
    appClientId: number;
    workflowVersion?: number | null;
    pageActionHostToolId?: number | null;
  }): Promise<void> {
    await this.assertWorkflowReferenceCompatible({
      workflowId: input.workflowId,
      appClientId: input.appClientId,
      entry: 'page_action',
    });
    const pinVersion = input.workflowVersion ?? null;
    if (pinVersion == null) {
      return;
    }
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: input.workflowId,
        appClientId: input.appClientId,
        isActive: true,
      },
      select: { id: true, version: true },
    });
    if (!workflow || pinVersion === workflow.version) {
      return;
    }
    const revision = await this.prisma.workflowRevision.findUnique({
      where: {
        workflowId_version: {
          workflowId: workflow.id,
          version: pinVersion,
        },
      },
    });
    if (!revision) {
      throw new BadRequestException(
        `Workflow ${input.workflowId} revision version=${pinVersion} not found`,
      );
    }
  }

  private async assertReferencingSkillsStillCompatible(
    _workflowId: number,
  ): Promise<void> {
    // Workflow-bound Skills use the Workflow definition as their tool boundary.
    // SkillTool / SkillHostTool are not required to duplicate Workflow bindings.
  }

  private async assertReferencingPageActionsStillCompatible(
    _workflowId: number,
  ): Promise<void> {
    // PageAction 仅引用 workflowId；不再校验 nodes 是否含 generate_and_push。
  }

  private isNodesPayloadProvided(nodes: unknown): boolean {
    if (nodes == null) {
      return false;
    }
    if (Array.isArray(nodes)) {
      return nodes.length > 0;
    }
    if (
      typeof nodes === 'object' &&
      Array.isArray((nodes as { nodes?: unknown }).nodes)
    ) {
      return ((nodes as { nodes: unknown[] }).nodes?.length ?? 0) > 0;
    }
    return true;
  }

  /**
   * B 端手配 nodes：必须传文档对象且含 edges 数组。
   * 多节点时 edges 不可为空（至少 always 串联）。
   * 声明的每条边必须可严格解析（禁止静默丢弃后改写拓扑）。
   */
  private assertBEndNodesIncludeEdges(nodes: unknown): void {
    if (Array.isArray(nodes)) {
      throw new BadRequestException({
        code: 'WORKFLOW_EDGES_REQUIRED',
        message:
          'B 端须传 { nodes, edges, entryNodeId? }；线性流程也须声明 always 边，禁止仅传 nodes[]',
      });
    }
    if (
      nodes == null ||
      typeof nodes !== 'object' ||
      !Array.isArray((nodes as { nodes?: unknown }).nodes) ||
      !Array.isArray((nodes as { edges?: unknown }).edges)
    ) {
      throw new BadRequestException({
        code: 'WORKFLOW_EDGES_REQUIRED',
        message:
          'B 端须传 { nodes, edges, entryNodeId? }，且 edges 必须为数组',
      });
    }
    const nodeList = (nodes as { nodes: unknown[] }).nodes;
    const edgeList = (nodes as { edges: unknown[] }).edges;
    if (nodeList.length > 1 && edgeList.length === 0) {
      throw new BadRequestException({
        code: 'WORKFLOW_EDGES_REQUIRED',
        message:
          'nodes 长度大于 1 时 edges 不能为空；请按节点顺序配置 always 边（或 clue/default 分支图）',
      });
    }
  }

  private assertGraphEdgesWellFormed(graph: ParsedWorkflowGraph): void {
    if (!graph.edgesDeclared) {
      return;
    }
    if (graph.edgeParseIssues.length > 0) {
      throw new BadRequestException({
        code: 'WORKFLOW_EDGES_INVALID',
        message:
          'edges 存在无法解析的项；请修正后重试（不会静默丢弃并改走线性）',
        issues: graph.edgeParseIssues,
      });
    }
  }

  /** 持久化统一为带 edges 的文档；仅未声明 edges 时（Preset/遗留）才合成 always。 */
  private normalizePersistedGraph(
    graph: ParsedWorkflowGraph,
  ): ParsedWorkflowGraph {
    this.assertGraphEdgesWellFormed(graph);
    if (graph.edgesDeclared) {
      return {
        ...graph,
        entryNodeId: graph.entryNodeId ?? graph.nodes[0]?.id ?? null,
      };
    }
    const edges =
      graph.edges.length > 0
        ? graph.edges
        : synthesizeLinearWorkflowEdges(graph.nodes);
    return {
      nodes: graph.nodes,
      edges,
      entryNodeId: graph.entryNodeId ?? graph.nodes[0]?.id ?? null,
      edgesDeclared: false,
      edgeParseIssues: [],
    };
  }

  private resolveWorkflowGraph(input: {
    profile: WorkflowProfile;
    preset?: WorkflowPresetKind;
    presetConfig?: Record<string, unknown>;
    nodes?: unknown;
    /** true：手配 nodes，强制 { nodes, edges } */
    requireExplicitEdges?: boolean;
  }): ParsedWorkflowGraph {
    if (input.preset != null && this.isNodesPayloadProvided(input.nodes)) {
      throw new BadRequestException({
        code: 'WORKFLOW_PRESET_NODES_CONFLICT',
        message: 'Provide either preset + presetConfig or nodes, not both',
      });
    }
    if (input.preset != null) {
      const config = parseWorkflowPresetConfig(input.presetConfig);
      const issues = validateWorkflowPresetInput({
        preset: input.preset,
        profile: input.profile,
        config,
      });
      if (issues.length > 0) {
        throw new BadRequestException({
          code: 'WORKFLOW_PRESET_INVALID',
          message: 'Workflow preset validation failed',
          issues,
        });
      }
      const expandedNodes = expandWorkflowPreset({
        preset: input.preset,
        profile: input.profile,
        config,
      });
      return parseWorkflowGraphJson(expandedNodes);
    }
    if (!this.isNodesPayloadProvided(input.nodes)) {
      throw new BadRequestException({
        code: 'WORKFLOW_NODES_REQUIRED',
        message: 'Either preset or nodes must be provided',
      });
    }
    if (input.requireExplicitEdges !== false) {
      this.assertBEndNodesIncludeEdges(input.nodes);
    }
    const graph = parseWorkflowGraphJson(input.nodes);
    if (graph.nodes.length === 0) {
      throw new BadRequestException({
        code: 'WORKFLOW_NODES_REQUIRED',
        message: 'Either preset or nodes must be provided',
      });
    }
    return graph;
  }

  /** @deprecated Prefer resolveWorkflowGraph */
  private resolveWorkflowNodes(input: {
    profile: WorkflowProfile;
    preset?: WorkflowPresetKind;
    presetConfig?: Record<string, unknown>;
    nodes?: unknown;
  }): WorkflowNodeDef[] {
    return this.resolveWorkflowGraph(input).nodes;
  }

  private async findEntityOrThrow(id: number) {
    const row = await this.prisma.workflow.findUnique({
      where: { id },
      include: WORKFLOW_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }
    return row;
  }

  private async assertAppClientExists(appClientId: number): Promise<void> {
    const row = await this.prisma.appClient.findUnique({
      where: { id: appClientId },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException(`AppClient ${appClientId} not found`);
    }
  }

  private assertWorkflowValid(input: {
    workflowKey: string;
    name: string;
    profile: CreateWorkflowDto['profile'];
    goal?: string | null;
    constraints: string[];
    nodes: WorkflowNodeDef[];
    edges?: ParsedWorkflowGraph['edges'];
    entryNodeId?: string;
    bindings: WorkflowBindingRefs;
  }): void {
    const issues = validateWorkflowDefinition({
      definition: {
        workflowKey: input.workflowKey,
        name: input.name,
        profile: input.profile,
        goal: input.goal,
        constraints: input.constraints,
        nodes: input.nodes,
        ...(input.edges != null
          ? { edges: input.edges, entryNodeId: input.entryNodeId }
          : {}),
      },
      bindings: input.bindings,
    });
    if (issues.length > 0) {
      throw new BadRequestException({
        code: 'WORKFLOW_VALIDATION_FAILED',
        message: 'Workflow validation failed',
        issues,
      });
    }
  }

  private normalizeToolBindings(
    tools?: WorkflowToolBindingDto[],
  ): WorkflowToolBindingDto[] {
    if (!tools?.length) {
      return [];
    }
    const seen = new Set<number>();
    return tools.filter((item) => {
      if (seen.has(item.toolId)) {
        return false;
      }
      seen.add(item.toolId);
      return true;
    });
  }

  private normalizeHostToolBindings(
    hostTools?: WorkflowHostToolBindingDto[],
  ): WorkflowHostToolBindingDto[] {
    if (!hostTools?.length) {
      return [];
    }
    const seen = new Set<number>();
    return hostTools.filter((item) => {
      if (seen.has(item.hostToolId)) {
        return false;
      }
      seen.add(item.hostToolId);
      return true;
    });
  }

  private toBindingRefs(
    tools: WorkflowToolBindingDto[],
    hostTools: WorkflowHostToolBindingDto[],
  ): WorkflowBindingRefs {
    return {
      toolIds: tools.map((row) => row.toolId),
      hostToolIds: hostTools.map((row) => row.hostToolId),
    };
  }

  private async assertBindingsExist(
    appClientId: number,
    tools: WorkflowToolBindingDto[],
    hostTools: WorkflowHostToolBindingDto[],
  ): Promise<void> {
    if (tools.length > 0) {
      const count = await this.prisma.tool.count({
        where: {
          appClientId,
          id: { in: tools.map((row) => row.toolId) },
        },
      });
      if (count !== tools.length) {
        throw new BadRequestException(
          'One or more WorkflowTool bindings reference tools outside this AppClient',
        );
      }
    }
    if (hostTools.length > 0) {
      const count = await this.prisma.hostTool.count({
        where: {
          appClientId,
          id: { in: hostTools.map((row) => row.hostToolId) },
        },
      });
      if (count !== hostTools.length) {
        throw new BadRequestException(
          'One or more WorkflowHostTool bindings reference host tools outside this AppClient',
        );
      }
    }
  }

  private async assertCanDeactivate(workflowId: number): Promise<void> {
    const [skillCount, pageActionCount] = await this.prisma.$transaction([
      this.prisma.skill.count({
        where: { workflowId, isActive: true },
      }),
      this.prisma.pageAction.count({
        where: { workflowId, isActive: true },
      }),
    ]);
    if (skillCount > 0 || pageActionCount > 0) {
      throw new ConflictException({
        code: 'WORKFLOW_HAS_ACTIVE_REFERENCES',
        message:
          'Cannot deactivate Workflow while active Skill or PageAction references exist',
        skillCount,
        pageActionCount,
      });
    }
  }

}
