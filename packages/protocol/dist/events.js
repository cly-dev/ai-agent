"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RUNTIME_EVENTS = exports.CONFIG_CHANGE_EVENTS = void 0;
exports.CONFIG_CHANGE_EVENTS = {
    toolUpdated: 'config.tool.updated',
    hostToolUpdated: 'config.host_tool.updated',
    hostPageUpdated: 'config.host_page.updated',
    workflowUpdated: 'config.workflow.updated',
    skillUpdated: 'config.skill.updated',
    agentUpdated: 'config.agent.updated',
    promptUpdated: 'config.prompt.updated',
    llmModelUpdated: 'config.llm_model.updated',
};
exports.RUNTIME_EVENTS = {
    sessionRunEnqueued: 'runtime.session_run.enqueued',
    sessionRunCancelled: 'runtime.session_run.cancelled',
    sessionRunCompleted: 'runtime.session_run.completed',
};
//# sourceMappingURL=events.js.map