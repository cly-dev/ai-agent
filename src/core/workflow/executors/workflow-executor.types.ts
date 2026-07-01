import type { AgentGraphState } from '../../agent-engine/engine/main/types/agent-engine.types';
import type { AgentGraphNodeBundle } from '../../agent-engine/engine/main/agent-graph/types/graph.types';
import type { PendingRespond } from '../../agent-engine/engine/turn/turn-respond.types';
import type { TaskPlanSnapshot } from '../../agent-engine/engine/main/plan/task-plan.types';
import type { PageWorkflowExecutorRuntime } from '../page/page-workflow-runtime.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow.types';

export type WorkflowChatExecutorHost = {
  profile: 'chat';
  bundle: AgentGraphNodeBundle;
  state: AgentGraphState;
};

export type WorkflowPageExecutorHost = {
  profile: 'page';
  runtime: PageWorkflowExecutorRuntime;
};

export type WorkflowExecutorHost =
  | WorkflowChatExecutorHost
  | WorkflowPageExecutorHost;

export type WorkflowExecutorContext = {
  host: WorkflowExecutorHost;
  def: WorkflowNodeDef;
  nodeId: string;
  workflowRun: WorkflowRunState;
};

export type WorkflowExecutorOutcome =
  | {
      kind: 'completed';
      workflowRun: WorkflowRunState;
      outputRef?: string;
      nodeOutput?: unknown;
      taskPlan?: TaskPlanSnapshot;
      workflowAwaitingReact?: false;
    }
  | {
      kind: 'pending_summarize';
      workflowRun: WorkflowRunState;
      taskPlan?: TaskPlanSnapshot;
      pendingRespond: PendingRespond;
      workflowAwaitingReact?: false;
    }
  | {
      kind: 'delegate_react';
      workflowRun: WorkflowRunState;
      taskPlan?: TaskPlanSnapshot;
      workflowAwaitingReact: true;
    }
  | {
      kind: 'awaiting_user_confirm';
      workflowRun: WorkflowRunState;
      taskPlan?: TaskPlanSnapshot;
    }
  | {
      kind: 'failed';
      workflowRun: WorkflowRunState;
      error: { code: string; message: string };
    };

export type WorkflowExecutor = {
  action: WorkflowNodeDef['action'];
  run: (ctx: WorkflowExecutorContext) => Promise<WorkflowExecutorOutcome>;
};
