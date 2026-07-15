import { BadRequestException } from '@nestjs/common';
import { executePageActionHostFill } from '../../../page-action/page-action-host-fill.executor';
import {
  appendWorkflowNodeOutputsToMessages,
  injectWorkflowNodeObjective,
} from '../../../page-action/page-workflow-messages.util';
import { mergePageWorkflowLlmMetrics } from '../../../page-action/page-workflow-node.util';
import { completeWorkflowNode } from '../../workflow-run.util';
import { buildWorkflowNodeOutputRef } from '../../workflow-node-output.util';
import { resolvePageActionHostToolsForPushNode } from '../../../page-action/page-action-workflow-host.util';
import { produceHostToolCallAmongCandidates } from '../../../page-action/page-action-structured-produce.util';
import { dispatchHostActionInstant } from '../../../host-bridge/host-action-instant-dispatch.util';
import { createInlineHostActionPublisher } from '../../../page-action/page-action-inline-sse.util';
import {
  PAGE_ACTION_STREAM_REASON,
  buildPageActionStreamId,
} from '../../../page-action/page-action.constants';
import { requirePageExecutorHost } from '../executor-host.util';
import type { WorkflowExecutor } from '../workflow-executor.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export const pageGenerateAndPushExecutor: WorkflowExecutor = {
  action: 'generate_and_push',
  async run(ctx) {
    const { runtime } = requirePageExecutorHost(ctx.host);
    const nodeInput = (isRecord(ctx.def.input) ? ctx.def.input : {}) as Record<
      string,
      unknown
    >;
    const hostTools = await resolvePageActionHostToolsForPushNode(
      runtime.prisma,
      {
        appClientId: runtime.appClientId,
        nodeInput,
        pageContext: runtime.pageContext,
        fallbackHostTool: runtime.hostTool,
      },
    );
    const messages = injectWorkflowNodeObjective(
      appendWorkflowNodeOutputsToMessages(runtime.messages, runtime.nodeOutputs),
      ctx.def.objective,
      runtime.objectivePrefix,
    );

    // 单候选：沿用 HostFill（instant tool_call）。多候选：一轮选 tool + 组参后 flush。
    if (hostTools.length === 1) {
      const fillResult = await executePageActionHostFill(runtime.llmService, {
        actionRunId: runtime.actionRunId,
        actionKey: runtime.actionKey,
        generation: runtime.generation,
        clientActionId: runtime.clientActionId ?? null,
        systemPrompt: runtime.systemPrompt,
        messages,
        pageContext: runtime.pageContext,
        actionContext: runtime.actionContext ?? null,
        hostTool: hostTools[0]!,
        sseSink: runtime.sseSink,
        stepRecorder: runtime.stepRecorder,
        terminalLifecycle: 'delegated',
        streamIdSegment: ctx.nodeId,
      });
      runtime.fillText = fillResult.fillText;
      runtime.dslOutcome = fillResult.dslOutcome;
      mergePageWorkflowLlmMetrics(runtime.metrics, fillResult);
    } else {
      const produced = await produceHostToolCallAmongCandidates({
        llmService: runtime.llmService,
        messages,
        hostTools: hostTools.map((row) => row.definition),
        actionContext: runtime.actionContext ?? null,
        actionRunId: runtime.actionRunId,
        actionKey: runtime.actionKey,
        budgetHints: { callKind: 'decision' },
      });
      mergePageWorkflowLlmMetrics(runtime.metrics, {
        model: produced.model,
        promptTokens: produced.promptTokens,
        completionTokens: produced.completionTokens,
      });
      if (produced.ok !== true || !produced.hostTool) {
        throw new BadRequestException({
          code: 'HOST_TOOL_CHOICE_FAILED',
          message: produced.ok === false ? produced.error : 'host tool choice failed',
        });
      }
      const publish = createInlineHostActionPublisher(runtime.sseSink, {
        onPayload: (payload) => {
          runtime.stepRecorder.recordHostActionPayload(payload);
        },
      });
      const streamId = buildPageActionStreamId({
        actionRunId: runtime.actionRunId,
        actionKey: runtime.actionKey,
        segment: ctx.nodeId,
      });
      dispatchHostActionInstant(
        publish,
        `page-action:${runtime.actionRunId}`,
        {
          pageContext: runtime.pageContext,
          runId: runtime.actionRunId,
          turnId: runtime.actionRunId,
          hostTools: [{ name: produced.hostTool.name, args: produced.args }],
          reason: PAGE_ACTION_STREAM_REASON,
          streamId,
          generation: runtime.generation,
        },
      );
      runtime.fillText = JSON.stringify(produced.args);
      runtime.dslOutcome = 'dispatched';
      runtime.stepRecorder.record({
        type: 'dsl',
        name: 'instant.dispatched',
        status: 'ok',
        detail: {
          delivery: 'instant',
          producePath: 'tool_call_multi',
          tool: produced.hostTool.name,
          argKeys: Object.keys(produced.args),
        },
      });
    }

    const outputRef = buildWorkflowNodeOutputRef(ctx.def.action, ctx.nodeId);
    const nodeOutput = {
      fillText: runtime.fillText,
      dslOutcome: runtime.dslOutcome,
    };
    return {
      kind: 'completed',
      workflowRun: completeWorkflowNode(
        ctx.workflowRun,
        ctx.nodeId,
        outputRef,
      ),
      outputRef,
      nodeOutput,
    };
  },
};
