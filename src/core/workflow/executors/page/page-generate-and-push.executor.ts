import { executePageActionHostFill } from '../../../page-action/page-action-host-fill.executor';
import {
  appendWorkflowNodeOutputsToMessages,
  injectWorkflowNodeObjective,
} from '../../../page-action/page-workflow-messages.util';
import { mergePageWorkflowLlmMetrics } from '../../../page-action/page-workflow-node.util';
import { completeWorkflowNode } from '../../workflow-run.util';
import { buildWorkflowNodeOutputRef } from '../../workflow-node-output.util';
import { requirePageExecutorHost } from '../executor-host.util';
import type { WorkflowExecutor } from '../workflow-executor.types';

export const pageGenerateAndPushExecutor: WorkflowExecutor = {
  action: 'generate_and_push',
  async run(ctx) {
    const { runtime } = requirePageExecutorHost(ctx.host);
    const messages = injectWorkflowNodeObjective(
      appendWorkflowNodeOutputsToMessages(runtime.messages, runtime.nodeOutputs),
      ctx.def.objective,
      runtime.objectivePrefix,
    );
    const fillResult = await executePageActionHostFill(runtime.llmService, {
      actionRunId: runtime.actionRunId,
      actionKey: runtime.actionKey,
      generation: runtime.generation,
      clientActionId: runtime.clientActionId ?? null,
      systemPrompt: runtime.systemPrompt,
      messages,
      pageContext: runtime.pageContext,
      hostTool: runtime.hostTool,
      res: runtime.res,
      stepRecorder: runtime.stepRecorder,
    });

    runtime.fillText = fillResult.fillText;
    runtime.dslOutcome = fillResult.dslOutcome;
    mergePageWorkflowLlmMetrics(runtime.metrics, fillResult);

    const outputRef = buildWorkflowNodeOutputRef(ctx.def.action, ctx.nodeId);
    const nodeOutput = {
      fillText: fillResult.fillText,
      dslOutcome: fillResult.dslOutcome,
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
