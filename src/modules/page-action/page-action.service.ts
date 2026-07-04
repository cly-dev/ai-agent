import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PageActionDelivery,
  PageActionRunStatus,
  Prisma,
} from '../../../generated/prisma/client';
import {
  resolvePagination,
  toPaginatedResult,
  type PaginatedResult,
} from '../../common/pagination';
import {
  executePageActionHostFill,
  replayPageActionInlineStream,
} from '../../core/page-action/page-action-host-fill.executor';
import { orchestratePageWorkflow } from '../../core/page-action/page-workflow-orchestrator';
import { ApprovalGateService } from '../../core/approval/approval-gate.service';
import { ApprovalTriggerPermissionService } from '../../core/approval/approval-trigger-permission.service';
import { parseApprovalTriggerBinding } from '../../core/approval/resolve-approval-parties.util';
import {
  loadWorkflowForRunDetailed,
  parseWorkflowOverridesJson,
} from '../../core/workflow/load-workflow-definition.util';
import {
  pageActionWorkflowLoadErrorCode,
  pageActionWorkflowLoadFailureMessage,
} from '../../core/page-action/page-action-workflow-load.util';
import {
  assertPageActionScopeMatch,
  resolvePageActionHostTool,
} from '../../core/page-action/page-action-host-tool.util';
import {
  endInlineSseResponse,
  initInlineSseResponse,
  writePageActionLifecycle,
} from '../../core/page-action/page-action-inline-sse.util';
import { PageActionRunStepRecorder } from '../../core/page-action/page-action-run-steps.util';
import { PAGE_ACTION_PROMPT_LIMITS } from '../../core/page-action/page-action.constants';
import { buildPageActionLlmMessages } from '../../core/page-action/page-action-prompt.util';
import {
  coalescePageContext,
  parsePageContextFromMessageFields,
  type AgentChatPageContext,
} from '../../core/host-bridge';
import { LlmService } from '../../core/llm/llm.service';
import { ToolEngineService } from '../../core/tool-engine/tool-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HOST_TOOL_DETAIL_INCLUDE } from '../host-tool/host-tool.types';
import type {
  CreatePageActionDto,
  InvokePageActionDto,
  QueryPageActionDto,
  QueryPageActionRunDto,
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
} from './page-action.types';
import { PAGE_ACTION_DETAIL_INCLUDE, PAGE_ACTION_RUN_ADMIN_INCLUDE } from './page-action.types';
import type { Response } from 'express';
import { WorkflowService } from '../workflow/workflow.service';
import {
  resolvePageActionHostToolResolved,
  resolvePageActionHostToolRow,
} from '../../core/page-action/page-action-workflow-host.util';

@Injectable()
export class PageActionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly toolEngine: ToolEngineService,
    private readonly workflowService: WorkflowService,
    private readonly approvalGate: ApprovalGateService,
    private readonly triggerPermission: ApprovalTriggerPermissionService,
  ) {}

  async create(dto: CreatePageActionDto): Promise<PageActionResponse> {
    await this.assertAppClientExists(dto.appClientId);
    this.assertInlineStreamOnly(dto.defaultDelivery);
    const actionKey = dto.actionKey.trim();
    this.assertPromptLimits(dto.systemPrompt, null);

    if (dto.hostToolId != null) {
      await this.assertHostToolForApp(dto.appClientId, dto.hostToolId);
    }
    this.assertPageActionHostToolBinding(dto.workflowId, dto.hostToolId);
    const hostToolId = dto.hostToolId ?? null;

    if (dto.workflowId != null && dto.workflowId > 0) {
      await this.workflowService.assertWorkflowReferenceCompatible({
        workflowId: dto.workflowId,
        appClientId: dto.appClientId,
        entry: 'page_action',
      });
      await this.workflowService.assertPageActionWorkflowBindingsCompatible({
        workflowId: dto.workflowId,
        appClientId: dto.appClientId,
        workflowVersion: dto.workflowVersion,
        pageActionHostToolId: hostToolId,
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
          workflowId: dto.workflowId ?? undefined,
          workflowVersion: dto.workflowVersion ?? undefined,
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
      this.assertPromptLimits(dto.systemPrompt, null);
    }
    if (dto.workflowId != null) {
      await this.workflowService.assertWorkflowReferenceCompatible({
        workflowId: dto.workflowId,
        appClientId: existing.appClientId,
        entry: 'page_action',
      });
    }

    const nextWorkflowId =
      dto.workflowId !== undefined ? dto.workflowId : existing.workflowId;
    const nextWorkflowVersion =
      dto.workflowVersion !== undefined
        ? dto.workflowVersion
        : existing.workflowVersion;
    const nextHostToolId = dto.hostToolId ?? existing.hostToolId;
    this.assertPageActionHostToolBinding(nextWorkflowId, nextHostToolId);
    if (nextWorkflowId != null && nextWorkflowId > 0) {
      await this.workflowService.assertPageActionWorkflowBindingsCompatible({
        workflowId: nextWorkflowId,
        appClientId: existing.appClientId,
        workflowVersion: nextWorkflowVersion,
        pageActionHostToolId: nextHostToolId,
      });
    }
    const row = await this.prisma.pageAction.update({
      where: { id },
      data: {
        ...(dto.name != null ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.hostToolId != null ? { hostToolId: dto.hostToolId } : {}),
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
        ...(dto.workflowId !== undefined ? { workflowId: dto.workflowId } : {}),
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
      include: PAGE_ACTION_DETAIL_INCLUDE,
    });
    return toPageActionResponse(row);
  }

  async findOne(id: number): Promise<PageActionResponse> {
    const row = await this.findEntityOrThrow(id);
    return toPageActionResponse(row);
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

  async invoke(
    userId: number,
    appClientId: number,
    dto: InvokePageActionDto,
    res: Response,
  ): Promise<void> {
    const actionKey = dto.actionKey.trim();
    const pageAction = await this.prisma.pageAction.findFirst({
      where: { appClientId, actionKey, isActive: true },
      include: PAGE_ACTION_DETAIL_INCLUDE,
    });
    if (!pageAction) {
      throw new NotFoundException({
        code: 'PAGE_ACTION_NOT_FOUND',
        message: `PageAction "${actionKey}" is not registered or inactive`,
      });
    }

    const hostToolRow = await resolvePageActionHostToolRow(
      this.prisma,
      pageAction,
    );
    if (hostToolRow && !hostToolRow.isActive) {
      throw new BadRequestException({
        code: 'HOST_TOOL_INACTIVE',
        message: `Bound HostTool "${hostToolRow.name}" is inactive`,
      });
    }

    const pageContext = this.resolvePageContext(dto);
    assertPageActionScopeMatch({
      pageScope: pageAction.pageScope,
      hostPageScope: hostToolRow?.hostPage?.scope ?? null,
      pageContext,
    });

    const instruction = pageAction.allowCustomInstruction
      ? dto.instruction?.trim() || null
      : null;
    this.assertPromptLimits(pageAction.systemPrompt, instruction, dto.context);

    const hostToolResolved = hostToolRow
      ? resolvePageActionHostTool(hostToolRow, pageContext)
      : null;

    if (dto.idempotencyKey?.trim()) {
      const prior = await this.prisma.pageActionRun.findFirst({
        where: {
          appClientId,
          idempotencyKey: dto.idempotencyKey.trim(),
          status: PageActionRunStatus.completed,
        },
        include: { pageAction: { select: { actionKey: true } } },
      });
      if (prior && prior.pageActionId === pageAction.id) {
        initInlineSseResponse(res);
        const replaySteps = await replayPageActionInlineStream({
          res,
          actionRunId: prior.id,
          actionKey: prior.pageAction.actionKey,
          generation: prior.generation,
          clientActionId: prior.clientActionId,
          fillText: prior.fillText,
          dslOutcome: prior.dslOutcome,
          streamId: prior.streamId,
          pageContext,
          hostTool: hostToolResolved,
        });
        void replaySteps;
        return;
      }
    }

    const messages = buildPageActionLlmMessages({
      systemPrompt: pageAction.systemPrompt,
      instruction,
      context: dto.context ?? null,
      pageContext,
    });

    const run = await this.prisma.pageActionRun.create({
      data: {
        pageActionId: pageAction.id,
        appClientId,
        userId,
        delivery: PageActionDelivery.inline_stream,
        status: PageActionRunStatus.running,
        instruction,
        context:
          dto.context === undefined
            ? undefined
            : (dto.context as Prisma.InputJsonValue),
        pageContext: pageContext as Prisma.InputJsonValue,
        idempotencyKey: dto.idempotencyKey?.trim() || null,
        clientActionId: dto.clientActionId?.trim() || null,
        steps: [] as Prisma.InputJsonValue,
      },
    });
    await this.prisma.pageActionRun.update({
      where: { id: run.id },
      data: { generation: run.id },
    });
    const generation = run.id;

    const startedAt = Date.now();
    const stepRecorder = new PageActionRunStepRecorder();
    try {
      if (pageAction.workflowId) {
        const loadResult = await loadWorkflowForRunDetailed(this.prisma, {
          workflowId: pageAction.workflowId,
          appClientId,
          workflowVersion: pageAction.workflowVersion,
          workflowOverrides: parseWorkflowOverridesJson(
            pageAction.workflowOverrides,
          ),
        });
        if (loadResult.status === 'failed') {
          const errorCode = pageActionWorkflowLoadErrorCode(loadResult.reason);
          const errorMessage = pageActionWorkflowLoadFailureMessage(
            loadResult.reason,
          );
          initInlineSseResponse(res);
          writePageActionLifecycle(
            res,
            {
              phase: 'failed',
              actionRunId: run.id,
              actionKey: pageAction.actionKey,
              delivery: PageActionDelivery.inline_stream,
              generation,
              clientActionId: dto.clientActionId?.trim() || null,
              errorCode,
              errorMessage,
            },
            stepRecorder,
          );
          endInlineSseResponse(res);
          await this.prisma.pageActionRun.update({
            where: { id: run.id },
            data: {
              status: PageActionRunStatus.failed,
              workflowId: loadResult.workflowId,
              errorCode,
              errorMessage,
              durationMs: Date.now() - startedAt,
              finishedAt: new Date(),
              steps: stepRecorder.toJson() as Prisma.InputJsonValue,
            },
          });
          return;
        }
        initInlineSseResponse(res);
        const allowedToolIds =
          await this.triggerPermission.resolveUserAllowedToolIdsForApp({
            userId,
            appClientId,
          });
        const permission = this.triggerPermission.evaluateForNodes({
          nodes: loadResult.nodes,
          allowedToolIds,
        });
        if (permission.allowed === false) {
          const errorCode = 'WORKFLOW_TRIGGER_PERMISSION_DENIED';
          const errorMessage = `Missing write tool permission: ${permission.missingToolIds.join(',')}`;
          writePageActionLifecycle(
            res,
            {
              phase: 'failed',
              actionRunId: run.id,
              actionKey: pageAction.actionKey,
              delivery: PageActionDelivery.inline_stream,
              generation,
              clientActionId: dto.clientActionId?.trim() || null,
              errorCode,
              errorMessage,
            },
            stepRecorder,
          );
          endInlineSseResponse(res);
          await this.prisma.pageActionRun.update({
            where: { id: run.id },
            data: {
              status: PageActionRunStatus.failed,
              workflowId: loadResult.workflowId,
              errorCode,
              errorMessage,
              durationMs: Date.now() - startedAt,
              finishedAt: new Date(),
              steps: stepRecorder.toJson() as Prisma.InputJsonValue,
            },
          });
          return;
        }

        const result = await orchestratePageWorkflow({
          workflowId: loadResult.workflowId,
          version: loadResult.version,
          nodes: loadResult.nodes,
          systemPrompt: pageAction.systemPrompt,
          objectivePrefix: instruction,
          messages,
          pageContext,
          hostTool: hostToolResolved,
          llmService: this.llmService,
          prisma: this.prisma,
          toolEngine: this.toolEngine,
          userId,
          appClientId,
          actionRunId: run.id,
          actionKey: pageAction.actionKey,
          generation,
          clientActionId: dto.clientActionId?.trim() || null,
          res,
          stepRecorder,
          allowedToolIds,
          approvalGate: this.approvalGate,
          approvalTriggerBinding: parseApprovalTriggerBinding(pageAction.config),
        });
        if (result.suspended) {
          writePageActionLifecycle(
            res,
            {
              phase: 'awaiting_approval',
              actionRunId: run.id,
              actionKey: pageAction.actionKey,
              delivery: PageActionDelivery.inline_stream,
              generation,
              clientActionId: dto.clientActionId?.trim() || null,
            },
            stepRecorder,
          );
          endInlineSseResponse(res);
          await this.prisma.pageActionRun.update({
            where: { id: run.id },
            data: {
              workflowId: loadResult.workflowId,
              workflowVersion: loadResult.version,
              workflowRun: result.workflowRun as Prisma.InputJsonValue,
              status: PageActionRunStatus.awaiting_approval,
              fillText: result.fillText || null,
              dslOutcome: result.dslOutcome,
              model: result.model,
              promptTokens: result.promptTokens,
              completionTokens: result.completionTokens,
              durationMs: Date.now() - startedAt,
              steps: result.steps as Prisma.InputJsonValue,
            },
          });
          return;
        }
        await this.prisma.pageActionRun.update({
          where: { id: run.id },
          data: {
            workflowId: loadResult.workflowId,
            workflowVersion: loadResult.version,
            workflowRun: result.workflowRun as Prisma.InputJsonValue,
            status:
              result.errorCode != null
                ? PageActionRunStatus.failed
                : result.fillText.trim().length > 0
                  ? PageActionRunStatus.completed
                  : PageActionRunStatus.failed,
            fillText: result.fillText || null,
            dslOutcome: result.dslOutcome,
            model: result.model,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            durationMs: Date.now() - startedAt,
            finishedAt: new Date(),
            steps: result.steps as Prisma.InputJsonValue,
            ...(result.errorCode
              ? {
                  errorCode: result.errorCode,
                  errorMessage: result.errorMessage ?? result.errorCode,
                }
              : result.fillText.trim().length === 0
                ? {
                    errorCode: 'STREAM_EMPTY',
                    errorMessage: 'LLM produced empty fill text',
                  }
                : {}),
          },
        });
        return;
      }

      initInlineSseResponse(res);
      if (!hostToolResolved) {
        throw new BadRequestException({
          code: 'PAGE_ACTION_HOST_TOOL_MISSING',
          message:
            'Legacy PageAction invoke requires hostToolId when no Workflow is bound',
        });
      }
      const result = await executePageActionHostFill(this.llmService, {
        actionRunId: run.id,
        actionKey: pageAction.actionKey,
        generation,
        clientActionId: dto.clientActionId?.trim() || null,
        systemPrompt: pageAction.systemPrompt,
        messages,
        pageContext,
        hostTool: hostToolResolved,
        res,
        stepRecorder,
      });
      await this.prisma.pageActionRun.update({
        where: { id: run.id },
        data: {
          status:
            result.fillText.trim().length > 0
              ? PageActionRunStatus.completed
              : PageActionRunStatus.failed,
          fillText: result.fillText || null,
          dslOutcome: result.dslOutcome,
          streamId: result.streamId,
          model: result.model,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          durationMs: Date.now() - startedAt,
          finishedAt: new Date(),
          steps: result.steps as Prisma.InputJsonValue,
          ...(result.fillText.trim().length === 0
            ? {
                errorCode: 'STREAM_EMPTY',
                errorMessage: 'LLM produced empty fill text',
              }
            : {}),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.pageActionRun.update({
        where: { id: run.id },
        data: {
          status: PageActionRunStatus.failed,
          errorCode: 'LLM_FAILED',
          errorMessage: message,
          durationMs: Date.now() - startedAt,
          finishedAt: new Date(),
          steps: stepRecorder.toJson() as Prisma.InputJsonValue,
        },
      });
      throw error;
    }
  }

  private resolvePageContext(
    dto: InvokePageActionDto,
  ): AgentChatPageContext | null {
    return coalescePageContext(
      parsePageContextFromMessageFields({
        pageContext: dto.pageContext,
        page: dto.pageContext?.page,
        routePath: dto.pageContext?.routePath,
        routeParams: dto.pageContext?.routeParams,
        flowId: dto.pageContext?.flowId,
        programName: dto.pageContext?.programName,
        entity: dto.pageContext?.entity,
        metadata: dto.pageContext?.metadata,
      }),
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

  private assertPromptLimits(
    systemPrompt: string,
    instruction: string | null,
    context?: Record<string, unknown> | null,
  ): void {
    if (systemPrompt.length > PAGE_ACTION_PROMPT_LIMITS.systemPromptMax) {
      throw new BadRequestException({
        code: 'PROMPT_TOO_LARGE',
        message: 'systemPrompt exceeds limit',
      });
    }
    if (
      instruction &&
      instruction.length > PAGE_ACTION_PROMPT_LIMITS.instructionMax
    ) {
      throw new BadRequestException({
        code: 'PROMPT_TOO_LARGE',
        message: 'instruction exceeds limit',
      });
    }
    if (context) {
      const serialized = JSON.stringify(context);
      if (serialized.length > PAGE_ACTION_PROMPT_LIMITS.contextJsonMax) {
        throw new BadRequestException({
          code: 'PROMPT_TOO_LARGE',
          message: 'context exceeds limit',
        });
      }
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

  private assertPageActionHostToolBinding(
    workflowId: number | null | undefined,
    hostToolId: number | null | undefined,
  ): void {
    const workflowBound =
      workflowId != null && Number.isInteger(workflowId) && workflowId > 0;
    if (!workflowBound && hostToolId == null) {
      throw new BadRequestException({
        code: 'PAGE_ACTION_HOST_TOOL_REQUIRED',
        message:
          'hostToolId is required when workflowId is not set; create HostTool first, then bind by id',
      });
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
