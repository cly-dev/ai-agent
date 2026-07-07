import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  PageActionDelivery,
  PageActionRunStatus,
  Prisma,
} from '../../../../generated/prisma/client';
import { ApprovalGateService } from '../../approval/approval-gate.service';
import { ApprovalTriggerPermissionService } from '../../approval/approval-trigger-permission.service';
import { parseApprovalTriggerBinding } from '../../approval/resolve-approval-parties.util';
import {
  loadWorkflowForRunDetailed,
  parseWorkflowOverridesJson,
} from '../../workflow/load-workflow-definition.util';
import { ToolEngineService } from '../../tool-engine/tool-engine.service';
import { LlmService } from '../../llm/llm.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { executePageActionHostFill } from '../page-action-host-fill.executor';
import { orchestratePageWorkflow } from '../page-workflow-orchestrator';
import {
  pageActionWorkflowLoadErrorCode,
  pageActionWorkflowLoadFailureMessage,
} from '../page-action-workflow-load.util';
import { writePageActionLifecycle } from '../page-action-inline-sse.util';
import { PageActionRunStepRecorder } from '../page-action-run-steps.util';
import { buildPageActionLlmMessages } from '../page-action-prompt.util';
import { loadPageWorkflowToolBundle } from '../page-workflow-tool-bundle.util';
import { PageActionRunStreamHub } from '../stream/page-action-run-stream.hub';
import type { PageActionRunExecutionInput } from './page-action-invoke.types';

@Injectable()
export class PageActionRunExecutor {
  private readonly logger = new Logger(PageActionRunExecutor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly toolEngine: ToolEngineService,
    private readonly approvalGate: ApprovalGateService,
    private readonly triggerPermission: ApprovalTriggerPermissionService,
    private readonly runStreamHub: PageActionRunStreamHub,
  ) {}

  executeInBackground(input: PageActionRunExecutionInput): void {
    void this.execute(input).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `page action run ${input.runId} failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  async execute(input: PageActionRunExecutionInput): Promise<void> {
    const sseSink = this.runStreamHub.openWriter(input.runId);
    const startedAt = Date.now();
    const stepRecorder = new PageActionRunStepRecorder();
    const lifecycleBase = {
      actionRunId: input.runId,
      actionKey: input.actionKey,
      delivery: PageActionDelivery.inline_stream,
      generation: input.generation,
      clientActionId: input.clientActionId,
    };

    writePageActionLifecycle(
      sseSink,
      { phase: 'started', ...lifecycleBase },
      stepRecorder,
    );

    const messages = buildPageActionLlmMessages({
      systemPrompt: input.systemPrompt,
      instruction: input.instruction,
      context: input.context ?? null,
      pageContext: input.pageContext,
    });

    try {
      if (input.workflowId) {
        await this.executeWorkflow({
          input,
          messages,
          sseSink,
          stepRecorder,
          startedAt,
          lifecycleBase,
        });
        return;
      }

      if (!input.hostToolResolved) {
        throw new BadRequestException({
          code: 'PAGE_ACTION_HOST_TOOL_MISSING',
          message:
            'Legacy PageAction invoke requires hostToolId when no Workflow is bound',
        });
      }

      const result = await executePageActionHostFill(this.llmService, {
        actionRunId: input.runId,
        actionKey: input.actionKey,
        generation: input.generation,
        clientActionId: input.clientActionId,
        systemPrompt: input.systemPrompt,
        messages,
        pageContext: input.pageContext,
        hostTool: input.hostToolResolved,
        sseSink,
        stepRecorder,
      });

      await this.prisma.pageActionRun.update({
        where: { id: input.runId },
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
      const errorCode =
        error instanceof BadRequestException &&
        typeof error.getResponse() === 'object' &&
        error.getResponse() != null &&
        'code' in (error.getResponse() as object)
          ? String((error.getResponse() as { code?: string }).code)
          : 'LLM_FAILED';
      writePageActionLifecycle(
        sseSink,
        {
          phase: 'failed',
          ...lifecycleBase,
          errorCode,
          errorMessage: message,
        },
        stepRecorder,
      );
      await this.prisma.pageActionRun.update({
        where: { id: input.runId },
        data: {
          status: PageActionRunStatus.failed,
          errorCode,
          errorMessage: message,
          durationMs: Date.now() - startedAt,
          finishedAt: new Date(),
          steps: stepRecorder.toJson() as Prisma.InputJsonValue,
        },
      });
    } finally {
      this.runStreamHub.closeSession(input.runId);
    }
  }

  private async executeWorkflow(input: {
    input: PageActionRunExecutionInput;
    messages: ReturnType<typeof buildPageActionLlmMessages>;
    sseSink: ReturnType<PageActionRunStreamHub['openWriter']>;
    stepRecorder: PageActionRunStepRecorder;
    startedAt: number;
    lifecycleBase: {
      actionRunId: number;
      actionKey: string;
      delivery: PageActionDelivery;
      generation: number;
      clientActionId: string | null;
    };
  }): Promise<void> {
    const { input: run, messages, sseSink, stepRecorder, startedAt, lifecycleBase } =
      input;
    const [loadResult, allowedToolIds] = await Promise.all([
      loadWorkflowForRunDetailed(this.prisma, {
        workflowId: run.workflowId!,
        appClientId: run.appClientId,
        workflowVersion: run.workflowVersion,
        workflowOverrides: parseWorkflowOverridesJson(run.workflowOverrides),
      }),
      this.triggerPermission.resolveUserAllowedToolIdsForApp({
        userId: run.userId,
        appClientId: run.appClientId,
      }),
    ]);

    if (loadResult.status === 'failed') {
      const errorCode = pageActionWorkflowLoadErrorCode(loadResult.reason);
      const errorMessage = pageActionWorkflowLoadFailureMessage(loadResult.reason);
      writePageActionLifecycle(
        sseSink,
        {
          phase: 'failed',
          ...lifecycleBase,
          errorCode,
          errorMessage,
        },
        stepRecorder,
      );
      await this.prisma.pageActionRun.update({
        where: { id: run.runId },
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

    const permission = this.triggerPermission.evaluateForNodes({
      nodes: loadResult.nodes,
      allowedToolIds,
    });
    if (permission.allowed === false) {
      const errorCode = 'WORKFLOW_TRIGGER_PERMISSION_DENIED';
      const errorMessage = `Missing write tool permission: ${permission.missingToolIds.join(',')}`;
      writePageActionLifecycle(
        sseSink,
        {
          phase: 'failed',
          ...lifecycleBase,
          errorCode,
          errorMessage,
        },
        stepRecorder,
      );
      await this.prisma.pageActionRun.update({
        where: { id: run.runId },
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

    const toolBundle = await loadPageWorkflowToolBundle({
      prisma: this.prisma,
      toolEngine: this.toolEngine,
      userId: run.userId,
      appClientId: run.appClientId,
      allowedToolIds,
    });

    const result = await orchestratePageWorkflow({
      workflowId: loadResult.workflowId,
      version: loadResult.version,
      nodes: loadResult.nodes,
      systemPrompt: run.systemPrompt,
      objectivePrefix: run.instruction,
      messages,
      pageContext: run.pageContext,
      hostTool: run.hostToolResolved,
      llmService: this.llmService,
      prisma: this.prisma,
      toolEngine: this.toolEngine,
      userId: run.userId,
      appClientId: run.appClientId,
      actionRunId: run.runId,
      actionKey: run.actionKey,
      generation: run.generation,
      clientActionId: run.clientActionId,
      sseSink,
      stepRecorder,
      allowedToolIds,
      toolBundle,
      approvalGate: this.approvalGate,
      approvalTriggerBinding: parseApprovalTriggerBinding(run.pageActionConfig),
    });

    if (result.suspended) {
      writePageActionLifecycle(
        sseSink,
        {
          phase: 'awaiting_approval',
          ...lifecycleBase,
        },
        stepRecorder,
      );
      await this.prisma.pageActionRun.update({
        where: { id: run.runId },
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

    const failed = result.errorCode != null;
    const empty = !failed && result.fillText.trim().length === 0;
    if (!failed && !empty) {
      writePageActionLifecycle(
        sseSink,
        {
          phase: 'completed',
          ...lifecycleBase,
          text: result.fillText,
          dslOutcome: result.dslOutcome,
        },
        stepRecorder,
      );
    } else if (failed || empty) {
      writePageActionLifecycle(
        sseSink,
        {
          phase: 'failed',
          ...lifecycleBase,
          errorCode: result.errorCode ?? 'STREAM_EMPTY',
          errorMessage:
            result.errorMessage ??
            result.errorCode ??
            'LLM produced empty fill text',
        },
        stepRecorder,
      );
    }

    await this.prisma.pageActionRun.update({
      where: { id: run.runId },
      data: {
        workflowId: loadResult.workflowId,
        workflowVersion: loadResult.version,
        workflowRun: result.workflowRun as Prisma.InputJsonValue,
        status: failed || empty ? PageActionRunStatus.failed : PageActionRunStatus.completed,
        fillText: result.fillText || null,
        dslOutcome: result.dslOutcome,
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        durationMs: Date.now() - startedAt,
        finishedAt: new Date(),
        steps: result.steps as Prisma.InputJsonValue,
        ...(failed
          ? {
              errorCode: result.errorCode,
              errorMessage: result.errorMessage ?? result.errorCode,
            }
          : empty
            ? {
                errorCode: 'STREAM_EMPTY',
                errorMessage: 'LLM produced empty fill text',
              }
            : {}),
      },
    });
  }
}
