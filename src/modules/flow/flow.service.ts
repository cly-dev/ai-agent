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
import { resolveWorkflowBindingsForSave } from '../../core/workflow/derive-workflow-bindings-from-nodes.util';
import { validateWorkflowDefinition } from '../../core/workflow/validate-workflow.util';
import { listWorkflowPresetCatalog } from '../../core/workflow/workflow-preset.util';
import { allocateWorkflowIntentStateKeys } from '../../core/workflow/workflow-intent-state-key.util';
import { resolveWorkflowIntentForPersist } from '../../core/workflow/resolve-workflow-intent-persist.util';
import type { WorkflowProfile } from '../../core/workflow/workflow.types';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateFlowDto,
  MigrateFlowFromWorkflowDto,
  QueryFlowDto,
  UpdateFlowDto,
} from './dto/flow.dto';
import type {
  WorkflowHostToolBindingDto,
  WorkflowToolBindingDto,
} from '../workflow/dto/workflow.dto';
import { inferWorkflowIntentFromLegacyNodes } from '../../core/workflow/infer-intent-from-legacy-nodes.util';
import { materializeWorkflowGraphFromIr } from '../../core/workflow/materialize-workflow-graph-from-ir.util';
import { parseWorkflowNodesJson } from '../../core/workflow/load-workflow-definition.util';
import { parseWorkflowIrDocument } from '../../core/workflow/parse-workflow-ir.util';
import { toFlowListItem, toFlowResponse, toFlowRevisionResponse, toFlowRevisionSummaryResponse } from './flow.mapper';
import type {
  FlowDetailRow,
  FlowListItem,
  FlowMigrationCandidate,
  FlowResponse,
  MigrateFlowFromWorkflowPreview,
  MigrateFlowFromWorkflowResponse,
} from './flow.types';
import { FLOW_DETAIL_INCLUDE, FLOW_LIST_INCLUDE } from './flow.types';

type PreparedFlowCreate = {
  appClientId: number;
  flowKey: string;
  name: string;
  description: string | null;
  goal: string | null;
  profile: WorkflowProfile;
  deliverable: WorkflowDeliverable;
  intentJson: Prisma.InputJsonValue;
  irJson: Prisma.InputJsonValue;
  constraints: Prisma.InputJsonValue;
  isActive: boolean;
  sortOrder: number;
  changeNote: string;
  tools: Array<{ toolId: number; isRequired?: boolean }>;
  hostTools: Array<{ hostToolId: number; isRequired?: boolean }>;
};

function throwIntentPersistError(error: unknown): never {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    const err = error as {
      code: string;
      message?: string;
      issues?: unknown;
    };
    throw new BadRequestException({
      code: err.code,
      message: err.message ?? err.code,
      ...(err.issues != null ? { issues: err.issues } : {}),
    });
  }
  throw error;
}

@Injectable()
export class FlowService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFlowDto): Promise<FlowResponse> {
    const prepared = await this.prepareFlowCreate(dto);
    try {
      const row = await this.prisma.$transaction(async (tx) =>
        this.insertFlowRecord(tx, prepared),
      );
      return toFlowResponse(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Flow flowKey "${prepared.flowKey}" already exists for this AppClient`,
        );
      }
      throw error;
    }
  }

  /** 校验 + 编译 Intent；不写库。create / migrate 共用。 */
  private async prepareFlowCreate(
    dto: CreateFlowDto,
  ): Promise<PreparedFlowCreate> {
    await this.assertAppClientExists(dto.appClientId);
    const flowKey = dto.flowKey.trim();

    let resolved: ReturnType<typeof resolveWorkflowIntentForPersist>;
    try {
      resolved = resolveWorkflowIntentForPersist({
        profile: dto.profile,
        preset: dto.preset,
        presetConfig: dto.presetConfig,
        intent: dto.intent,
      });
    } catch (error) {
      throwIntentPersistError(error);
    }

    const bindingResolution = resolveWorkflowBindingsForSave({
      nodes: resolved.legacyGraph.nodes,
      explicitTools: dto.tools,
      explicitHostTools: dto.hostTools,
    });
    if (bindingResolution.issues.length > 0) {
      throw new BadRequestException({
        code: 'FLOW_BINDING_RESOLUTION_FAILED',
        message:
          'Flow tool bindings must come from Intent slots / compiled IR; tools[] may only set isRequired',
        issues: bindingResolution.issues,
      });
    }
    const tools = bindingResolution.tools;
    const hostTools = bindingResolution.hostTools;

    this.assertFlowValid({
      flowKey,
      name: dto.name.trim(),
      profile: dto.profile,
      goal: dto.goal ?? null,
      constraints: dto.constraints ?? [],
      legacyNodes: resolved.legacyGraph.nodes,
      legacyEdges: resolved.legacyGraph.edges,
      entryNodeId: resolved.legacyGraph.entryNodeId,
      toolIds: tools.map((t) => t.toolId),
      hostToolIds: hostTools.map((h) => h.hostToolId),
    });
    await this.assertBindingsExist(dto.appClientId, tools, hostTools);

    return {
      appClientId: dto.appClientId,
      flowKey,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      goal: dto.goal?.trim() || null,
      profile: dto.profile,
      deliverable: dto.deliverable ?? WorkflowDeliverable.answer,
      intentJson: resolved.intent as unknown as Prisma.InputJsonValue,
      irJson: resolved.ir as unknown as Prisma.InputJsonValue,
      constraints: (dto.constraints ?? []) as Prisma.InputJsonValue,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
      changeNote: dto.changeNote?.trim() || 'initial version',
      tools,
      hostTools,
    };
  }

  private async insertFlowRecord(
    tx: Prisma.TransactionClient,
    prepared: PreparedFlowCreate,
  ): Promise<FlowDetailRow> {
    const created = await tx.flow.create({
      data: {
        appClientId: prepared.appClientId,
        flowKey: prepared.flowKey,
        name: prepared.name,
        description: prepared.description,
        goal: prepared.goal,
        profile: prepared.profile,
        deliverable: prepared.deliverable,
        intent: prepared.intentJson,
        ir: prepared.irJson,
        version: 1,
        constraints: prepared.constraints,
        isActive: prepared.isActive,
        sortOrder: prepared.sortOrder,
        flowTools: prepared.tools.length
          ? {
              create: prepared.tools.map((item) => ({
                toolId: item.toolId,
                isRequired: item.isRequired ?? false,
              })),
            }
          : undefined,
        flowHostTools: prepared.hostTools.length
          ? {
              create: prepared.hostTools.map((item) => ({
                hostToolId: item.hostToolId,
                isRequired: item.isRequired ?? false,
              })),
            }
          : undefined,
      },
    });
    await tx.flowRevision.create({
      data: {
        flowId: created.id,
        version: 1,
        intent: created.intent as Prisma.InputJsonValue,
        ir: created.ir as Prisma.InputJsonValue,
        deliverable: created.deliverable,
        constraints: created.constraints as Prisma.InputJsonValue,
        changeNote: prepared.changeNote,
      },
    });
    return tx.flow.findUniqueOrThrow({
      where: { id: created.id },
      include: FLOW_DETAIL_INCLUDE,
    });
  }

  /**
   * 仍被 Skill/PageAction 引用的 legacy Workflow（迁移候选）。
   */
  async listMigrationCandidates(input: {
    appClientId: number;
  }): Promise<{ items: FlowMigrationCandidate[] }> {
    await this.assertAppClientExists(input.appClientId);
    const rows = await this.prisma.workflow.findMany({
      where: {
        appClientId: input.appClientId,
        OR: [
          { skills: { some: {} } },
          { pageActions: { some: {} } },
        ],
      },
      select: {
        id: true,
        workflowKey: true,
        name: true,
        profile: true,
        isActive: true,
        _count: {
          select: { skills: true, pageActions: true },
        },
      },
      orderBy: [{ isActive: 'desc' }, { id: 'asc' }],
    });
    return {
      items: rows.map((row) => ({
        workflowId: row.id,
        workflowKey: row.workflowKey,
        name: row.name,
        profile: row.profile,
        isActive: row.isActive,
        skillRefCount: row._count.skills,
        pageActionRefCount: row._count.pageActions,
        previewPath: `/admin/flow/migrate-from-workflow/${row.id}/preview`,
        migratePath: `/admin/flow/migrate-from-workflow/${row.id}`,
      })),
    };
  }

  /**
   * 迁移预览：推断 Intent + 改绑范围，不写库。
   */
  async previewMigrateFromWorkflow(
    workflowId: number,
    flowKeyOverride?: string | null,
  ): Promise<MigrateFlowFromWorkflowPreview> {
    const source = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        _count: { select: { skills: true, pageActions: true } },
      },
    });
    if (!source) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }

    const suggestedFlowKey = (
      flowKeyOverride?.trim() || source.workflowKey
    ).trim();
    const existingFlow = await this.prisma.flow.findFirst({
      where: {
        appClientId: source.appClientId,
        flowKey: suggestedFlowKey,
      },
      select: { id: true },
    });
    const flowKeyAvailable = existingFlow == null;

    const nodes = parseWorkflowNodesJson(source.nodes);
    try {
      const inferred = inferWorkflowIntentFromLegacyNodes({
        profile: source.profile as WorkflowProfile,
        nodes,
      });
      const warnings = [
        ...inferred.warnings,
        ...(flowKeyAvailable
          ? []
          : [
              `flowKey "${suggestedFlowKey}" already exists; pass a different flowKey on migrate`,
            ]),
      ];
      const lossy =
        inferred.matchedPattern === 'custom' ||
        inferred.warnings.some(
          (w) =>
            w.includes('branching') ||
            w.includes('not preserved') ||
            w.includes('collapsed'),
        );
      return {
        sourceWorkflowId: source.id,
        suggestedFlowKey,
        profile: source.profile,
        canMigrate: flowKeyAvailable,
        lossy,
        matchedPattern: inferred.matchedPattern,
        warnings,
        intent: inferred.intent,
        error: null,
        flowKeyAvailable,
        rebind: {
          skillCount: source._count.skills,
          pageActionCount: source._count.pageActions,
        },
      };
    } catch (error) {
      const err =
        error && typeof error === 'object'
          ? (error as { code?: string; message?: string })
          : {};
      return {
        sourceWorkflowId: source.id,
        suggestedFlowKey,
        profile: source.profile,
        canMigrate: false,
        lossy: false,
        matchedPattern: null,
        warnings: flowKeyAvailable
          ? []
          : [
              `flowKey "${suggestedFlowKey}" already exists; pass a different flowKey on migrate`,
            ],
        intent: null,
        error: {
          code: typeof err.code === 'string' ? err.code : 'LEGACY_INTENT_INFER_FAILED',
          message:
            typeof err.message === 'string'
              ? err.message
              : 'Failed to infer Intent from legacy nodes',
        },
        flowKeyAvailable,
        rebind: {
          skillCount: source._count.skills,
          pageActionCount: source._count.pageActions,
        },
      };
    }
  }

  /**
   * Legacy Workflow.nodes → 推断 Intent → 创建 Flow。
   * 创建 + 改绑 + 停用源在同一事务，避免半迁移。
   */
  async migrateFromWorkflow(
    workflowId: number,
    dto: MigrateFlowFromWorkflowDto,
  ): Promise<MigrateFlowFromWorkflowResponse> {
    const source = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });
    if (!source) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }

    const nodes = parseWorkflowNodesJson(source.nodes);
    let inferred: ReturnType<typeof inferWorkflowIntentFromLegacyNodes>;
    try {
      inferred = inferWorkflowIntentFromLegacyNodes({
        profile: source.profile as WorkflowProfile,
        nodes,
      });
    } catch (error) {
      throwIntentPersistError(error);
    }

    const flowKey = (dto.flowKey?.trim() || source.workflowKey).trim();
    const createDto: CreateFlowDto = {
      appClientId: source.appClientId,
      flowKey,
      name: source.name,
      description: source.description,
      goal: source.goal,
      profile: source.profile as WorkflowProfile,
      deliverable: source.deliverable,
      intent: inferred.intent as unknown as Record<string, unknown>,
      constraints: Array.isArray(source.constraints)
        ? (source.constraints as string[])
        : [],
      isActive: source.isActive,
      sortOrder: source.sortOrder,
      changeNote:
        dto.changeNote?.trim() ||
        `migrated from workflowId=${workflowId} (${inferred.matchedPattern})`,
    };

    const prepared = await this.prepareFlowCreate(createDto);
    const rebindBindings = dto.rebindBindings !== false;
    const deactivateSource = dto.deactivateSource !== false;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const row = await this.insertFlowRecord(tx, prepared);
        let skillsUpdated = 0;
        let pageActionsUpdated = 0;
        if (rebindBindings) {
          const skillResult = await tx.skill.updateMany({
            where: {
              appClientId: source.appClientId,
              workflowId: source.id,
            },
            data: {
              flowId: row.id,
              flowVersion: row.version,
              workflowId: null,
              workflowVersion: null,
            },
          });
          const pageActionResult = await tx.pageAction.updateMany({
            where: {
              appClientId: source.appClientId,
              workflowId: source.id,
            },
            data: {
              flowId: row.id,
              flowVersion: row.version,
              workflowId: null,
              workflowVersion: null,
            },
          });
          skillsUpdated = skillResult.count;
          pageActionsUpdated = pageActionResult.count;
        }
        if (deactivateSource) {
          await tx.workflow.update({
            where: { id: source.id },
            data: { isActive: false },
          });
        }
        return {
          flow: toFlowResponse(row),
          skillsUpdated,
          pageActionsUpdated,
        };
      });

      return {
        flow: result.flow,
        sourceWorkflowId: source.id,
        matchedPattern: inferred.matchedPattern,
        warnings: inferred.warnings,
        rebind: {
          skillsUpdated: result.skillsUpdated,
          pageActionsUpdated: result.pageActionsUpdated,
        },
        sourceDeactivated: deactivateSource,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Flow flowKey "${flowKey}" already exists for this AppClient`,
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateFlowDto): Promise<FlowResponse> {
    const existing = await this.findEntityOrThrow(id);
    if (dto.preset != null && dto.intent != null) {
      throw new BadRequestException({
        code: 'FLOW_PRESET_INTENT_CONFLICT',
        message: 'Provide either preset or intent, not both',
      });
    }

    const intentChanged = dto.preset != null || dto.intent != null;
    let resolved: ReturnType<typeof resolveWorkflowIntentForPersist> | null =
      null;
    if (intentChanged) {
      try {
        resolved = resolveWorkflowIntentForPersist({
          profile: existing.profile as WorkflowProfile,
          preset: dto.preset,
          presetConfig: dto.presetConfig,
          intent: dto.intent,
        });
      } catch (error) {
        throwIntentPersistError(error);
      }
    }

    const tools =
      dto.tools != null ? this.normalizeToolBindings(dto.tools) : undefined;
    const hostTools =
      dto.hostTools != null
        ? this.normalizeHostToolBindings(dto.hostTools)
        : undefined;

    const nextLegacyNodes =
      resolved?.legacyGraph.nodes ?? this.legacyNodesFromIr(existing.ir);

    const shouldResolveBindings =
      resolved != null || tools != null || hostTools != null;
    const bindingResolution = shouldResolveBindings
      ? resolveWorkflowBindingsForSave({
          nodes: nextLegacyNodes,
          explicitTools: tools,
          explicitHostTools: hostTools,
        })
      : null;
    if (bindingResolution?.issues.length) {
      throw new BadRequestException({
        code: 'FLOW_BINDING_RESOLUTION_FAILED',
        message:
          'Flow tool bindings must come from Intent slots / compiled IR',
        issues: bindingResolution.issues,
      });
    }

    const resolvedTools =
      bindingResolution?.tools ??
      existing.flowTools.map((row) => ({
        toolId: row.toolId,
        isRequired: row.isRequired,
      }));
    const resolvedHostTools =
      bindingResolution?.hostTools ??
      existing.flowHostTools.map((row) => ({
        hostToolId: row.hostToolId,
        isRequired: row.isRequired,
      }));

    if (shouldResolveBindings) {
      await this.assertBindingsExist(
        existing.appClientId,
        resolvedTools,
        resolvedHostTools,
      );
    }

    const contentChanged =
      intentChanged ||
      dto.deliverable != null ||
      dto.constraints != null;

    const row = await this.prisma.$transaction(async (tx) => {
      if (shouldResolveBindings) {
        await tx.flowTool.deleteMany({ where: { flowId: id } });
        if (resolvedTools.length > 0) {
          await tx.flowTool.createMany({
            data: resolvedTools.map((item) => ({
              flowId: id,
              toolId: item.toolId,
              isRequired: item.isRequired ?? false,
            })),
          });
        }
        await tx.flowHostTool.deleteMany({ where: { flowId: id } });
        if (resolvedHostTools.length > 0) {
          await tx.flowHostTool.createMany({
            data: resolvedHostTools.map((item) => ({
              flowId: id,
              hostToolId: item.hostToolId,
              isRequired: item.isRequired ?? false,
            })),
          });
        }
      }

      const nextVersion = contentChanged
        ? existing.version + 1
        : existing.version;
      const updated = await tx.flow.update({
        where: { id },
        data: {
          ...(dto.name != null ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.goal !== undefined ? { goal: dto.goal?.trim() || null } : {}),
          ...(dto.deliverable != null ? { deliverable: dto.deliverable } : {}),
          ...(resolved != null
            ? {
                intent: resolved.intent as unknown as Prisma.InputJsonValue,
                ir: resolved.ir as unknown as Prisma.InputJsonValue,
              }
            : {}),
          ...(dto.constraints != null
            ? { constraints: dto.constraints as Prisma.InputJsonValue }
            : {}),
          ...(dto.isActive != null ? { isActive: dto.isActive } : {}),
          ...(dto.sortOrder != null ? { sortOrder: dto.sortOrder } : {}),
          ...(contentChanged ? { version: nextVersion } : {}),
        },
        include: FLOW_DETAIL_INCLUDE,
      });

      if (contentChanged) {
        await tx.flowRevision.create({
          data: {
            flowId: id,
            version: nextVersion,
            intent: updated.intent as Prisma.InputJsonValue,
            ir: updated.ir as Prisma.InputJsonValue,
            deliverable: updated.deliverable,
            constraints: updated.constraints as Prisma.InputJsonValue,
            changeNote: dto.changeNote?.trim() || null,
          },
        });
      }

      return updated;
    });

    return toFlowResponse(row);
  }

  async listPresets(profile?: WorkflowProfile) {
    return listWorkflowPresetCatalog(profile);
  }

  /** 画布状态边：名称 → 不重复 state.key */
  allocateIntentStateKeys(labels: readonly string[]) {
    return { keys: allocateWorkflowIntentStateKeys(labels) };
  }

  async findOne(id: number): Promise<FlowResponse> {
    return toFlowResponse(await this.findEntityOrThrow(id));
  }

  async listRevisions(
    flowId: number,
    query: { limit?: number; summary?: boolean } = {},
  ): Promise<
    | import('./flow.types').FlowRevisionResponse[]
    | import('./flow.types').FlowRevisionSummaryResponse[]
  > {
    const flow = await this.findEntityOrThrow(flowId);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    if (query.summary) {
      const rows = await this.prisma.flowRevision.findMany({
        where: { flowId },
        orderBy: { version: 'desc' },
        take: limit,
        select: {
          id: true,
          flowId: true,
          version: true,
          deliverable: true,
          changeNote: true,
          createdAt: true,
        },
      });
      return rows.map((row) =>
        toFlowRevisionSummaryResponse(row, flow.version),
      );
    }
    const rows = await this.prisma.flowRevision.findMany({
      where: { flowId },
      orderBy: { version: 'desc' },
      take: limit,
    });
    return rows.map((row) => toFlowRevisionResponse(row, flow.version));
  }

  async findRevision(
    flowId: number,
    version: number,
  ): Promise<import('./flow.types').FlowRevisionResponse> {
    const flow = await this.findEntityOrThrow(flowId);
    const row = await this.prisma.flowRevision.findUnique({
      where: {
        flowId_version: { flowId, version },
      },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'FLOW_REVISION_NOT_FOUND',
        message: `Flow ${flowId} revision version=${version} not found`,
      });
    }
    return toFlowRevisionResponse(row, flow.version);
  }

  async remove(id: number): Promise<{ ok: true; id: number }> {
    await this.findEntityOrThrow(id);
    const [
      pendingApprovals,
      skillBindings,
      pageActionBindings,
      activePageActionRuns,
    ] = await Promise.all([
      this.prisma.approvalRequest.count({
        where: { flowId: id, status: 'pending' },
      }),
      this.prisma.skill.count({ where: { flowId: id } }),
      this.prisma.pageAction.count({ where: { flowId: id } }),
      // 解绑 PageAction 后 run 仍可能挂 flowId；删资产会打断 running / 审批挂起。
      this.prisma.pageActionRun.count({
        where: {
          flowId: id,
          status: { in: ['running', 'awaiting_approval'] },
        },
      }),
    ]);
    if (pendingApprovals > 0) {
      throw new ConflictException({
        code: 'FLOW_HAS_PENDING_APPROVALS',
        message: `Flow ${id} has ${pendingApprovals} pending approval(s); resolve or cancel them before delete`,
      });
    }
    if (activePageActionRuns > 0) {
      throw new ConflictException({
        code: 'FLOW_HAS_ACTIVE_RUNS',
        message: `Flow ${id} has ${activePageActionRuns} in-flight PageActionRun(s); wait for completion before delete`,
      });
    }
    if (skillBindings > 0 || pageActionBindings > 0) {
      throw new ConflictException({
        code: 'FLOW_STILL_BOUND',
        message: `Flow ${id} is still bound by ${skillBindings} skill(s) and ${pageActionBindings} pageAction(s); unbind first`,
      });
    }
    await this.prisma.flow.delete({ where: { id } });
    return { ok: true, id };
  }

  /** Skill / PageAction 绑定时：同租户且启用的 Flow。 */
  async assertFlowReferenceCompatible(input: {
    flowId: number;
    appClientId: number;
  }): Promise<void> {
    const flow = await this.prisma.flow.findFirst({
      where: {
        id: input.flowId,
        appClientId: input.appClientId,
        isActive: true,
      },
      select: { id: true },
    });
    if (!flow) {
      throw new BadRequestException(
        `Flow ${input.flowId} is not found or inactive for this AppClient`,
      );
    }
  }

  /** Skill 保存期：校验 Flow 引用与可选 pin revision。 */
  async assertSkillFlowBindingsCompatible(input: {
    flowId: number;
    appClientId: number;
    flowVersion?: number | null;
  }): Promise<void> {
    const flow = await this.prisma.flow.findFirst({
      where: {
        id: input.flowId,
        appClientId: input.appClientId,
        isActive: true,
      },
      select: { id: true, version: true },
    });
    if (!flow) {
      throw new BadRequestException(
        `Flow ${input.flowId} is not found or inactive for this AppClient`,
      );
    }
    const pinVersion = input.flowVersion ?? null;
    if (pinVersion != null && pinVersion !== flow.version) {
      const revision = await this.prisma.flowRevision.findUnique({
        where: {
          flowId_version: { flowId: flow.id, version: pinVersion },
        },
        select: { id: true },
      });
      if (!revision) {
        throw new BadRequestException(
          `Flow ${input.flowId} revision version=${pinVersion} not found`,
        );
      }
    }
  }

  async assertPageActionFlowBindingsCompatible(input: {
    flowId: number;
    appClientId: number;
    flowVersion?: number | null;
  }): Promise<void> {
    await this.assertSkillFlowBindingsCompatible(input);
  }

  async findPage(
    query: QueryFlowDto,
  ): Promise<PaginatedResult<FlowListItem>> {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where: Prisma.FlowWhereInput = {
      ...(query.appClientId != null ? { appClientId: query.appClientId } : {}),
      ...(query.profile != null ? { profile: query.profile } : {}),
      ...(query.isActive != null ? { isActive: query.isActive } : {}),
      ...(query.keyword?.trim()
        ? {
            OR: [
              { flowKey: { contains: query.keyword.trim() } },
              { name: { contains: query.keyword.trim() } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.flow.findMany({
        where,
        include: FLOW_LIST_INCLUDE,
        orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.prisma.flow.count({ where }),
    ]);
    return toPaginatedResult(
      rows.map(toFlowListItem),
      total,
      page,
      pageSize,
    );
  }

  private legacyNodesFromIr(ir: unknown) {
    const doc = parseWorkflowIrDocument(ir);
    if (!doc) {
      return [];
    }
    return materializeWorkflowGraphFromIr(doc).nodes;
  }

  private assertFlowValid(input: {
    flowKey: string;
    name: string;
    profile: WorkflowProfile;
    goal?: string | null;
    constraints: string[];
    legacyNodes: import('../../core/workflow/workflow.types').WorkflowNodeDef[];
    legacyEdges: import('../../core/workflow/workflow.types').WorkflowEdge[];
    entryNodeId: string;
    toolIds: number[];
    hostToolIds: number[];
  }): void {
    const issues = validateWorkflowDefinition({
      definition: {
        workflowKey: input.flowKey,
        name: input.name,
        profile: input.profile,
        goal: input.goal ?? null,
        constraints: input.constraints,
        nodes: input.legacyNodes,
        edges: input.legacyEdges,
        entryNodeId: input.entryNodeId,
      },
      bindings: {
        toolIds: input.toolIds,
        hostToolIds: input.hostToolIds,
      },
    });
    if (issues.length > 0) {
      throw new BadRequestException({
        code: 'FLOW_DEFINITION_INVALID',
        message: 'Compiled Flow IR failed legacy executor validation',
        issues,
      });
    }
  }

  private async findEntityOrThrow(id: number) {
    const row = await this.prisma.flow.findUnique({
      where: { id },
      include: FLOW_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`Flow ${id} not found`);
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

  private normalizeToolBindings(tools: WorkflowToolBindingDto[]) {
    return tools.map((item) => ({
      toolId: item.toolId,
      isRequired: item.isRequired ?? false,
    }));
  }

  private normalizeHostToolBindings(hostTools: WorkflowHostToolBindingDto[]) {
    return hostTools.map((item) => ({
      hostToolId: item.hostToolId,
      isRequired: item.isRequired ?? false,
    }));
  }

  private async assertBindingsExist(
    appClientId: number,
    tools: Array<{ toolId: number }>,
    hostTools: Array<{ hostToolId: number }>,
  ): Promise<void> {
    if (tools.length) {
      const count = await this.prisma.tool.count({
        where: {
          appClientId,
          id: { in: tools.map((t) => t.toolId) },
        },
      });
      if (count !== new Set(tools.map((t) => t.toolId)).size) {
        throw new BadRequestException({
          code: 'FLOW_TOOL_NOT_FOUND',
          message: 'One or more tools not found in AppClient',
        });
      }
    }
    if (hostTools.length) {
      const count = await this.prisma.hostTool.count({
        where: {
          appClientId,
          id: { in: hostTools.map((h) => h.hostToolId) },
        },
      });
      if (count !== new Set(hostTools.map((h) => h.hostToolId)).size) {
        throw new BadRequestException({
          code: 'FLOW_HOST_TOOL_NOT_FOUND',
          message: 'One or more host tools not found in AppClient',
        });
      }
    }
  }
}
