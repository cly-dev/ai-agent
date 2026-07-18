import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PageActionDelivery,
  Prisma,
} from '../../../generated/prisma/client';
import {
  resolvePagination,
  toPaginatedResult,
  type PaginatedResult,
} from '../../common/pagination';
import { assertPageActionPromptLimits } from '../../core/page-action/page-action-prompt-limits.util';
import { assertNoNewLegacyWorkflowBinding } from '../../core/workflow/assert-no-new-legacy-workflow-binding.util';
import { PrismaService } from '../../prisma/prisma.service';
import { HOST_TOOL_DETAIL_INCLUDE } from '../host-tool/host-tool.types';
import type {
  CreatePageActionDto,
  QueryPageActionDto,
  QueryPageActionRunDto,
  QueryPageScopeOptionsDto,
  UpdatePageActionDto,
} from './dto/page-action.dto';
import {
  toPageActionResponse,
  toPageActionRunAdminDetail,
  toPageActionRunAdminListItem,
} from './page-action.mapper';
import type {
  PageActionResponse,
  PageActionRunAdminDetail,
  PageActionRunAdminListItem,
  PageScopeOption,
} from './page-action.types';
import { PAGE_ACTION_DETAIL_INCLUDE, PAGE_ACTION_RUN_ADMIN_INCLUDE } from './page-action.types';
import { FlowService } from '../flow/flow.service';

@Injectable()
export class PageActionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flowService: FlowService,
  ) {}

  async create(dto: CreatePageActionDto): Promise<PageActionResponse> {
    await this.assertAppClientExists(dto.appClientId);
    this.assertInlineStreamOnly(dto.defaultDelivery);
    const actionKey = dto.actionKey.trim();
    assertPageActionPromptLimits({ systemPrompt: dto.systemPrompt });

    if (dto.hostToolId != null) {
      await this.assertHostToolForApp(dto.appClientId, dto.hostToolId);
    }
    const hostToolId = dto.hostToolId ?? null;

    if (dto.workflowId !== undefined) {
      assertNoNewLegacyWorkflowBinding(dto.workflowId, 'page_action');
    }
    if (dto.flowId != null && dto.flowId > 0) {
      await this.flowService.assertPageActionFlowBindingsCompatible({
        flowId: dto.flowId,
        appClientId: dto.appClientId,
        flowVersion: dto.flowVersion,
      });
    }

    try {
      const row = await this.prisma.pageAction.create({
        data: {
          appClientId: dto.appClientId,
          actionKey,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          hostToolId,
          pageScope: dto.pageScope?.trim() || null,
          systemPrompt: dto.systemPrompt.trim(),
          defaultDelivery: PageActionDelivery.inline_stream,
          allowCustomInstruction: dto.allowCustomInstruction ?? true,
          isActive: dto.isActive ?? true,
          sortOrder: dto.sortOrder ?? 0,
          config:
            dto.config === undefined
              ? undefined
              : (dto.config as Prisma.InputJsonValue),
          sourceSkillId: dto.sourceSkillId ?? null,
          // 配置面只写 Flow；禁止落 legacy workflowId。
          ...(dto.flowId != null && dto.flowId > 0
            ? {
                flowId: dto.flowId,
                flowVersion: dto.flowVersion ?? undefined,
                workflowId: null,
                workflowVersion: null,
              }
            : {
                flowId: null,
                flowVersion: null,
                workflowId: null,
                workflowVersion: null,
              }),
          workflowOverrides:
            dto.workflowOverrides === undefined
              ? undefined
              : dto.workflowOverrides === null
                ? Prisma.JsonNull
                : (dto.workflowOverrides as Prisma.InputJsonValue),
        },
        include: PAGE_ACTION_DETAIL_INCLUDE,
      });
      return toPageActionResponse(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `PageAction actionKey "${actionKey}" already exists for this AppClient`,
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdatePageActionDto): Promise<PageActionResponse> {
    this.assertInlineStreamOnly(dto.defaultDelivery);
    const existing = await this.findEntityOrThrow(id);
    if (dto.hostToolId != null) {
      await this.assertHostToolForApp(existing.appClientId, dto.hostToolId);
    }
    if (dto.systemPrompt != null) {
      assertPageActionPromptLimits({ systemPrompt: dto.systemPrompt });
    }

    if (dto.workflowId !== undefined) {
      assertNoNewLegacyWorkflowBinding(dto.workflowId, 'page_action');
    }
    const nextFlowId =
      dto.flowId !== undefined ? dto.flowId : existing.flowId;
    const nextFlowVersion =
      dto.flowVersion !== undefined ? dto.flowVersion : existing.flowVersion;
    const nextWorkflowId =
      dto.workflowId !== undefined ? dto.workflowId : existing.workflowId;
    const nextWorkflowVersion =
      nextWorkflowId == null
        ? null
        : dto.workflowVersion !== undefined
          ? dto.workflowVersion
          : existing.workflowVersion;
    if (nextFlowId != null && nextFlowId > 0) {
      await this.flowService.assertPageActionFlowBindingsCompatible({
        flowId: nextFlowId,
        appClientId: existing.appClientId,
        flowVersion: nextFlowVersion,
      });
    }
    const row = await this.prisma.pageAction.update({
      where: { id },
      data: {
        ...(dto.name != null ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.hostToolId !== undefined ? { hostToolId: dto.hostToolId } : {}),
        ...(dto.pageScope !== undefined
          ? { pageScope: dto.pageScope?.trim() || null }
          : {}),
        ...(dto.systemPrompt != null
          ? { systemPrompt: dto.systemPrompt.trim() }
          : {}),
        ...(dto.defaultDelivery != null
          ? { defaultDelivery: PageActionDelivery.inline_stream }
          : {}),
        ...(dto.allowCustomInstruction != null
          ? { allowCustomInstruction: dto.allowCustomInstruction }
          : {}),
        ...(dto.isActive != null ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder != null ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.config !== undefined
          ? { config: dto.config as Prisma.InputJsonValue | null }
          : {}),
        // 任一编排字段变更时写回互斥绑定：flow 优先于 workflow。
        ...(dto.flowId !== undefined ||
        dto.flowVersion !== undefined ||
        dto.workflowId !== undefined ||
        dto.workflowVersion !== undefined
          ? nextFlowId != null && nextFlowId > 0
            ? {
                flowId: nextFlowId,
                flowVersion: nextFlowVersion,
                workflowId: null,
                workflowVersion: null,
              }
            : {
                workflowId: nextWorkflowId,
                workflowVersion: nextWorkflowVersion,
                flowId: null,
                flowVersion: null,
              }
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
      include: PAGE_ACTION_DETAIL_INCLUDE,
    });
    return toPageActionResponse(row);
  }

  async findOne(id: number): Promise<PageActionResponse> {
    const row = await this.findEntityOrThrow(id);
    return toPageActionResponse(row);
  }

  async remove(id: number): Promise<{ ok: true; id: number }> {
    await this.findEntityOrThrow(id);
    await this.prisma.pageAction.delete({ where: { id } });
    return { ok: true, id };
  }

  async listPageScopes(
    appClientId: number,
    query: QueryPageScopeOptionsDto = {},
  ): Promise<PageScopeOption[]> {
    await this.assertAppClientExists(appClientId);
    const activeOnly = query.activeOnly !== false;

    const hostPages = await this.prisma.hostPage.findMany({
      where: {
        appClientId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      select: { scope: true, label: true, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { scope: 'asc' }],
    });

    const scopeMap = new Map<string, PageScopeOption>();
    for (const row of hostPages) {
      scopeMap.set(row.scope, {
        scope: row.scope,
        label: row.label,
        isActive: row.isActive,
      });
    }

    const actionScopes = await this.prisma.pageAction.findMany({
      where: { appClientId, pageScope: { not: null } },
      select: { pageScope: true },
      distinct: ['pageScope'],
    });
    for (const row of actionScopes) {
      const scope = row.pageScope?.trim();
      if (!scope || scopeMap.has(scope)) {
        continue;
      }
      scopeMap.set(scope, {
        scope,
        label: null,
        isActive: true,
      });
    }

    return [...scopeMap.values()].sort((a, b) => a.scope.localeCompare(b.scope));
  }

  async findPage(
    query: QueryPageActionDto,
  ): Promise<PaginatedResult<PageActionResponse>> {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where: Prisma.PageActionWhereInput = {
      ...(query.appClientId != null ? { appClientId: query.appClientId } : {}),
      ...(query.pageScope?.trim()
        ? { pageScope: query.pageScope.trim() }
        : {}),
      ...(query.isActive != null ? { isActive: query.isActive } : {}),
      ...(query.keyword?.trim()
        ? {
            OR: [
              { actionKey: { contains: query.keyword.trim() } },
              { name: { contains: query.keyword.trim() } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pageAction.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: PAGE_ACTION_DETAIL_INCLUDE,
      }),
      this.prisma.pageAction.count({ where }),
    ]);
    return toPaginatedResult(
      rows.map(toPageActionResponse),
      total,
      page,
      pageSize,
    );
  }

  async findRunAdmin(id: number): Promise<PageActionRunAdminDetail> {
    const run = await this.prisma.pageActionRun.findUnique({
      where: { id },
      include: PAGE_ACTION_RUN_ADMIN_INCLUDE,
    });
    if (!run) {
      throw new NotFoundException(`PageActionRun ${id} not found`);
    }
    return toPageActionRunAdminDetail(run);
  }

  async findRunPageAdmin(
    appClientId: number,
    query: QueryPageActionRunDto,
  ): Promise<PaginatedResult<PageActionRunAdminListItem>> {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where: Prisma.PageActionRunWhereInput = {
      appClientId,
      ...(query.pageActionId != null ? { pageActionId: query.pageActionId } : {}),
      ...(query.userId != null ? { userId: query.userId } : {}),
      ...(query.status != null ? { status: query.status } : {}),
      ...(query.clientActionId?.trim()
        ? { clientActionId: query.clientActionId.trim() }
        : {}),
      ...(query.actionKey?.trim()
        ? {
            pageAction: {
              actionKey: { contains: query.actionKey.trim() },
            },
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pageActionRun.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: PAGE_ACTION_RUN_ADMIN_INCLUDE,
      }),
      this.prisma.pageActionRun.count({ where }),
    ]);
    return toPaginatedResult(
      rows.map(toPageActionRunAdminListItem),
      total,
      page,
      pageSize,
    );
  }

  private assertInlineStreamOnly(delivery?: PageActionDelivery): void {
    if (delivery != null && delivery !== PageActionDelivery.inline_stream) {
      throw new BadRequestException({
        code: 'DELIVERY_NOT_SUPPORTED',
        message: 'only inline_stream is supported; sync has been removed',
      });
    }
  }

  private async findEntityOrThrow(id: number) {
    const row = await this.prisma.pageAction.findUnique({
      where: { id },
      include: PAGE_ACTION_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`PageAction ${id} not found`);
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

  private async assertHostToolForApp(
    appClientId: number,
    hostToolId: number,
  ): Promise<void> {
    const row = await this.prisma.hostTool.findFirst({
      where: { id: hostToolId, appClientId },
      include: HOST_TOOL_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException({
        code: 'HOST_TOOL_NOT_FOUND',
        message: `HostTool ${hostToolId} not found for AppClient ${appClientId}`,
      });
    }
  }

}
