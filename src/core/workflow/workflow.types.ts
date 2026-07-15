import type { WorkflowNodeInputByAction } from './workflow-node-input.types';

export type { WorkflowNodeInput, WorkflowNodeInputByAction } from './workflow-node-input.types';

/** Workflow 运行入口：决定允许的 action 集合与保存校验.profile。 */
export type WorkflowProfile = 'chat_skill' | 'page_action' | 'shared';

export type WorkflowActionKind =
  | 'load_page_context'
  | 'detect_clues'
  | 'fetch_data'
  | 'summarize_images'
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

/** 顶层边：always 线性 / clue 状态分支 / default 零状态命中回落。 */
export type WorkflowEdgeKind = 'always' | 'clue' | 'default';

/** 单个可配置状态（产品：状态识别；协议字段名 clue）。 */
export type WorkflowClueDef = {
  key: string;
  description: string;
};

export type WorkflowEdge = {
  id: string;
  from: string;
  to: string;
  /** 缺省 always（兼容线性隐式边）。 */
  kind?: WorkflowEdgeKind;
  /** kind=clue 时必填：该分支对应的状态定义（挂在边上，不在节点 input）。 */
  clue?: WorkflowClueDef;
};

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

/**
 * 单条状态判定结果。
 * 路由真源仅 `matched`（可多选扇出）；confidence / value / reason 供审计。
 */
export type DetectClueItemResult = {
  key: string;
  matched: boolean;
  /** 0–1 */
  confidence: number;
  value: string | null;
  reason: string;
};

export type DetectCluesOutput = {
  clues: DetectClueItemResult[];
  /** 由 matched 派生，禁止与 LLM 双写。 */
  matchedClueKeys: string[];
};

/** detect 扇出后待跑根队列；审计看 nodeOutputs，不在此堆 matched/enabled。 */
export type WorkflowRunRoutingState = {
  pendingNodeIds: string[];
};

export type WorkflowDefinition = {
  workflowKey: string;
  name: string;
  profile: WorkflowProfile;
  goal?: string | null;
  constraints?: string[];
  nodes: WorkflowNodeDef[];
  edges?: WorkflowEdge[];
  entryNodeId?: string;
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
  /** 运行时图边（含线性合成）；advance 优先使用。 */
  edges?: WorkflowEdge[];
  routing?: WorkflowRunRoutingState;
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
