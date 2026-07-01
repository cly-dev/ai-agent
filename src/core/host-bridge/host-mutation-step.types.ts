/** host-bridge mutation 检测所需的最小 run step 形状（与 AgentRunStep 结构兼容）。 */
export type HostMutationRunStep = {
  type: string;
  name?: string;
  input?: Record<string, unknown> | string;
  meta?: {
    executionStatus?: 'SUCCESS' | 'EMPTY' | 'ERROR';
    llmArguments?: Record<string, unknown>;
  };
};

/** host-bridge mutation 检测所需的最小 scoped tool 形状。 */
export type HostMutationScopedTool = {
  name: string;
  agentMetadata: unknown;
};
