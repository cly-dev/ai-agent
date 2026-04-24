export type AgentRunStepType = 'llm' | 'tool';
export type AgentRunStatus = 'running' | 'success' | 'failed';

export type AgentRunStepMeta = {
  prompt?: string;
  model?: string;
  latency?: number;
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
