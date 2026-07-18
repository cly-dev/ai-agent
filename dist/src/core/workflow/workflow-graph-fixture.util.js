"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedFetchSummarizeWorkflowState = exports.mockFetchToolObservation = exports.mockReadDetailTool = exports.fetchSummarizeTaskPlan = exports.fetchSummarizeWorkflowNodes = exports.completedNodeRun = exports.seedWorkflowGraphState = exports.workflowGraphFixtureTaskPlan = exports.workflowGraphFixtureNodes = exports.createMinimalAgentGraphBundle = exports.minimalAgentLangGraphInput = void 0;
const run_metrics_util_1 = require("../agent-engine/engine/run-metrics.util");
const workflow_run_util_1 = require("./workflow-run.util");
function minimalAgentLangGraphInput(overrides = {}) {
    return Object.assign({ runId: 42, sessionId: 'session-test', turnId: 7, userId: 1, appClientId: 10, agentId: 20, latestUserMessage: '请说明页面内容', promptMessages: [{ role: 'user', content: '请说明页面内容' }], tools: [], langChainTools: { tools: [], byName: new Map() }, allowedToolIds: [], maxSteps: 12, enableToolCall: true, messageTokenBudget: 16000, runMetrics: (0, run_metrics_util_1.createRunMetricsAccumulator)(), toolProfilesByName: {}, toolBuildCtx: {}, runGeneration: 1, pageContext: { page: 'home' } }, overrides);
}
exports.minimalAgentLangGraphInput = minimalAgentLangGraphInput;
function createMinimalAgentGraphBundle(inputOverrides = {}) {
    const input = minimalAgentLangGraphInput(inputOverrides);
    const logger = {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
    };
    const runHelpers = {
        updateRun: jest.fn().mockResolvedValue(undefined),
        normalizeJsonLike: (value) => {
            if (value == null) {
                return undefined;
            }
            if (typeof value === 'object' && !Array.isArray(value)) {
                return value;
            }
            return String(value);
        },
        graphFinalOutputFromArtifact: () => '',
        resolveAssistantOutputFromArtifact: () => ({
            serialized: '',
            stepPlain: '',
        }),
        publishMutationGateBlockedDraft: jest.fn(),
        loadScopedHostTools: jest.fn().mockResolvedValue({
            scopedHostTools: [],
            scopedHostLangChainTools: [],
        }),
        sanitizeFinalOutput: (value) => value,
        tryParseJsonObject: () => null,
        resolveFallbackReply: () => null,
        buildTurnRespondState: (state, steps, request) => (Object.assign(Object.assign({}, state), { steps, pendingRespond: {
                mode: 'turn',
                request: request,
            } })),
        isIntentMatched: () => true,
    };
    const ctx = {
        input,
        requestedSkillCtx: null,
        getSessionGoa: () => null,
        setSessionGoa: () => undefined,
        promptScope: { appClientId: input.appClientId, agentId: input.agentId },
    };
    return {
        deps: {
            prisma: {},
            llmService: {},
            promptRegistry: {},
            toolEngine: {},
            sse: { emitThink: jest.fn() },
            sessionRunCoordinator: {
                throwIfAborted: jest.fn(),
            },
            runSseGateway: {},
            assistantArtifact: {
                peek: jest.fn().mockReturnValue(null),
                peekSerialized: jest.fn().mockReturnValue(''),
                peekBlocks: jest.fn().mockReturnValue([]),
                peekTurnId: jest.fn().mockReturnValue(input.turnId),
            },
            goaService: {},
            resumeGate: {},
            categoryIntentRecall: {},
            pendingWriteConfirmationStore: {
                set: jest.fn().mockResolvedValue(undefined),
            },
            sessionScope: {},
            skillService: {},
            requestedSkillRun: {},
            hostToolService: {},
            runScopeCache: {},
            approvalTriggerPermission: {
                evaluateForNodes: () => ({ allowed: true, skipped: false }),
            },
            logger: logger,
        },
        ctx,
        runHelpers: runHelpers,
        skillFrame: {},
        hostToolHandle: {},
        decision: {},
        summarize: {},
    };
}
exports.createMinimalAgentGraphBundle = createMinimalAgentGraphBundle;
exports.workflowGraphFixtureNodes = [
    {
        id: 'read__fetch',
        action: 'fetch_data',
        name: 'Fetch',
        objective: 'Fetch detail',
        input: { toolIds: [1] },
    },
    {
        id: 'speak__speak',
        action: 'summarize',
        name: 'Answer',
        objective: 'Explain page',
        input: { mode: 'final' },
    },
];
function workflowGraphFixtureTaskPlan() {
    return {
        source: 'template',
        originalUserRequest: '请说明页面内容',
        goal: '请说明页面内容',
        deliverable: 'answer',
        constraints: [],
        steps: [
            {
                id: 'read__fetch',
                phase: 'gather',
                kind: 'tool',
                objective: 'Fetch detail',
            },
            {
                id: 'speak__speak',
                phase: 'answer',
                kind: 'summarize',
                objective: 'Explain page',
            },
        ],
        pendingStepIds: ['read__fetch', 'speak__speak'],
        completedStepIds: [],
        taskPhase: 'gather',
        currentObjective: 'Fetch detail',
        currentStepId: 'read__fetch',
        frames: [],
        activeFrameIndex: 0,
    };
}
exports.workflowGraphFixtureTaskPlan = workflowGraphFixtureTaskPlan;
function seedWorkflowGraphState(input) {
    var _a, _b, _c;
    const nodes = (_a = input === null || input === void 0 ? void 0 : input.nodes) !== null && _a !== void 0 ? _a : exports.workflowGraphFixtureNodes;
    const workflowRun = (0, workflow_run_util_1.initWorkflowRun)({
        workflowId: 1,
        version: 1,
        nodes,
        compiledFrom: 'workflow_db',
    });
    return {
        iteration: 0,
        steps: [],
        toolObservations: [],
        pendingToolCalls: [],
        pendingRespond: null,
        intentKind: 'task',
        finalOutput: '',
        status: 'running',
        finished: false,
        scopedTools: [],
        scopedLangChainTools: [],
        scopedAllowedToolIds: [],
        hasExpandedOnce: false,
        skillApplied: false,
        activeSkillId: null,
        activeSkillPrompt: null,
        activeSkillName: null,
        activeSkillDescription: null,
        activeSkillConfig: null,
        activeSkillRiskLevel: null,
        taskPlan: (_b = input === null || input === void 0 ? void 0 : input.taskPlan) !== null && _b !== void 0 ? _b : workflowGraphFixtureTaskPlan(),
        lastToolRoundMeta: null,
        pagedListHttpUsed: 0,
        preloadedToolObservations: [],
        pageContext: (_c = input === null || input === void 0 ? void 0 : input.pageContext) !== null && _c !== void 0 ? _c : { page: 'home' },
        scopedHostTools: [],
        scopedHostLangChainTools: [],
        turnExecutionContract: null,
        workflowRun,
        workflowNodeDefs: nodes,
        workflowNodeOutputs: {},
        workflowAwaitingReact: false,
    };
}
exports.seedWorkflowGraphState = seedWorkflowGraphState;
function completedNodeRun(workflowRun, nodeId) {
    return Object.assign(Object.assign({}, workflowRun), { nodes: workflowRun.nodes.map((row) => row.nodeId === nodeId
            ? Object.assign(Object.assign({}, row), { status: 'succeeded' }) : row) });
}
exports.completedNodeRun = completedNodeRun;
exports.fetchSummarizeWorkflowNodes = [
    {
        id: 'fetch',
        action: 'fetch_data',
        name: 'Fetch',
        objective: 'Fetch entity detail',
        input: { toolId: 1 },
    },
    {
        id: 'answer',
        action: 'summarize',
        name: 'Answer',
        objective: 'Summarize result',
        input: { mode: 'final' },
    },
];
function fetchSummarizeTaskPlan() {
    return {
        source: 'workflow',
        originalUserRequest: '查询详情',
        goal: '查询详情',
        deliverable: 'answer',
        constraints: [],
        steps: [
            {
                id: 'fetch',
                phase: 'gather',
                kind: 'tool',
                objective: 'Fetch entity detail',
                toolRole: 'read-detail',
                stopWhen: 'always',
            },
            {
                id: 'answer',
                phase: 'answer',
                kind: 'summarize',
                objective: 'Summarize result',
            },
        ],
        pendingStepIds: ['fetch', 'answer'],
        completedStepIds: [],
        taskPhase: 'gather',
        currentObjective: 'Fetch entity detail',
        currentStepId: 'fetch',
        frames: [],
        activeFrameIndex: 0,
    };
}
exports.fetchSummarizeTaskPlan = fetchSummarizeTaskPlan;
function mockReadDetailTool() {
    return {
        id: 1,
        name: 'get_entity_detail',
        description: 'Get entity detail',
        method: 'Get',
        path: '/entity',
        timeout: 30000,
        integration: {
            id: 1,
            name: 'test',
            baseUrl: 'https://api.test',
        },
        toolCategoryId: 1,
        riskLevel: 'L1',
        responseProfile: { decisionRole: 'read-detail' },
        agentMetadata: {},
        inputSchema: { type: 'object', properties: {} },
    };
}
exports.mockReadDetailTool = mockReadDetailTool;
function mockFetchToolObservation() {
    return {
        name: 'get_entity_detail',
        output: {
            data: { id: '43689', title: 'Campaign A' },
        },
    };
}
exports.mockFetchToolObservation = mockFetchToolObservation;
function seedFetchSummarizeWorkflowState() {
    const nodes = exports.fetchSummarizeWorkflowNodes;
    const taskPlan = fetchSummarizeTaskPlan();
    const scopedTool = mockReadDetailTool();
    const workflowRun = (0, workflow_run_util_1.initWorkflowRun)({
        workflowId: 2,
        version: 1,
        nodes,
        compiledFrom: 'workflow_db',
    });
    return Object.assign(Object.assign({}, seedWorkflowGraphState({ nodes, taskPlan })), { workflowRun, workflowNodeDefs: nodes, scopedTools: [scopedTool], scopedLangChainTools: [], scopedAllowedToolIds: [scopedTool.id], toolObservations: [mockFetchToolObservation()], turnExecutionContract: {
            taskKind: 'orchestrated_read',
            routeMeta: {
                method: 'llm',
                reason: 'test',
                suggestedSkillId: null,
                pageContextApplies: false,
                pageContextTaskKind: 'none',
                llmPageContextTaskKind: 'none',
                readDeliverable: 'analysis',
            },
            skillChannelAnchored: false,
            terminalRespond: null,
            plan: {
                enabled: true,
                scopedToolsSource: 'intent',
                skillSelect: 'llm',
                explicitSkillId: null,
                pageHostSkillId: null,
                allowHostToolSteps: false,
                allowHostToolAutoDispatch: false,
                allowHostToolLlmDispatch: false,
                allowSessionResume: true,
                abandonActiveTaskOnFreshPlan: true,
                pageContextUsage: { applies: false },
                pageContextPlan: 'none',
            },
            skillAlignment: { status: 'none' },
        } });
}
exports.seedFetchSummarizeWorkflowState = seedFetchSummarizeWorkflowState;
//# sourceMappingURL=workflow-graph-fixture.util.js.map