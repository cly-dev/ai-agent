import { executePageWorkflowSummarize } from '../../../page-action/page-workflow-summarize.util';
import {
  appendWorkflowNodeOutputsToMessages,
  injectWorkflowNodeObjective,
} from '../../../page-action/page-workflow-messages.util';
import { mergePageWorkflowLlmMetrics } from '../../../page-action/page-workflow-node.util';
import { completeWorkflowNode } from '../../workflow-run.util';
import { buildWorkflowNodeOutputRef } from '../../workflow-node-output.util';
import type { SummarizeNodeInput } from '../../workflow-node-input.types';
import { requirePageExecutorHost } from '../executor-host.util';
import type { WorkflowExecutor } from '../workflow-executor.types';

export const pageSummarizeExecutor: WorkflowExecutor = {
  action: 'summarize',
  async run(ctx) {
    const { runtime } = requirePageExecutorHost(ctx.host);
    const nodeInput = ctx.def.input as SummarizeNodeInput;
    const mode = nodeInput.mode ?? 'final';
    const messages = injectWorkflowNodeObjective(
      appendWorkflowNodeOutputsToMessages(runtime.messages, runtime.nodeOutputs),
      ctx.def.objective,
      runtime.objectivePrefix,
    );
    const summarizeResult = await executePageWorkflowSummarize({
      llmService: runtime.llmService,
      messages,
      nodeInput,
      res: runtime.res,
      actionRunId: runtime.actionRunId,
      actionKey: runtime.actionKey,
      generation: runtime.generation,
      clientActionId: runtime.clientActionId ?? null,
      existingFillText: runtime.fillText,
      stepRecorder: runtime.stepRecorder,
    });
    mergePageWorkflowLlmMetrics(runtime.metrics, summarizeResult);

    const outputRef = buildWorkflowNodeOutputRef(ctx.def.action, ctx.nodeId);
    const nodeOutput = {
      summaryText: summarizeResult.summaryText,
      mode,
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
