/** Fields needed on the agent run hot path (lazy-cached in Redis). */
export type AgentRuntimeSnapshot = {
  id: number;
  appClientId: number;
  name: string;
  systemPrompt: string;
  maxSteps: number;
  enableToolCall: boolean;
  config: unknown;
};
