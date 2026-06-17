/** Aligns with omnix-chat `AgentChatPageContext`. */
export type AgentChatPageContext = {
  page?: string;
  routePath?: string;
  flowId?: number;
  programName?: string;
  entity?: {
    type?: string;
    id?: string;
    [key: string]: unknown;
  };
  metadata?: Record<string, unknown>;
};
