import type { WorkflowNodeInputByAction } from './workflow-node-input.types';

export type { WorkflowNodeInput, WorkflowNodeInputByAction } from './workflow-node-input.types';

/** Workflow 运行入口：决定允许的 action 集合与保存校验.profile。 */
export type WorkflowProfile = 'chat_skill' | 'page_action' | 'shared';

export type WorkflowActionKind =
  | 'load_page_context'
  | 'fetch_data'
  | 'generate_and_push'
  | 'summarize'
  | 'compose_mutation'
  | 'present_mutation'
  | 'write_data'
  | 'await_user_confirm';

/** 节点生命周期（L1 业务态，对产品 / SSE / run 审计权威）。 */
export type WorkflowNodeStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'skipped';

export const WORKFLOW_NODE_STATUSES: readonly WorkflowNodeStatus[] = [
  'pending',
  'running',
  'succeeded',
  'failed',
  'skipped',
] as const;

export type WorkflowNodeTerminalStatus = Extract<
  WorkflowNodeStatus,
  'succeeded' | 'failed' | 'skipped'
>;

export type WorkflowRunStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type WorkflowRunCompiledFrom =
  | 'workflow_db'
  | 'plan_llm'
  | 'template'
  | 'minimal'
  | 'resume'
  | 'legacy_config';

/** DB Workflow.nodes / API 配置层节点。 */
export type WorkflowNodeDef<
  A extends WorkflowActionKind = WorkflowActionKind,
> = {
  id: string;
  action: A;
  name: string;
  objective: string;
  input: WorkflowNodeInputByAction[A];
};

export type WorkflowDefinition = {
  workflowKey: string;
  name: string;
  profile: WorkflowProfile;
  goal?: string | null;
  constraints?: string[];
  nodes: WorkflowNodeDef[];
};

export type WorkflowBindingRefs = {
  toolIds: number[];
  hostToolIds: number[];
};

export type WorkflowRunNodeState = {
  nodeId: string;
  action: WorkflowActionKind;
  name: string;
  status: WorkflowNodeStatus;
  startedAt?: string;
  finishedAt?: string;
  outputRef?: string;
  error?: {
    code: string;
    message: string;
  };
};

/** 单次 invoke / Agent run 内的 L1 工作流快照。 */
export type WorkflowRunState = {
  workflowId: number;
  version: number;
  currentNodeId: string | null;
  status: WorkflowRunStatus;
  compiledFrom?: WorkflowRunCompiledFrom;
  nodes: WorkflowRunNodeState[];
};

export type WorkflowValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type WorkflowOverrides = Record<
  string,
  {
    objective?: string;
  }
>;
