import { executePageWorkflowFetchData } from '../../../page-action/page-workflow-fetch-data.util';
import { completeWorkflowNode } from '../../workflow-run.util';
import { buildWorkflowNodeOutputRef } from '../../workflow-node-output.util';
import type { FetchDataNodeInput } from '../../workflow-node-input.types';
import { requirePageExecutorHost } from '../executor-host.util';
import type { WorkflowExecutor } from '../workflow-executor.types';

export const pageFetchDataExecutor: WorkflowExecutor = {
  action: 'fetch_data',
  async run(ctx) {
    const { runtime } = requirePageExecutorHost(ctx.host);
    const nodeInput = ctx.def.input as FetchDataNodeInput;

    const observation = await executePageWorkflowFetchData({
      prisma: runtime.prisma,
      toolEngine: runtime.toolEngine,
      userId: runtime.userId,
      appClientId: runtime.appClientId,
      nodeInput,
      pageContext: runtime.pageContext,
      stepRecorder: runtime.stepRecorder,
      nodeId: ctx.nodeId,
    });

    const outputRef = buildWorkflowNodeOutputRef(ctx.def.action, ctx.nodeId);
    const nodeOutput = {
      toolId: observation.toolId,
      toolName: observation.toolName,
      output: observation.output,
      agentMetadata: observation.agentMetadata,
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
