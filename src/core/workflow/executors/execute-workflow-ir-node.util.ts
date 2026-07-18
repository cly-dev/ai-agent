import { materializeNativeFlatIrNode } from '../workflow-ir-native-direct.util';
import type { WorkflowIrNode } from '../workflow-ir.types';
import type { WorkflowRunState } from '../workflow.types';
import { pageExecutorContext } from './executor-host.util';
import { resolveWorkflowNodeExecutor } from './resolve-workflow-node-executor.util';
import type {
  WorkflowExecutorHost,
  WorkflowExecutorOutcome,
} from './workflow-executor.types';

/**
 * Plan A：按 IR 节点执行（§4.3c / 4.3f flat）。
 * 1:1 节点（含标准 mutate 的 compose/await/write）桥接现有 action executor。
 */
export async function executeWorkflowIrNode(input: {
  host: WorkflowExecutorHost;
  irNode: WorkflowIrNode;
  /** 运行态 nodeId；native 下等于 irNode.id */
  nodeId: string;
  workflowRun: WorkflowRunState;
}): Promise<WorkflowExecutorOutcome> {
  let def;
  try {
    def = materializeNativeFlatIrNode(input.irNode);
  } catch {
    return {
      kind: 'failed',
      workflowRun: input.workflowRun,
      error: {
        code: 'ir_type_not_native_flat',
        message: `IR type "${input.irNode.type}" is not 1:1 executable on native lane`,
      },
    };
  }

  const profile = input.host.profile;
  const resolved = resolveWorkflowNodeExecutor(def, profile);
  if (!resolved.executor) {
    return {
      kind: 'failed',
      workflowRun: input.workflowRun,
      error: {
        code: 'action_not_implemented',
        message: `No executor for IR type ${input.irNode.type} (${resolved.action})`,
      },
    };
  }

  if (input.host.profile === 'page') {
    return resolved.executor.run(
      pageExecutorContext({
        runtime: input.host.runtime,
        def,
        nodeId: input.nodeId,
        workflowRun: input.workflowRun,
      }),
    );
  }

  return resolved.executor.run({
    host: input.host,
    def,
    nodeId: input.nodeId,
    workflowRun: input.workflowRun,
  });
}
