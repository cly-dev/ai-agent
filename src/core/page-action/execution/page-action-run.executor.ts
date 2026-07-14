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
import { executePageWorkflowSummarize } from '../page-workflow-summarize.util';
import { orchestratePageWorkflow } from '../page-workflow-orchestrator';
import {
  pageActionWorkflowLoadErrorCode,
  pageActionWorkflowLoadFailureMessage,
} from '../page-action-workflow-load.util';
import {
  endInlineSseResponse,
  writePageActionLifecycle,
} from '../page-action-inline-sse.util';
import {
  completionFromHostFill,
  completionFromSummarizeText,
} from '../page-action-run-completion.util';
import {
  emitPageActionRunTerminalSse,
  mapTerminalPhaseToRunStatus,
  resolvePageActionRunTerminalOutcome,
} from '../page-action-run-terminal-sse.util';
import { PageActionRunStepRecorder } from '../page-action-run-steps.util';
import { buildPageActionLlmMessages } from '../page-action-prompt.util';
import { buildPageActionStreamId } from '../page-action.constants';
import { loadPageWorkflowToolBundle } from '../page-workflow-tool-bundle.util';
import { resolvePageActionSummarizeHostTool } from '../page-action-summarize-host-tool.util';
import { resolvePageActionRunOutputText } from '../resolve-page-action-run-output-text.util';
import { PageActionRunStreamHub } from '../stream/page-action-run-stream.hub';
import type { PageActionRunExecutionInput } from './page-action-invoke.types';
import {
  logPageActionLlmPrompt,
  logPageActionRunDebug,
} from '../page-action-run-debug.util';

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
    const streamId = buildPageActionStreamId({
      actionRunId: input.runId,
      actionKey: input.actionKey,
    });
    const lifecycleBase = {
      actionRunId: input.runId,
      actionKey: input.actionKey,
      delivery: PageActionDelivery.inline_stream,
      generation: input.generation,
      clientActionId: input.clientActionId,
      streamId,
    };

    const emitInitialStarted =
      Boolean(input.workflowId) || !input.hostToolResolved;
    if (emitInitialStarted) {
      writePageActionLifecycle(
        sseSink,
        { phase: 'started', ...lifecycleBase },
        stepRecorder,
      );
    }

    const messages = buildPageActionLlmMessages({
      systemPrompt: input.systemPrompt,
      instruction: input.instruction,
      context: input.context ?? null,
      pageContext: input.pageContext,
    });

    logPageActionRunDebug('invoke', {
      actionRunId: input.runId,
      actionKey: input.actionKey,
      generation: input.generation,
      workflowId: input.workflowId,
      hostTool: input.hostToolResolved
        ? {
            id: input.hostToolResolved.definition.id,
            name: input.hostToolResolved.definition.name,
            delivery: input.hostToolResolved.delivery,
            produceMode: input.hostToolResolved.produceMode,
            argsSchema: input.hostToolResolved.definition.argsSchema,
          }
        : null,
      instruction: input.instruction,
      pageContext: input.pageContext,
      context: input.context ?? null,
      systemPromptLength: input.systemPrompt.length,
    });
    logPageActionLlmPrompt({
      actionRunId: input.runId,
      actionKey: input.actionKey,
      phase: 'initial_messages',
      messages,
      meta: {
        hasWorkflow: Boolean(input.workflowId),
        hasHostTool: Boolean(input.hostToolResolved),
      },
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

      if (input.hostToolResolved) {
        const result = await executePageActionHostFill(this.llmService, {
          actionRunId: input.runId,
          actionKey: input.actionKey,
          generation: input.generation,
          clientActionId: input.clientActionId,
          systemPrompt: input.systemPrompt,
          messages,
          pageContext: input.pageContext,
          actionContext: input.context ?? null,
          hostTool: input.hostToolResolved,
          sseSink,
          stepRecorder,
        });

        const completion = completionFromHostFill({
          fillText: result.fillText,
          dslOutcome: result.dslOutcome,
        });
        const terminal = resolvePageActionRunTerminalOutcome(completion);

        await this.prisma.pageActionRun.update({
          where: { id: input.runId },
          data: {
            status: mapTerminalPhaseToRunStatus(terminal.phase),
            fillText: terminal.fillText,
            dslOutcome: result.dslOutcome,
            streamId: result.streamId,
            model: result.model,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            durationMs: Date.now() - startedAt,
            finishedAt: new Date(),
            steps: result.steps as Prisma.InputJsonValue,
            errorCode: terminal.errorCode,
            errorMessage: terminal.errorMessage,
          },
        });
        logPageActionRunDebug('result', {
          actionRunId: input.runId,
          actionKey: input.actionKey,
          path: 'host_fill',
          terminalPhase: terminal.phase,
          dslOutcome: result.dslOutcome,
          streamId: result.streamId,
          model: result.model,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          llmCallCount: result.llmCallCount,
          appendCount: result.appendCount,
          fillText: result.fillText,
          errorCode: terminal.errorCode,
          errorMessage: terminal.errorMessage,
          durationMs: Date.now() - startedAt,
          steps: result.steps,
        });
        return;
      }

      const summarizeHostTool = await resolvePageActionSummarizeHostTool(
        this.prisma,
        {
          appClientId: input.appClientId,
          pageContext: input.pageContext,
          fallbackHostTool: input.hostToolResolved,
        },
      );

      const summary = await executePageWorkflowSummarize({
        llmService: this.llmService,
        messages,
        nodeInput: { mode: 'final' },
        sseSink,
        actionRunId: input.runId,
        actionKey: input.actionKey,
        generation: input.generation,
        clientActionId: input.clientActionId,
        existingFillText: '',
        pageContext: input.pageContext,
        summarizeHostTool,
        stepRecorder,
        systemPrompt: input.systemPrompt,
        objectivePrefix: input.instruction,
      });

      const completion = completionFromSummarizeText(
        summary.summaryText,
        summary.dslOutcome,
      );
      const terminal = resolvePageActionRunTerminalOutcome(completion);

      emitPageActionRunTerminalSse({
        sseSink,
        recorder: stepRecorder,
        actionRunId: input.runId,
        actionKey: input.actionKey,
        generation: input.generation,
        clientActionId: input.clientActionId,
        streamId,
        outcome: terminal,
        dslOutcome: summary.dslOutcome,
      });

      await this.prisma.pageActionRun.update({
        where: { id: input.runId },
        data: {
          status: mapTerminalPhaseToRunStatus(terminal.phase),
          fillText: terminal.fillText,
          dslOutcome: summary.dslOutcome,
          streamId,
          model: summary.model,
          promptTokens: summary.promptTokens,
          completionTokens: summary.completionTokens,
          durationMs: Date.now() - startedAt,
          finishedAt: new Date(),
          steps: stepRecorder.toJson() as Prisma.InputJsonValue,
          errorCode: terminal.errorCode,
          errorMessage: terminal.errorMessage,
        },
      });
      logPageActionRunDebug('result', {
        actionRunId: input.runId,
        actionKey: input.actionKey,
        path: 'summarize',
        terminalPhase: terminal.phase,
        dslOutcome: summary.dslOutcome,
        streamId,
        model: summary.model,
        promptTokens: summary.promptTokens,
        completionTokens: summary.completionTokens,
        fillText: terminal.fillText,
        errorCode: terminal.errorCode,
        errorMessage: terminal.errorMessage,
        durationMs: Date.now() - startedAt,
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
      logPageActionRunDebug('error', {
        actionRunId: input.runId,
        actionKey: input.actionKey,
        errorCode,
        errorMessage: message,
        durationMs: Date.now() - startedAt,
      });
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
      if (!sseSink.writableEnded) {
        endInlineSseResponse(sseSink);
      }
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
      streamId: string;
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
      actionContext: run.context ?? null,
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
      pageActionKey: run.pageActionKey,
    });

    const terminal = resolvePageActionRunTerminalOutcome(result.completion);
    const persistedFillText = resolvePageActionRunOutputText({
      fillText: terminal.fillText,
      errorMessage: terminal.errorMessage,
      steps: result.steps,
    });
    const terminalOutcome = {
      ...terminal,
      fillText: persistedFillText,
    };

    emitPageActionRunTerminalSse({
      sseSink,
      recorder: stepRecorder,
      actionRunId: run.runId,
      actionKey: run.actionKey,
      generation: run.generation,
      clientActionId: run.clientActionId,
      streamId: input.lifecycleBase.streamId,
      outcome: terminalOutcome,
      dslOutcome: result.dslOutcome,
    });

    await this.prisma.pageActionRun.update({
      where: { id: run.runId },
      data: {
        workflowId: loadResult.workflowId,
        workflowVersion: loadResult.version,
        workflowRun: result.workflowRun as Prisma.InputJsonValue,
        status: mapTerminalPhaseToRunStatus(terminalOutcome.phase),
        fillText: persistedFillText,
        dslOutcome: result.dslOutcome,
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        durationMs: Date.now() - startedAt,
        finishedAt: terminalOutcome.phase === 'awaiting_approval' ? null : new Date(),
        steps: result.steps as Prisma.InputJsonValue,
        errorCode: terminalOutcome.errorCode,
        errorMessage: terminalOutcome.errorMessage,
      },
    });
    logPageActionRunDebug('result', {
      actionRunId: run.runId,
      actionKey: run.actionKey,
      path: 'workflow',
      workflowId: loadResult.workflowId,
      workflowVersion: loadResult.version,
      terminalPhase: terminalOutcome.phase,
      dslOutcome: result.dslOutcome,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      fillText: persistedFillText,
      errorCode: terminalOutcome.errorCode,
      errorMessage: terminalOutcome.errorMessage,
      durationMs: Date.now() - startedAt,
      steps: result.steps,
      workflowRun: result.workflowRun,
    });
  }
}
