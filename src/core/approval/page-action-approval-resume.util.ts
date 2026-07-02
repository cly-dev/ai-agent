import { NotFoundException } from '@nestjs/common';
import { PageActionRunStatus, Prisma } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { orchestratePageWorkflow } from '../page-action/page-workflow-orchestrator';
import { PageActionRunStepRecorder } from '../page-action/page-action-run-steps.util';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import type { ApprovalGateService } from './approval-gate.service';
import {
  loadWorkflowForRunDetailed,
  parseWorkflowOverridesJson,
} from '../workflow/load-workflow-definition.util';
import { resolvePageActionHostTool } from '../page-action/page-action-host-tool.util';
import { buildPageActionLlmMessages } from '../page-action/page-action-prompt.util';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import { HOST_TOOL_DETAIL_INCLUDE } from '../../modules/host-tool/host-tool.types';
import type { LlmService } from '../llm/llm.service';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import type { Response } from 'express';

export async function resumePageActionFromApprovalSnapshot(input: {
  snapshot: ApprovalResumeSnapshot;
  approvalRequestId: number;
  prisma: PrismaService;
  llmService: LlmService;
  toolEngine: ToolEngineService;
  approvalGate: ApprovalGateService;
}): Promise<void> {
  const { snapshot } = input;
  if (snapshot.channel.kind !== 'page_action') {
    return;
  }
  const run = await input.prisma.pageActionRun.findUnique({
    where: { id: snapshot.channel.pageActionRunId },
    include: {
      pageAction: {
        include: {
          hostTool: { include: HOST_TOOL_DETAIL_INCLUDE },
        },
      },
    },
  });
  if (!run?.pageAction) {
    throw new NotFoundException('PageActionRun not found for resume');
  }

  const pageContext = (run.pageContext ?? null) as AgentChatPageContext | null;
  const hostTool = run.pageAction.hostTool
    ? resolvePageActionHostTool(run.pageAction.hostTool, pageContext)
    : null;
  const messages = buildPageActionLlmMessages({
    systemPrompt: run.pageAction.systemPrompt,
    instruction: run.instruction,
    context: run.context as Record<string, unknown> | null,
    pageContext,
  });

  const recorder = PageActionRunStepRecorder.fromJson(run.steps);
  recorder.recordLifecycle('approval_confirmed', {
    approvalRequestId: input.approvalRequestId,
  });

  const loadResult = await loadWorkflowForRunDetailed(input.prisma, {
    workflowId: snapshot.workflowRun.workflowId,
    appClientId: run.appClientId,
    workflowVersion: snapshot.workflowRun.version,
    workflowOverrides: parseWorkflowOverridesJson(
      run.pageAction.workflowOverrides,
    ),
  });
  if (loadResult.status !== 'loaded') {
    throw new NotFoundException('Workflow not loadable for resume');
  }

  const noopRes = { write: () => undefined, end: () => undefined } as unknown as Response;

  const result = await orchestratePageWorkflow({
    workflowId: loadResult.workflowId,
    version: loadResult.version,
    nodes: loadResult.nodes,
    systemPrompt: run.pageAction.systemPrompt,
    objectivePrefix: run.instruction,
    messages,
    pageContext,
    hostTool,
    llmService: input.llmService,
    prisma: input.prisma,
    toolEngine: input.toolEngine,
    userId: run.userId,
    appClientId: run.appClientId,
    actionRunId: run.id,
    actionKey: run.pageAction.actionKey,
    generation: run.generation,
    clientActionId: run.clientActionId,
    res: noopRes,
    stepRecorder: recorder,
    allowedToolIds: snapshot.scopedToolIds,
    approvalGate: input.approvalGate,
    resumeFrom: {
      workflowRun: snapshot.workflowRun,
      nodeOutputs: snapshot.workflowNodeOutputs,
      pendingWrite: snapshot.pendingWrite,
      advancePastAwait: true,
    },
  });

  recorder.recordLifecycle(
    result.errorCode ? 'failed' : 'completed',
    {
      approvalRequestId: input.approvalRequestId,
      errorCode: result.errorCode ?? null,
    },
    result.errorCode ? 'failed' : 'ok',
  );

  await input.prisma.pageActionRun.update({
    where: { id: run.id },
    data: {
      status:
        result.suspended
          ? PageActionRunStatus.awaiting_approval
          : result.errorCode
            ? PageActionRunStatus.failed
            : PageActionRunStatus.completed,
      workflowRun: result.workflowRun as object,
      fillText: result.fillText || null,
      dslOutcome: result.dslOutcome,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      finishedAt: result.suspended ? null : new Date(),
      steps: recorder.toJson() as Prisma.InputJsonValue,
      ...(result.errorCode
        ? {
            errorCode: result.errorCode,
            errorMessage: result.errorMessage ?? result.errorCode,
          }
        : {}),
    },
  });
}
