export declare const ToolLevel: {
    readonly L1: "L1";
    readonly L2: "L2";
    readonly L3: "L3";
};
export type ToolLevel = (typeof ToolLevel)[keyof typeof ToolLevel];
export declare const HttpMethod: {
    readonly Get: "Get";
    readonly Post: "Post";
    readonly Put: "Put";
    readonly Delete: "Delete";
};
export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];
export declare const AdminRole: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly OPERATOR: "OPERATOR";
    readonly VIEWER: "VIEWER";
};
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];
export declare const AgentRunStatus: {
    readonly running: "running";
    readonly success: "success";
    readonly failed: "failed";
};
export type AgentRunStatus = (typeof AgentRunStatus)[keyof typeof AgentRunStatus];
export declare const AgentRunRole: {
    readonly primary: "primary";
    readonly router: "router";
    readonly worker: "worker";
    readonly reviewer: "reviewer";
};
export type AgentRunRole = (typeof AgentRunRole)[keyof typeof AgentRunRole];
export declare const UserStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly DISABLED: "DISABLED";
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export declare const IntegrationAuthMode: {
    readonly USER_ONLY: "USER_ONLY";
    readonly SYSTEM_ONLY: "SYSTEM_ONLY";
    readonly USER_PREFERRED: "USER_PREFERRED";
};
export type IntegrationAuthMode = (typeof IntegrationAuthMode)[keyof typeof IntegrationAuthMode];
export declare const HostToolSkillTrigger: {
    readonly ON_MUTATION_SUCCESS: "ON_MUTATION_SUCCESS";
    readonly ON_PLAN_STEP: "ON_PLAN_STEP";
    readonly LLM_SCOPED: "LLM_SCOPED";
};
export type HostToolSkillTrigger = (typeof HostToolSkillTrigger)[keyof typeof HostToolSkillTrigger];
export declare const LlmModelKind: {
    readonly chat: "chat";
    readonly transformers_embedding: "transformers_embedding";
    readonly api_embedding: "api_embedding";
};
export type LlmModelKind = (typeof LlmModelKind)[keyof typeof LlmModelKind];
export declare const MessageFeedbackRating: {
    readonly up: "up";
    readonly down: "down";
};
export type MessageFeedbackRating = (typeof MessageFeedbackRating)[keyof typeof MessageFeedbackRating];
export declare const PageActionDelivery: {
    readonly inline_stream: "inline_stream";
    readonly sync: "sync";
};
export type PageActionDelivery = (typeof PageActionDelivery)[keyof typeof PageActionDelivery];
export declare const PageActionRunStatus: {
    readonly running: "running";
    readonly awaiting_approval: "awaiting_approval";
    readonly completed: "completed";
    readonly failed: "failed";
    readonly cancelled: "cancelled";
};
export type PageActionRunStatus = (typeof PageActionRunStatus)[keyof typeof PageActionRunStatus];
export declare const ApprovalSource: {
    readonly chat: "chat";
    readonly page_action: "page_action";
    readonly webhook: "webhook";
};
export type ApprovalSource = (typeof ApprovalSource)[keyof typeof ApprovalSource];
export declare const ApprovalStatus: {
    readonly pending: "pending";
    readonly approved: "approved";
    readonly rejected: "rejected";
    readonly expired: "expired";
    readonly cancelled: "cancelled";
};
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];
export declare const WorkflowProfile: {
    readonly chat_skill: "chat_skill";
    readonly page_action: "page_action";
    readonly shared: "shared";
};
export type WorkflowProfile = (typeof WorkflowProfile)[keyof typeof WorkflowProfile];
export declare const WorkflowDeliverable: {
    readonly analysis: "analysis";
    readonly list: "list";
    readonly detail: "detail";
    readonly mutation: "mutation";
    readonly answer: "answer";
};
export type WorkflowDeliverable = (typeof WorkflowDeliverable)[keyof typeof WorkflowDeliverable];
