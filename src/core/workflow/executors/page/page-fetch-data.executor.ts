import { executePageWorkflowFetchData } from '../../../page-action/page-workflow-fetch-data.util';
import {
  appendWorkflowNodeOutputsToMessages,
} from '../../../page-action/page-workflow-messages.util';
import { completeWorkflowNode } from '../../workflow-run.util';
import { buildWorkflowNodeOutputRef } from '../../workflow-node-output.util';
import type { FetchDataNodeInput } from '../../workflow-node-input.types';
import { resolveWorkflowNodeRuntimeInput } from '../../resolve-workflow-node-runtime-input.util';
import { requirePageExecutorHost } from '../executor-host.util';
import type { WorkflowExecutor } from '../workflow-executor.types';
import {
  materializeEntitiesFromToolOutput,
  mergeMaterializedEntities,
  recordPageActionEntityMaterialization,
} from '../../../entity-materialization';
import { parseResponseProfile } from '../../../tool-engine/tool-output-projection.util';

export const pageFetchDataExecutor: WorkflowExecutor = {
  action: 'fetch_data',
  async run(ctx) {
    const { runtime } = requirePageExecutorHost(ctx.host);
    const nodeInput = resolveWorkflowNodeRuntimeInput(ctx.def) as FetchDataNodeInput;

    const observation = await executePageWorkflowFetchData({
      prisma: runtime.prisma,
      toolEngine: runtime.toolEngine,
      userId: runtime.userId,
      appClientId: runtime.appClientId,
      nodeInput,
      pageContext: runtime.pageContext,
      stepRecorder: runtime.stepRecorder,
      nodeId: ctx.nodeId,
      toolBundle: runtime.toolBundle,
      llmService: runtime.llmService,
      messages: appendWorkflowNodeOutputsToMessages(
        runtime.messages,
        runtime.nodeOutputs,
      ),
      nodeObjective: ctx.def.objective,
    });

    const resolvedTool =
      runtime.toolBundle?.toolById.get(observation.toolId) ?? null;
    const upstreamEntities = materializeEntitiesFromToolOutput({
      raw: observation.output,
      profile: parseResponseProfile(resolvedTool?.responseProfile),
    });
    if (upstreamEntities.length > 0) {
      runtime.materializedEntities = mergeMaterializedEntities(
        runtime.materializedEntities,
        upstreamEntities,
      );
      recordPageActionEntityMaterialization(
        runtime.stepRecorder,
        runtime.materializedEntities,
        { name: 'entity_materialization_upstream' },
      );
    }

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
