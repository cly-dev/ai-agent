import { assessPageContextData } from '../../host-bridge/page-context-usage.util';
import { completeWorkflowNode } from '../workflow-run.util';
import { buildWorkflowNodeOutputRef } from '../workflow-node-output.util';
import { resolveExecutorPageContext } from './executor-host.util';
import type { WorkflowExecutor } from './workflow-executor.types';

export const loadPageContextExecutor: WorkflowExecutor = {
  action: 'load_page_context',
  async run(ctx) {
    const assessed = assessPageContextData(
      resolveExecutorPageContext(ctx.host),
    );
    const outputRef = buildWorkflowNodeOutputRef(ctx.def.action, ctx.nodeId);
    const workflowRun = completeWorkflowNode(
      ctx.workflowRun,
      ctx.nodeId,
      outputRef,
    );
    return {
      kind: 'completed',
      workflowRun,
      outputRef,
      nodeOutput: assessed,
    };
  },
};
