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
} from '../../../../generated/prisma/client';
import type { Response } from 'express';
import {
  assertPageActionScopeMatch,
  resolvePageActionHostTool,
} from '../../../core/page-action/page-action-host-tool.util';
import { replayPageActionInlineStream } from '../../../core/page-action/page-action-host-fill.executor';
import { buildPageActionRunStreamPath } from '../../../core/page-action/page-action.constants';
import {
  computePageActionKey,
  PAGE_ACTION_ACTIVE_RUN_STATUSES,
} from '../../../core/page-action/page-action-key.util';
import { resolvePageActionInvokePageContext } from '../../../core/page-action/page-action-invoke-context.util';
import { assertPageActionPromptLimits } from '../../../core/page-action/page-action-prompt-limits.util';
import { mapPageActionRunStatusToLifecyclePhase } from '../../../core/page-action/page-action-run-lifecycle.util';
import { PageActionRunExecutor } from '../../../core/page-action/execution/page-action-run.executor';
import type { PageActionInvokeAccepted } from '../../../core/page-action/execution/page-action-invoke.types';
import { PageActionRunStreamHub } from '../../../core/page-action/stream/page-action-run-stream.hub';
import {
  createExpressPageActionSseSink,
  initPageActionSseResponse,
} from '../../../core/page-action/stream/page-action-sse-sink.util';
import { writePageActionLifecycle } from '../../../core/page-action/page-action-inline-sse.util';
import { resolvePageActionHostToolRow } from '../../../core/page-action/page-action-workflow-host.util';
import type { AgentChatPageContext } from '../../../core/host-bridge';
import { PrismaService } from '../../../prisma/prisma.service';
import type { InvokePageActionDto } from '../dto/page-action.dto';
import { PAGE_ACTION_DETAIL_INCLUDE } from '../page-action.types';
import { AutomationTaskService } from '../../automation/automation-task.service';
import type { QueryAutomationTaskDto } from '../../automation/dto/query-automation-task.dto';

@Injectable()
export class PageActionCEndService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runExecutor: PageActionRunExecutor,
    private readonly runStreamHub: PageActionRunStreamHub,
    private readonly automationTasks: AutomationTaskService,
  ) {}

  async invoke(
    userId: number,
    appClientId: number,
    dto: InvokePageActionDto,
  ): Promise<PageActionInvokeAccepted> {
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

    const pageContext = resolvePageActionInvokePageContext(dto);
    assertPageActionScopeMatch({
      pageScope: pageAction.pageScope,
      hostPageScope: hostToolRow?.hostPage?.scope ?? null,
      pageContext,
    });

    const instruction = pageAction.allowCustomInstruction
      ? dto.instruction?.trim() || null
      : null;
    assertPageActionPromptLimits({
      systemPrompt: pageAction.systemPrompt,
      instruction,
      context: dto.context,
    });

    const hostToolResolved = hostToolRow
      ? resolvePageActionHostTool(hostToolRow, pageContext)
      : null;

    const pageActionKey = computePageActionKey({
      actionKey: pageAction.actionKey,
      pageContext,
      instruction,
      context: dto.context ?? null,
    });

    const activeRun = await this.findActiveRunByPageActionKey({
      pageActionId: pageAction.id,
      userId,
      pageActionKey,
    });
    if (activeRun) {
      this.throwPageActionAlreadyActive(pageActionKey, activeRun);
    }

    if (dto.idempotencyKey?.trim()) {
      const prior = await this.prisma.pageActionRun.findFirst({
        where: {
          appClientId,
          pageActionId: pageAction.id,
          idempotencyKey: dto.idempotencyKey.trim(),
        },
        orderBy: { id: 'desc' },
      });
      if (prior) {
        return this.toInvokeAccepted(
          prior.id,
          prior.generation,
          prior.clientActionId,
          prior.pageActionKey ?? pageActionKey,
          prior.status,
        );
      }
    }

    let run;
    try {
      run = await this.prisma.$transaction(async (tx) => {
        const created = await tx.pageActionRun.create({
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
            pageActionKey,
            idempotencyKey: dto.idempotencyKey?.trim() || null,
            clientActionId: dto.clientActionId?.trim() || null,
            steps: [] as Prisma.InputJsonValue,
          },
        });
        return tx.pageActionRun.update({
          where: { id: created.id },
          data: { generation: created.id },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const raced = await this.findActiveRunByPageActionKey({
          pageActionId: pageAction.id,
          userId,
          pageActionKey,
        });
        if (raced) {
          this.throwPageActionAlreadyActive(pageActionKey, raced);
        }
      }
      throw error;
    }

    this.runStreamHub.prepareSession(run.id);

    this.runExecutor.executeInBackground({
      runId: run.id,
      generation: run.id,
      userId,
      appClientId,
      pageActionId: pageAction.id,
      actionKey: pageAction.actionKey,
      workflowId: pageAction.workflowId,
      workflowVersion: pageAction.workflowVersion,
      flowId: pageAction.flowId,
      flowVersion: pageAction.flowVersion,
      workflowOverrides: pageAction.workflowOverrides,
      systemPrompt: pageAction.systemPrompt,
      instruction,
      context: dto.context ?? null,
      pageContext,
      pageActionKey,
      clientActionId: dto.clientActionId?.trim() || null,
      pageActionConfig: pageAction.config,
      hostToolResolved,
    });

    return this.toInvokeAccepted(
      run.id,
      run.id,
      dto.clientActionId?.trim() || null,
      pageActionKey,
      PageActionRunStatus.running,
    );
  }

  async subscribeRunStream(
    userId: number,
    appClientId: number,
    runId: number,
    res: Response,
  ): Promise<void> {
    const run = await this.prisma.pageActionRun.findFirst({
      where: { id: runId, appClientId, userId },
      include: {
        pageAction: { include: PAGE_ACTION_DETAIL_INCLUDE },
      },
    });
    if (!run) {
      throw new NotFoundException({
        code: 'PAGE_ACTION_RUN_NOT_FOUND',
        message: `PageActionRun ${runId} not found`,
      });
    }

    const canAttachLive =
      this.runStreamHub.hasActiveSession(runId) ||
      (run.status === PageActionRunStatus.running &&
        this.runStreamHub.hasSession(runId));

    if (canAttachLive) {
      this.runStreamHub.attachSubscriber(runId, res);
      return;
    }

    if (
      run.status === PageActionRunStatus.completed &&
      run.fillText?.trim()
    ) {
      const hostToolRow = await resolvePageActionHostToolRow(
        this.prisma,
        run.pageAction,
      );
      const pageContext = (run.pageContext ?? null) as AgentChatPageContext | null;
      const hostToolResolved = hostToolRow
        ? resolvePageActionHostTool(hostToolRow, pageContext)
        : null;
      initPageActionSseResponse(res);
      await replayPageActionInlineStream({
        sseSink: createExpressPageActionSseSink(res),
        actionRunId: run.id,
        actionKey: run.pageAction.actionKey,
        generation: run.generation,
        clientActionId: run.clientActionId,
        fillText: run.fillText,
        dslOutcome: run.dslOutcome,
        streamId: run.streamId,
        pageContext,
        hostTool: hostToolResolved,
      });
      return;
    }

    initPageActionSseResponse(res);
    const sink = createExpressPageActionSseSink(res);
    writePageActionLifecycle(sink, {
      phase: mapPageActionRunStatusToLifecyclePhase(run.status),
      actionRunId: run.id,
      actionKey: run.pageAction.actionKey,
      delivery: PageActionDelivery.inline_stream,
      generation: run.generation,
      clientActionId: run.clientActionId,
      text: run.fillText ?? undefined,
      dslOutcome: run.dslOutcome,
      errorCode: run.errorCode,
      errorMessage: run.errorMessage,
    });
    sink.end();
  }

  listRuns(
    userId: number,
    appClientId: number,
    query: QueryAutomationTaskDto,
  ) {
    return this.automationTasks.list({
      appClientId,
      userId,
      status: query.status,
      triggerSource: 'page_action',
      actionKey: query.actionKey,
      workflowKey: query.workflowKey,
      limit: query.limit,
      offset: query.offset,
    });
  }

  private async findActiveRunByPageActionKey(input: {
    pageActionId: number;
    userId: number;
    pageActionKey: string;
  }) {
    return this.prisma.pageActionRun.findFirst({
      where: {
        pageActionId: input.pageActionId,
        userId: input.userId,
        pageActionKey: input.pageActionKey,
        status: { in: [...PAGE_ACTION_ACTIVE_RUN_STATUSES] },
      },
      include: { approvalRequest: { select: { id: true } } },
      orderBy: { id: 'desc' },
    });
  }

  private throwPageActionAlreadyActive(
    pageActionKey: string,
    activeRun: {
      id: number;
      status: PageActionRunStatus;
      approvalRequest: { id: number } | null;
    },
  ): never {
    throw new ConflictException({
      code: 'PAGE_ACTION_ALREADY_ACTIVE',
      message:
        'An active PageAction run already exists for the same page context',
      pageActionKey,
      existingRunId: activeRun.id,
      existingStatus: activeRun.status,
      approvalRequestId: activeRun.approvalRequest?.id ?? null,
      streamUrl: buildPageActionRunStreamPath(activeRun.id),
    });
  }

  private toInvokeAccepted(
    runId: number,
    generation: number,
    clientActionId: string | null | undefined,
    pageActionKey: string,
    status: PageActionRunStatus,
  ): PageActionInvokeAccepted {
    return {
      runId,
      generation,
      clientActionId: clientActionId ?? null,
      pageActionKey,
      streamUrl: buildPageActionRunStreamPath(runId),
      status,
    };
  }
}
