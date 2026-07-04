import { createPageHarnessRunner } from '../../harness/harness-runner';
import { harnessSensorsForWorkflowAction } from '../../harness/sensors';
import {
  applyPageWorkflowNodeOutput,
  buildPageHarnessSensorPayload,
  runPageWorkflowHarnessSensors,
} from '../../page-action/page-workflow-node.util';
import { writePageWorkflowNodeSse } from '../../page-action/page-action-inline-sse.util';
import { dispatchPageWorkflowNodeOutcome } from '../../page-action/page-workflow-node-dispatch.util';
import { buildWorkflowNodeCompleteAudit } from '../../page-action/page-action-run-audit.util';
import { failWorkflowNode } from '../workflow-run.util';
import { logWorkflowDebug } from '../trace/workflow-debug.util';
import type { WorkflowActionKind } from '../workflow.types';
import { pageExecutorContext } from '../executors/executor-host.util';
import { getWorkflowExecutor } from '../executors/executor-registry';
import type { PageWorkflowExecutorRuntime } from './page-workflow-runtime.types';
import type { WorkflowExecutorOutcome } from '../executors/workflow-executor.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow.types';

export type PageWorkflowNodeExecutionResult =
  | {
      kind: 'completed';
      workflowRun: WorkflowRunState;
      outcome: Extract<WorkflowExecutorOutcome, { kind: 'completed' }>;
    }
  | {
      kind: 'react';
      workflowRun: WorkflowRunState;
      outcome: Extract<WorkflowExecutorOutcome, { kind: 'delegate_react' }>;
    }
  | {
      kind: 'suspend';
      workflowRun: WorkflowRunState;
      outcome: Extract<WorkflowExecutorOutcome, { kind: 'awaiting_user_confirm' }>;
      nodeId: string;
    }
  | {
      kind: 'failed';
      workflowRun: WorkflowRunState;
      errorCode: string;
      errorMessage?: string;
    };

export async function executePageWorkflowNode(input: {
  def: WorkflowNodeDef;
  nodeId: string;
  workflowRun: WorkflowRunState;
  runtime: PageWorkflowExecutorRuntime;
  actionRunId: number;
  actionKey: string;
}): Promise<PageWorkflowNodeExecutionResult> {
  const executor = getWorkflowExecutor(input.def.action, 'page');
  if (!executor) {
    return {
      kind: 'failed',
      workflowRun: failWorkflowNode(input.workflowRun, input.nodeId, {
        code: 'action_not_implemented',
        message: `Page workflow action not implemented: ${input.def.action}`,
      }),
      errorCode: 'action_not_implemented',
      errorMessage: `Page workflow action not implemented: ${input.def.action}`,
    };
  }

  const harness = createPageHarnessRunner(
    harnessSensorsForWorkflowAction(input.def.action),
  );

  writePageWorkflowNodeSse(input.runtime.res, {
    phase: 'start',
    actionRunId: input.runtime.actionRunId,
    actionKey: input.runtime.actionKey,
    generation: input.runtime.generation,
    clientActionId: input.runtime.clientActionId,
    nodeId: input.nodeId,
    action: input.def.action,
    workflowStatus: input.workflowRun.status,
    currentNodeId: input.workflowRun.currentNodeId,
  });

  const emitWorkflowNodeFailed = (
    errorCode: string,
    errorMessage?: string,
    workflowRun = input.workflowRun,
  ) => {
    writePageWorkflowNodeSse(input.runtime.res, {
      phase: 'failed',
      actionRunId: input.runtime.actionRunId,
      actionKey: input.runtime.actionKey,
      generation: input.runtime.generation,
      clientActionId: input.runtime.clientActionId,
      nodeId: input.nodeId,
      action: input.def.action,
      workflowStatus: workflowRun.status,
      currentNodeId: workflowRun.currentNodeId,
      errorCode,
      errorMessage,
    });
  };

  let rawOutcome: WorkflowExecutorOutcome;
  try {
    rawOutcome = await executor.run(
      pageExecutorContext({
        runtime: input.runtime,
        def: input.def,
        nodeId: input.nodeId,
        workflowRun: input.workflowRun,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWorkflowDebug('page_execute_node', {
      actionRunId: input.actionRunId,
      actionKey: input.actionKey,
      nodeId: input.nodeId,
      action: input.def.action,
      outcome: 'executor_error',
      errorMessage: message,
      workflowRun: input.workflowRun,
    });
    const failedRun = failWorkflowNode(input.workflowRun, input.nodeId, {
      code: 'EXECUTOR_ERROR',
      message,
    });
    emitWorkflowNodeFailed('EXECUTOR_ERROR', message, failedRun);
    return {
      kind: 'failed',
      workflowRun: failedRun,
      errorCode: 'EXECUTOR_ERROR',
      errorMessage: message,
    };
  }

  const dispatch = dispatchPageWorkflowNodeOutcome({
    nodeId: input.nodeId,
    rawOutcome,
  });

  if (dispatch.action === 'fail') {
    emitWorkflowNodeFailed(
      dispatch.errorCode,
      dispatch.errorMessage,
      dispatch.workflowRun,
    );
    return {
      kind: 'failed',
      workflowRun: dispatch.workflowRun,
      errorCode: dispatch.errorCode,
      errorMessage: dispatch.errorMessage,
    };
  }

  if (dispatch.action === 'suspend') {
    writePageWorkflowNodeSse(input.runtime.res, {
      phase: 'awaiting_approval',
      actionRunId: input.runtime.actionRunId,
      actionKey: input.runtime.actionKey,
      generation: input.runtime.generation,
      clientActionId: input.runtime.clientActionId,
      nodeId: input.nodeId,
      action: input.def.action,
      workflowStatus: dispatch.workflowRun.status,
      currentNodeId: dispatch.workflowRun.currentNodeId,
    });
    logWorkflowDebug('page_execute_node', {
      actionRunId: input.actionRunId,
      actionKey: input.actionKey,
      nodeId: input.nodeId,
      action: input.def.action,
      outcome: 'awaiting_user_confirm',
      workflowRun: dispatch.workflowRun,
    });
    return {
      kind: 'suspend',
      workflowRun: dispatch.workflowRun,
      outcome: dispatch.outcome,
      nodeId: dispatch.nodeId,
    };
  }

  if (dispatch.action === 'react') {
    logWorkflowDebug('page_execute_node', {
      actionRunId: input.actionRunId,
      actionKey: input.actionKey,
      nodeId: input.nodeId,
      action: input.def.action,
      outcome: 'delegate_react',
      workflowRun: dispatch.workflowRun,
    });
    return {
      kind: 'react',
      workflowRun: dispatch.workflowRun,
      outcome: dispatch.outcome,
    };
  }

  const outcome = dispatch.outcome;
  const sensorFailed = await runPageWorkflowHarnessSensors({
    harness,
    nodeId: input.nodeId,
    action: input.def.action,
    payload: buildPageHarnessSensorPayload(input.def.action, outcome),
    recorder: input.runtime.stepRecorder,
  });
  if (sensorFailed) {
    const failedRun = failWorkflowNode(input.workflowRun, input.nodeId, {
      code: sensorFailed.code ?? 'HARNESS_SENSOR_FAIL',
      message: sensorFailed.message ?? 'Harness sensor failed',
    });
    emitWorkflowNodeFailed(
      sensorFailed.code ?? 'HARNESS_SENSOR_FAIL',
      sensorFailed.message,
      failedRun,
    );
    return {
      kind: 'failed',
      workflowRun: failedRun,
      errorCode: sensorFailed.code ?? 'HARNESS_SENSOR_FAIL',
      errorMessage: sensorFailed.message,
    };
  }

  applyPageWorkflowNodeOutput(input.runtime, outcome);
  input.runtime.stepRecorder.record({
    type: 'workflow',
    name: `${input.nodeId}:complete`,
    detail: {
      outputRef: outcome.outputRef,
      action: input.def.action,
      ...buildWorkflowNodeCompleteAudit(input.def.action, outcome.nodeOutput),
    },
  });

  writePageWorkflowNodeSse(input.runtime.res, {
    phase: 'complete',
    actionRunId: input.runtime.actionRunId,
    actionKey: input.runtime.actionKey,
    generation: input.runtime.generation,
    clientActionId: input.runtime.clientActionId,
    nodeId: input.nodeId,
    action: input.def.action,
    workflowStatus: outcome.workflowRun.status,
    currentNodeId: outcome.workflowRun.currentNodeId,
    outputRef: outcome.outputRef ?? null,
  });

  logWorkflowDebug('page_execute_node', {
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    nodeId: input.nodeId,
    action: input.def.action,
    outcome: 'completed',
    outputRef: outcome.outputRef ?? null,
    workflowRun: outcome.workflowRun,
  });

  return {
    kind: 'completed',
    workflowRun: outcome.workflowRun,
    outcome,
  };
}

export function recordPageWorkflowNodeStart(input: {
  action: WorkflowActionKind;
  nodeId: string;
  recorder: PageWorkflowExecutorRuntime['stepRecorder'];
}): void {
  input.recorder.record({
    type: 'workflow',
    name: `${input.nodeId}:start`,
    detail: { action: input.action, nodeId: input.nodeId },
  });
}
