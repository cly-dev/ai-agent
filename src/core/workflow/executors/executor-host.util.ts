import type { AgentGraphState } from '../../agent-engine/engine/main/types/agent-engine.types';
import type { AgentGraphNodeBundle } from '../../agent-engine/engine/main/agent-graph/types/graph.types';
import type { PageWorkflowExecutorRuntime } from '../page/page-workflow-runtime.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow.types';
import type {
  WorkflowExecutorHost,
  WorkflowExecutorOutcome,
} from './workflow-executor.types';

export function requireChatExecutorHost(
  host: WorkflowExecutorHost,
): Extract<WorkflowExecutorHost, { profile: 'chat' }> {
  if (host.profile !== 'chat') {
    throw new Error(`Expected chat workflow executor host, got ${host.profile}`);
  }
  return host;
}

export function requirePageExecutorHost(
  host: WorkflowExecutorHost,
): Extract<WorkflowExecutorHost, { profile: 'page' }> {
  if (host.profile !== 'page') {
    throw new Error(`Expected page workflow executor host, got ${host.profile}`);
  }
  return host;
}

export function resolveExecutorPageContext(
  host: WorkflowExecutorHost,
): AgentGraphState['pageContext'] {
  if (host.profile === 'page') {
    return host.runtime.pageContext;
  }
  return (
    host.state.pageContext ?? host.bundle.ctx.input.pageContext ?? null
  );
}

export function isCompletedExecutorOutcome(
  outcome: WorkflowExecutorOutcome,
): outcome is Extract<WorkflowExecutorOutcome, { kind: 'completed' }> {
  return outcome.kind === 'completed';
}

export function assertPageExecutorCompleted(
  action: WorkflowNodeDef['action'],
  outcome: WorkflowExecutorOutcome,
): Extract<WorkflowExecutorOutcome, { kind: 'completed' }> {
  if (outcome.kind === 'failed') {
    throw new Error(outcome.error.message);
  }
  if (outcome.kind !== 'completed') {
    throw new Error(
      `Page workflow action ${action} must complete inline, got ${outcome.kind}`,
    );
  }
  return outcome;
}

export function chatExecutorContext(input: {
  bundle: AgentGraphNodeBundle;
  state: AgentGraphState;
  def: WorkflowNodeDef;
  nodeId: string;
  workflowRun: WorkflowRunState;
}) {
  return {
    host: {
      profile: 'chat' as const,
      bundle: input.bundle,
      state: input.state,
    },
    def: input.def,
    nodeId: input.nodeId,
    workflowRun: input.workflowRun,
  };
}

export function pageExecutorContext(input: {
  runtime: PageWorkflowExecutorRuntime;
  def: WorkflowNodeDef;
  nodeId: string;
  workflowRun: WorkflowRunState;
}) {
  return {
    host: {
      profile: 'page' as const,
      runtime: input.runtime,
    },
    def: input.def,
    nodeId: input.nodeId,
    workflowRun: input.workflowRun,
  };
}
