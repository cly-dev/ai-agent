import { executePageWorkflowSummarize } from '../../../page-action/page-workflow-summarize.util';
import {
  appendWorkflowNodeOutputsToMessages,
  injectWorkflowNodeObjective,
} from '../../../page-action/page-workflow-messages.util';
import { mergePageWorkflowLlmMetrics } from '../../../page-action/page-workflow-node.util';
import { completeWorkflowNode } from '../../workflow-run.util';
import { buildWorkflowNodeOutputRef } from '../../workflow-node-output.util';
import type { PresentMutationNodeInput } from '../../workflow-node-input.types';
import { requirePageExecutorHost } from '../executor-host.util';
import type { WorkflowExecutor } from '../workflow-executor.types';

/**
 * Page 路径与 Chat present_mutation 语义对齐：内联 LLM 生成草稿说明后 advance 到 await。
 * Chat 走 pending_summarize → summarize 图节点；Page 直接 completed（同一节点定义）。
 */
export const pagePresentMutationExecutor: WorkflowExecutor = {
  action: 'present_mutation',
  async run(ctx) {
    const { runtime } = requirePageExecutorHost(ctx.host);
    const nodeInput = ctx.def.input as PresentMutationNodeInput;
    const mode = nodeInput.mode ?? 'brief';
    const messages = injectWorkflowNodeObjective(
      appendWorkflowNodeOutputsToMessages(runtime.messages, runtime.nodeOutputs),
      ctx.def.objective,
      runtime.objectivePrefix,
    );
    const summarizeResult = await executePageWorkflowSummarize({
      llmService: runtime.llmService,
      messages,
      nodeInput: { mode },
      res: runtime.res,
      actionRunId: runtime.actionRunId,
      actionKey: runtime.actionKey,
      generation: runtime.generation,
      clientActionId: runtime.clientActionId ?? null,
      existingFillText: runtime.fillText,
      stepRecorder: runtime.stepRecorder,
      streamLifecycle: 'none',
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
