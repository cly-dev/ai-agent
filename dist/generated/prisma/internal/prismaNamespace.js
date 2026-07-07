"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillHostToolScalarFieldEnum = exports.AgentHostToolScalarFieldEnum = exports.HostToolScalarFieldEnum = exports.HostPageScalarFieldEnum = exports.AgentToolScalarFieldEnum = exports.AgentRunScalarFieldEnum = exports.MessageTurnScalarFieldEnum = exports.PromptTemplateScalarFieldEnum = exports.AgentScalarFieldEnum = exports.RoleToolScalarFieldEnum = exports.UserAppScalarFieldEnum = exports.SkillToolScalarFieldEnum = exports.RoleSkillScalarFieldEnum = exports.AgentSkillScalarFieldEnum = exports.SkillScalarFieldEnum = exports.UserIntegrationScalarFieldEnum = exports.IntegrationScalarFieldEnum = exports.ToolScalarFieldEnum = exports.ToolCategoryScalarFieldEnum = exports.MessageFeedbackScalarFieldEnum = exports.MessageScalarFieldEnum = exports.SessionGoaMemoryScalarFieldEnum = exports.SessionScalarFieldEnum = exports.UserLlmModelConfigScalarFieldEnum = exports.IntentRecallConfigScalarFieldEnum = exports.PageAgentLlmProxyAuditScalarFieldEnum = exports.LlmModelConfigScalarFieldEnum = exports.AppClientScalarFieldEnum = exports.AdminUserScalarFieldEnum = exports.RoleScalarFieldEnum = exports.UserScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.prismaVersion = exports.getExtensionContext = exports.Decimal = exports.Sql = exports.raw = exports.join = exports.empty = exports.sql = exports.PrismaClientValidationError = exports.PrismaClientInitializationError = exports.PrismaClientRustPanicError = exports.PrismaClientUnknownRequestError = exports.PrismaClientKnownRequestError = void 0;
exports.defineExtension = exports.JsonNullValueFilter = exports.NullsOrder = exports.QueryMode = exports.JsonNullValueInput = exports.NullableJsonNullValueInput = exports.SortOrder = exports.WorkflowHostToolScalarFieldEnum = exports.WorkflowToolScalarFieldEnum = exports.WorkflowRevisionScalarFieldEnum = exports.WorkflowScalarFieldEnum = exports.ApprovalRequestScalarFieldEnum = exports.PageActionRunScalarFieldEnum = exports.PageActionScalarFieldEnum = exports.RoleHostToolScalarFieldEnum = void 0;
const runtime = require("@prisma/client/runtime/client");
exports.PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
exports.PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
exports.PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
exports.PrismaClientInitializationError = runtime.PrismaClientInitializationError;
exports.PrismaClientValidationError = runtime.PrismaClientValidationError;
exports.sql = runtime.sqltag;
exports.empty = runtime.empty;
exports.join = runtime.join;
exports.raw = runtime.raw;
exports.Sql = runtime.Sql;
exports.Decimal = runtime.Decimal;
exports.getExtensionContext = runtime.Extensions.getExtensionContext;
exports.prismaVersion = {
    client: "7.7.0",
    engine: "75cbdc1eb7150937890ad5465d861175c6624711"
};
exports.NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
exports.DbNull = runtime.DbNull;
exports.JsonNull = runtime.JsonNull;
exports.AnyNull = runtime.AnyNull;
exports.ModelName = {
    User: 'User',
    Role: 'Role',
    AdminUser: 'AdminUser',
    AppClient: 'AppClient',
    LlmModelConfig: 'LlmModelConfig',
    PageAgentLlmProxyAudit: 'PageAgentLlmProxyAudit',
    IntentRecallConfig: 'IntentRecallConfig',
    UserLlmModelConfig: 'UserLlmModelConfig',
    Session: 'Session',
    SessionGoaMemory: 'SessionGoaMemory',
    Message: 'Message',
    MessageFeedback: 'MessageFeedback',
    ToolCategory: 'ToolCategory',
    Tool: 'Tool',
    Integration: 'Integration',
    UserIntegration: 'UserIntegration',
    Skill: 'Skill',
    AgentSkill: 'AgentSkill',
    RoleSkill: 'RoleSkill',
    SkillTool: 'SkillTool',
    UserApp: 'UserApp',
    RoleTool: 'RoleTool',
    Agent: 'Agent',
    PromptTemplate: 'PromptTemplate',
    MessageTurn: 'MessageTurn',
    AgentRun: 'AgentRun',
    AgentTool: 'AgentTool',
    HostPage: 'HostPage',
    HostTool: 'HostTool',
    AgentHostTool: 'AgentHostTool',
    SkillHostTool: 'SkillHostTool',
    RoleHostTool: 'RoleHostTool',
    PageAction: 'PageAction',
    PageActionRun: 'PageActionRun',
    ApprovalRequest: 'ApprovalRequest',
    Workflow: 'Workflow',
    WorkflowRevision: 'WorkflowRevision',
    WorkflowTool: 'WorkflowTool',
    WorkflowHostTool: 'WorkflowHostTool'
};
exports.TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
exports.UserScalarFieldEnum = {
    id: 'id',
    employeeId: 'employeeId',
    email: 'email',
    password: 'password',
    username: 'username',
    status: 'status',
    mustChangePassword: 'mustChangePassword',
    createdAt: 'createdAt'
};
exports.RoleScalarFieldEnum = {
    id: 'id',
    name: 'name',
    description: 'description',
    allowToolLevel: 'allowToolLevel',
    createdAt: 'createdAt'
};
exports.AdminUserScalarFieldEnum = {
    id: 'id',
    email: 'email',
    password: 'password',
    username: 'username',
    role: 'role',
    isActive: 'isActive',
    mustChangePassword: 'mustChangePassword',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AppClientScalarFieldEnum = {
    id: 'id',
    name: 'name',
    dsn: 'dsn',
    description: 'description',
    authConfig: 'authConfig',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.LlmModelConfigScalarFieldEnum = {
    id: 'id',
    kind: 'kind',
    singletonKey: 'singletonKey',
    provider: 'provider',
    model: 'model',
    apiKey: 'apiKey',
    baseUrl: 'baseUrl',
    chatPath: 'chatPath',
    parameters: 'parameters',
    stream: 'stream',
    maxTokens: 'maxTokens',
    temperature: 'temperature',
    enabled: 'enabled',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.PageAgentLlmProxyAuditScalarFieldEnum = {
    id: 'id',
    appClientId: 'appClientId',
    userId: 'userId',
    modelConfigId: 'modelConfigId',
    requestedModel: 'requestedModel',
    provider: 'provider',
    providerModel: 'providerModel',
    status: 'status',
    upstreamStatus: 'upstreamStatus',
    durationMs: 'durationMs',
    promptTokens: 'promptTokens',
    completionTokens: 'completionTokens',
    totalTokens: 'totalTokens',
    requestMeta: 'requestMeta',
    errorMessage: 'errorMessage',
    createdAt: 'createdAt',
    finishedAt: 'finishedAt'
};
exports.IntentRecallConfigScalarFieldEnum = {
    id: 'id',
    singletonKey: 'singletonKey',
    recallMode: 'recallMode',
    vectorTopK: 'vectorTopK',
    vectorMinScore: 'vectorMinScore',
    bindToolsMax: 'bindToolsMax',
    fallbackToKeyword: 'fallbackToKeyword',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.UserLlmModelConfigScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    provider: 'provider',
    model: 'model',
    apiKey: 'apiKey',
    baseUrl: 'baseUrl',
    temperature: 'temperature',
    maxTokens: 'maxTokens',
    enabled: 'enabled',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SessionScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    appClientId: 'appClientId',
    agentId: 'agentId',
    title: 'title',
    createdAt: 'createdAt'
};
exports.SessionGoaMemoryScalarFieldEnum = {
    sessionId: 'sessionId',
    payload: 'payload',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MessageScalarFieldEnum = {
    id: 'id',
    sessionId: 'sessionId',
    role: 'role',
    content: 'content',
    toolName: 'toolName',
    toolInput: 'toolInput',
    toolOutput: 'toolOutput',
    pageContextJson: 'pageContextJson',
    createdAt: 'createdAt'
};
exports.MessageFeedbackScalarFieldEnum = {
    id: 'id',
    messageId: 'messageId',
    sessionId: 'sessionId',
    userId: 'userId',
    appClientId: 'appClientId',
    turnId: 'turnId',
    agentId: 'agentId',
    rating: 'rating',
    reasonTags: 'reasonTags',
    comment: 'comment',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.ToolCategoryScalarFieldEnum = {
    id: 'id',
    label: 'label',
    description: 'description',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.ToolScalarFieldEnum = {
    id: 'id',
    appClientId: 'appClientId',
    definitionKey: 'definitionKey',
    name: 'name',
    description: 'description',
    riskLevel: 'riskLevel',
    schema: 'schema',
    inputSchema: 'inputSchema',
    outputSchema: 'outputSchema',
    responseProfile: 'responseProfile',
    agentMetadata: 'agentMetadata',
    method: 'method',
    path: 'path',
    integrationId: 'integrationId',
    toolCategoryId: 'toolCategoryId',
    isActive: 'isActive',
    timeout: 'timeout',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.IntegrationScalarFieldEnum = {
    id: 'id',
    appClientId: 'appClientId',
    name: 'name',
    baseUrl: 'baseUrl',
    apiKey: 'apiKey',
    authMode: 'authMode',
    description: 'description',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.UserIntegrationScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    integrationId: 'integrationId',
    userApiKey: 'userApiKey',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SkillScalarFieldEnum = {
    id: 'id',
    appClientId: 'appClientId',
    name: 'name',
    capabilityKey: 'capabilityKey',
    description: 'description',
    prompt: 'prompt',
    riskLevel: 'riskLevel',
    config: 'config',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    workflowId: 'workflowId',
    workflowVersion: 'workflowVersion',
    workflowOverrides: 'workflowOverrides'
};
exports.AgentSkillScalarFieldEnum = {
    id: 'id',
    agentId: 'agentId',
    skillId: 'skillId'
};
exports.RoleSkillScalarFieldEnum = {
    id: 'id',
    roleId: 'roleId',
    skillId: 'skillId'
};
exports.SkillToolScalarFieldEnum = {
    id: 'id',
    skillId: 'skillId',
    toolId: 'toolId',
    isRequired: 'isRequired'
};
exports.UserAppScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    appId: 'appId',
    roleId: 'roleId',
    createdAt: 'createdAt'
};
exports.RoleToolScalarFieldEnum = {
    id: 'id',
    roleId: 'roleId',
    toolId: 'toolId',
    createdAt: 'createdAt'
};
exports.AgentScalarFieldEnum = {
    id: 'id',
    appClientId: 'appClientId',
    name: 'name',
    description: 'description',
    systemPrompt: 'systemPrompt',
    maxSteps: 'maxSteps',
    enableToolCall: 'enableToolCall',
    restrictTools: 'restrictTools',
    restrictHostTools: 'restrictHostTools',
    restrictSkills: 'restrictSkills',
    config: 'config',
    createdAt: 'createdAt'
};
exports.PromptTemplateScalarFieldEnum = {
    id: 'id',
    key: 'key',
    version: 'version',
    appClientId: 'appClientId',
    agentId: 'agentId',
    locale: 'locale',
    category: 'category',
    title: 'title',
    description: 'description',
    content: 'content',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MessageTurnScalarFieldEnum = {
    id: 'id',
    messageId: 'messageId',
    sessionId: 'sessionId',
    userId: 'userId',
    appClientId: 'appClientId',
    userInput: 'userInput',
    finalOutput: 'finalOutput',
    status: 'status',
    primaryAgentId: 'primaryAgentId',
    agentRunCount: 'agentRunCount',
    durationMs: 'durationMs',
    llmDurationMs: 'llmDurationMs',
    toolDurationMs: 'toolDurationMs',
    model: 'model',
    promptTokens: 'promptTokens',
    completionTokens: 'completionTokens',
    totalTokens: 'totalTokens',
    llmCallCount: 'llmCallCount',
    toolCallCount: 'toolCallCount',
    toolsUsed: 'toolsUsed',
    finishReason: 'finishReason',
    outputMessageId: 'outputMessageId',
    startedAt: 'startedAt',
    finishedAt: 'finishedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AgentRunScalarFieldEnum = {
    id: 'id',
    turnId: 'turnId',
    agentId: 'agentId',
    appClientId: 'appClientId',
    sessionId: 'sessionId',
    userId: 'userId',
    role: 'role',
    sequence: 'sequence',
    parentRunId: 'parentRunId',
    input: 'input',
    output: 'output',
    status: 'status',
    steps: 'steps',
    currentStep: 'currentStep',
    maxSteps: 'maxSteps',
    error: 'error',
    startedAt: 'startedAt',
    finishedAt: 'finishedAt',
    durationMs: 'durationMs',
    llmDurationMs: 'llmDurationMs',
    toolDurationMs: 'toolDurationMs',
    model: 'model',
    promptTokens: 'promptTokens',
    completionTokens: 'completionTokens',
    totalTokens: 'totalTokens',
    llmCallCount: 'llmCallCount',
    toolCallCount: 'toolCallCount',
    toolsUsed: 'toolsUsed',
    finishReason: 'finishReason',
    scopedToolCount: 'scopedToolCount',
    outputMessageId: 'outputMessageId',
    goaSnapshot: 'goaSnapshot',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AgentToolScalarFieldEnum = {
    id: 'id',
    agentId: 'agentId',
    toolId: 'toolId'
};
exports.HostPageScalarFieldEnum = {
    id: 'id',
    appClientId: 'appClientId',
    scope: 'scope',
    label: 'label',
    description: 'description',
    routePattern: 'routePattern',
    sortOrder: 'sortOrder',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.HostToolScalarFieldEnum = {
    id: 'id',
    appClientId: 'appClientId',
    hostPageId: 'hostPageId',
    definitionKey: 'definitionKey',
    name: 'name',
    description: 'description',
    argsSchema: 'argsSchema',
    argsTemplate: 'argsTemplate',
    sortOrder: 'sortOrder',
    isActive: 'isActive',
    config: 'config',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AgentHostToolScalarFieldEnum = {
    id: 'id',
    agentId: 'agentId',
    hostToolId: 'hostToolId',
    createdAt: 'createdAt'
};
exports.SkillHostToolScalarFieldEnum = {
    id: 'id',
    skillId: 'skillId',
    hostToolId: 'hostToolId',
    trigger: 'trigger',
    argsTemplate: 'argsTemplate',
    priority: 'priority',
    isRequired: 'isRequired',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.RoleHostToolScalarFieldEnum = {
    id: 'id',
    roleId: 'roleId',
    hostToolId: 'hostToolId',
    createdAt: 'createdAt'
};
exports.PageActionScalarFieldEnum = {
    id: 'id',
    appClientId: 'appClientId',
    actionKey: 'actionKey',
    name: 'name',
    description: 'description',
    hostToolId: 'hostToolId',
    pageScope: 'pageScope',
    systemPrompt: 'systemPrompt',
    defaultDelivery: 'defaultDelivery',
    allowCustomInstruction: 'allowCustomInstruction',
    isActive: 'isActive',
    sortOrder: 'sortOrder',
    config: 'config',
    sourceSkillId: 'sourceSkillId',
    workflowId: 'workflowId',
    workflowVersion: 'workflowVersion',
    workflowOverrides: 'workflowOverrides',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.PageActionRunScalarFieldEnum = {
    id: 'id',
    pageActionId: 'pageActionId',
    appClientId: 'appClientId',
    userId: 'userId',
    delivery: 'delivery',
    status: 'status',
    instruction: 'instruction',
    context: 'context',
    pageContext: 'pageContext',
    fillText: 'fillText',
    dslOutcome: 'dslOutcome',
    errorCode: 'errorCode',
    errorMessage: 'errorMessage',
    streamId: 'streamId',
    model: 'model',
    promptTokens: 'promptTokens',
    completionTokens: 'completionTokens',
    durationMs: 'durationMs',
    idempotencyKey: 'idempotencyKey',
    pageActionKey: 'pageActionKey',
    clientActionId: 'clientActionId',
    steps: 'steps',
    workflowId: 'workflowId',
    workflowVersion: 'workflowVersion',
    workflowRun: 'workflowRun',
    generation: 'generation',
    createdAt: 'createdAt',
    finishedAt: 'finishedAt'
};
exports.ApprovalRequestScalarFieldEnum = {
    id: 'id',
    appClientId: 'appClientId',
    source: 'source',
    status: 'status',
    initiatorUserId: 'initiatorUserId',
    approverUserId: 'approverUserId',
    workflowId: 'workflowId',
    workflowVersion: 'workflowVersion',
    nodeId: 'nodeId',
    title: 'title',
    summary: 'summary',
    previewBlocks: 'previewBlocks',
    resumeSnapshot: 'resumeSnapshot',
    pageActionRunId: 'pageActionRunId',
    sessionId: 'sessionId',
    idempotencyKey: 'idempotencyKey',
    decidedByUserId: 'decidedByUserId',
    decidedAt: 'decidedAt',
    decisionNote: 'decisionNote',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.WorkflowScalarFieldEnum = {
    id: 'id',
    appClientId: 'appClientId',
    workflowKey: 'workflowKey',
    name: 'name',
    description: 'description',
    goal: 'goal',
    profile: 'profile',
    deliverable: 'deliverable',
    nodes: 'nodes',
    version: 'version',
    constraints: 'constraints',
    isActive: 'isActive',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.WorkflowRevisionScalarFieldEnum = {
    id: 'id',
    workflowId: 'workflowId',
    version: 'version',
    nodes: 'nodes',
    deliverable: 'deliverable',
    constraints: 'constraints',
    changeNote: 'changeNote',
    createdAt: 'createdAt'
};
exports.WorkflowToolScalarFieldEnum = {
    id: 'id',
    workflowId: 'workflowId',
    toolId: 'toolId',
    isRequired: 'isRequired'
};
exports.WorkflowHostToolScalarFieldEnum = {
    id: 'id',
    workflowId: 'workflowId',
    hostToolId: 'hostToolId',
    isRequired: 'isRequired'
};
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.NullableJsonNullValueInput = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull
};
exports.JsonNullValueInput = {
    JsonNull: exports.JsonNull
};
exports.QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
exports.NullsOrder = {
    first: 'first',
    last: 'last'
};
exports.JsonNullValueFilter = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull,
    AnyNull: exports.AnyNull
};
exports.defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map