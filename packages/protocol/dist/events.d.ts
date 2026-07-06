export declare const CONFIG_CHANGE_EVENTS: {
    readonly toolUpdated: "config.tool.updated";
    readonly hostToolUpdated: "config.host_tool.updated";
    readonly hostPageUpdated: "config.host_page.updated";
    readonly workflowUpdated: "config.workflow.updated";
    readonly skillUpdated: "config.skill.updated";
    readonly agentUpdated: "config.agent.updated";
    readonly promptUpdated: "config.prompt.updated";
    readonly llmModelUpdated: "config.llm_model.updated";
};
export type ConfigChangeEventName = (typeof CONFIG_CHANGE_EVENTS)[keyof typeof CONFIG_CHANGE_EVENTS];
export type ConfigChangeEventPayload = {
    appClientId: number;
    entityId: number;
    revision?: string;
    at: string;
};
export declare const RUNTIME_EVENTS: {
    readonly sessionRunEnqueued: "runtime.session_run.enqueued";
    readonly sessionRunCancelled: "runtime.session_run.cancelled";
    readonly sessionRunCompleted: "runtime.session_run.completed";
};
