export type AgentRunStepType =
  | 'skill'
  | 'plan'
  | 'plan_sync'
  | 'route_plan'
  | 'readiness'
  | 'intent'
  | 'llm'
  | 'tool'
  | 'gather'
  | 'result_check'
  | 'summarize';
export type AgentRunStatus = 'running' | 'success' | 'failed';

export type AgentRunStepMeta = {
  prompt?: string;
  model?: string;
  latency?: number;
  code?: string;
  toolSchema?: string;
  observations?: string;
  agentPrompt?: string;
  userRequest?: string;
  duplicateToolCallsSkipped?: boolean;
};

export type AgentRunStep = {
  step: number;
  type: AgentRunStepType;
  name?: string;
  input?: Record<string, unknown> | string | number | boolean | null;
  output?: Record<string, unknown> | string | number | boolean | null;
  meta?: AgentRunStepMeta;
};

export interface AgentRunType {
  id?: number;
  agentId: number;
  appClientId: number;
  sessionId: string;
  input: string;
  output?: string;
  status: AgentRunStatus;
  steps: AgentRunStep[];
  currentStep: number;
  maxSteps: number;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
