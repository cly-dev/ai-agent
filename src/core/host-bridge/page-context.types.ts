/** Aligns with omnix-chat `AgentChatPageContext`. */
export type AgentChatPageContext = {
  page?: string;
  routePath?: string;
  /** 路由动态参数，如 React Router params：{ entityId: "43689" } */
  routeParams?: Record<string, unknown>;
  flowId?: number;
  programName?: string;
  entity?: {
    type?: string;
    id?: string;
    [key: string]: unknown;
  };
  /**
   * 宿主扩展字段。内联正文协议：`{ [kind]: { content: string, ... } }`；
   * kind 由前端定义，服务端只做结构性扫描。
   */
  metadata?: Record<string, unknown>;
};
