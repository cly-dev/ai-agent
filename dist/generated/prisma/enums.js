"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowDeliverable = exports.WorkflowProfile = exports.ApprovalStatus = exports.ApprovalSource = exports.PageActionRunStatus = exports.PageActionDelivery = exports.MessageFeedbackRating = exports.LlmModelKind = exports.HostToolSkillTrigger = exports.IntegrationAuthMode = exports.UserStatus = exports.AgentRunRole = exports.AgentRunStatus = exports.AdminRole = exports.HttpMethod = exports.ToolLevel = void 0;
exports.ToolLevel = {
    L1: 'L1',
    L2: 'L2',
    L3: 'L3'
};
exports.HttpMethod = {
    Get: 'Get',
    Post: 'Post',
    Put: 'Put',
    Delete: 'Delete'
};
exports.AdminRole = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    OPERATOR: 'OPERATOR',
    VIEWER: 'VIEWER'
};
exports.AgentRunStatus = {
    running: 'running',
    success: 'success',
    failed: 'failed'
};
exports.AgentRunRole = {
    primary: 'primary',
    router: 'router',
    worker: 'worker',
    reviewer: 'reviewer'
};
exports.UserStatus = {
    ACTIVE: 'ACTIVE',
    DISABLED: 'DISABLED'
};
exports.IntegrationAuthMode = {
    USER_ONLY: 'USER_ONLY',
    SYSTEM_ONLY: 'SYSTEM_ONLY',
    USER_PREFERRED: 'USER_PREFERRED'
};
exports.HostToolSkillTrigger = {
    ON_MUTATION_SUCCESS: 'ON_MUTATION_SUCCESS',
    ON_PLAN_STEP: 'ON_PLAN_STEP',
    LLM_SCOPED: 'LLM_SCOPED'
};
exports.LlmModelKind = {
    chat: 'chat',
    transformers_embedding: 'transformers_embedding',
    api_embedding: 'api_embedding'
};
exports.MessageFeedbackRating = {
    up: 'up',
    down: 'down'
};
exports.PageActionDelivery = {
    inline_stream: 'inline_stream',
    sync: 'sync'
};
exports.PageActionRunStatus = {
    running: 'running',
    awaiting_approval: 'awaiting_approval',
    completed: 'completed',
    failed: 'failed',
    cancelled: 'cancelled'
};
exports.ApprovalSource = {
    chat: 'chat',
    page_action: 'page_action',
    webhook: 'webhook'
};
exports.ApprovalStatus = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    expired: 'expired',
    cancelled: 'cancelled'
};
exports.WorkflowProfile = {
    chat_skill: 'chat_skill',
    page_action: 'page_action',
    shared: 'shared'
};
exports.WorkflowDeliverable = {
    analysis: 'analysis',
    list: 'list',
    detail: 'detail',
    mutation: 'mutation',
    answer: 'answer'
};
//# sourceMappingURL=enums.js.map