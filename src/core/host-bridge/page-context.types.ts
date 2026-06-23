/** Aligns with omnix-chat `AgentChatPageContext`. */
export type AgentChatPageContext = {
  page?: string;
  routePath?: string;
  /** 路由动态参数，如 React Router params：{ reviewId: "43689" } */
  routeParams?: Record<string, unknown>;
  flowId?: number;
  programName?: string;
  entity?: {
    type?: string;
    id?: string;
    [key: string]: unknown;
  };
  metadata?: Record<string, unknown>;
};
