/** 跨服务配置变更事件（config -> runtime cache invalidation）。 */
export const CONFIG_CHANGE_EVENTS = {
  toolUpdated: 'config.tool.updated',
  hostToolUpdated: 'config.host_tool.updated',
  hostPageUpdated: 'config.host_page.updated',
  workflowUpdated: 'config.workflow.updated',
  skillUpdated: 'config.skill.updated',
  agentUpdated: 'config.agent.updated',
  promptUpdated: 'config.prompt.updated',
  llmModelUpdated: 'config.llm_model.updated',
} as const;

export type ConfigChangeEventName =
  (typeof CONFIG_CHANGE_EVENTS)[keyof typeof CONFIG_CHANGE_EVENTS];

export type ConfigChangeEventPayload = {
  appClientId: number;
  entityId: number;
  revision?: string;
  at: string;
};

/** Session run 队列事件（chat-runtime -> agent-worker）。 */
export const RUNTIME_EVENTS = {
  sessionRunEnqueued: 'runtime.session_run.enqueued',
  sessionRunCancelled: 'runtime.session_run.cancelled',
  sessionRunCompleted: 'runtime.session_run.completed',
} as const;
