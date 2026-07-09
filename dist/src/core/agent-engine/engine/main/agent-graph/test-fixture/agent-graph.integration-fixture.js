"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUMMARIZE_REPLY = exports.createMinimalAgentGraphBundle = exports.createIntegrationTestBundle = exports.buildWorkflowGraphRunInput = exports.buildWorkflowResumeGraphInitialState = exports.buildFetchReactGraphRunInput = exports.buildFetchReactGraphInitialState = exports.createMockAgentGraphDeps = exports.createMockLlmServiceForReact = void 0;
const runtime_1 = require("../runtime");
const summarize_1 = require("../summarize");
const workflow_graph_fixture_util_1 = require("../../../../../workflow/workflow-graph-fixture.util");
Object.defineProperty(exports, "createMinimalAgentGraphBundle", { enumerable: true, get: function () { return workflow_graph_fixture_util_1.createMinimalAgentGraphBundle; } });
const workflow_plan_sync_util_1 = require("../../../../../workflow/workflow-plan-sync.util");
const SUMMARIZE_REPLY = '页面已说明';
exports.SUMMARIZE_REPLY = SUMMARIZE_REPLY;
function createMockLlmServiceForReact() {
    return {
        fitMessagesToBudget: jest.fn().mockImplementation(async (input) => ({
            messages: input.messages,
            trimmed: false,
        })),
        createLangChainChatModelForMessages: jest.fn().mockResolvedValue({
            model: {
                invoke: jest.fn().mockResolvedValue({
                    content: '继续',
                    tool_calls: [],
                    response_metadata: { model_name: 'test-model' },
                }),
            },
            messages: [],
        }),
    };
}
exports.createMockLlmServiceForReact = createMockLlmServiceForReact;
function createMockAgentGraphDeps(overrides = {}) {
    const logger = {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
    };
    const summarizeBlocks = [
        { type: 'text', text: SUMMARIZE_REPLY, format: 'markdown' },
    ];
    const sse = {
        emitThink: jest.fn(),
        publishAssistantBlocks: jest.fn().mockReturnValue(summarizeBlocks),
        summarizeMessageBlocks: jest.fn().mockResolvedValue({
            blocks: summarizeBlocks,
            rawOutput: SUMMARIZE_REPLY,
        }),
        commitAssistantArtifact: jest.fn().mockReturnValue(summarizeBlocks),
    };
    const assistantArtifact = {
        peek: jest.fn().mockReturnValue(null),
        peekSerialized: jest.fn().mockReturnValue(SUMMARIZE_REPLY),
        peekBlocks: jest.fn().mockReturnValue(summarizeBlocks),
        peekTurnId: jest.fn().mockReturnValue(7),
        formatOutput: (_sessionId, _runId, fallback) => ({
            serialized: fallback || SUMMARIZE_REPLY,
            stepPlain: fallback || SUMMARIZE_REPLY,
        }),
        commit: jest.fn().mockReturnValue({ blocks: summarizeBlocks }),
        rephase: jest.fn(),
    };
    return Object.assign({ prisma: {
            agentRun: {
                update: jest.fn().mockResolvedValue({}),
            },
        }, llmService: createMockLlmServiceForReact(), promptRegistry: {
            render: jest.fn().mockResolvedValue('mock summarize system prompt'),
        }, toolEngine: {
            buildLangChainTools: jest.fn().mockReturnValue({ tools: [], byName: new Map() }),
        }, sse: sse, sessionRunCoordinator: {
            throwIfAborted: jest.fn(),
        }, runSseGateway: {}, assistantArtifact: assistantArtifact, goaService: {
            ensurePayload: jest.fn().mockResolvedValue(null),
            buildPriorToolObservationsForGraph: jest.fn().mockReturnValue([]),
        }, resumeGate: {}, categoryIntentRecall: {}, pendingWriteConfirmationStore: {
            set: jest.fn().mockResolvedValue(undefined),
        }, sessionScope: {}, skillService: {
            resolveSkillsForOuterPlan: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue(null),
            bindSkillToScopedTools: jest.fn((_skill, tools) => ({
                scopedTools: tools,
                scopedAllowedToolIds: tools.map((tool) => tool.id),
                scopedToolBundle: { tools: [], byName: new Map() },
            })),
        }, requestedSkillRun: {
            loadRunContext: jest.fn().mockResolvedValue(null),
        }, hostToolService: {
            resolveLlmHostToolsForDecision: jest.fn().mockResolvedValue([]),
        }, runScopeCache: {
            getHostToolsForRun: jest.fn().mockReturnValue(null),
            setHostToolsForRun: jest.fn(),
        }, approvalTriggerPermission: {
            evaluateForNodes: jest.fn().mockReturnValue({ allowed: true, skipped: false }),
        }, logger: logger }, overrides);
}
exports.createMockAgentGraphDeps = createMockAgentGraphDeps;
function buildFetchReactGraphInitialState() {
    const seeded = (0, workflow_graph_fixture_util_1.seedFetchSummarizeWorkflowState)();
    const workflowRun = (0, workflow_plan_sync_util_1.ensureWorkflowNodeStarted)(seeded.workflowRun, 'fetch');
    return Object.assign(Object.assign({}, seeded), { workflowRun, workflowNodeDefs: workflow_graph_fixture_util_1.fetchSummarizeWorkflowNodes, workflowAwaitingReact: false, finished: false, steps: [], pendingToolCalls: [], pendingRespond: null, lastToolRoundMeta: null, skillApplied: true, activeSkillId: 1 });
}
exports.buildFetchReactGraphInitialState = buildFetchReactGraphInitialState;
function buildFetchReactGraphRunInput(graphInitialState) {
    const tool = (0, workflow_graph_fixture_util_1.mockReadDetailTool)();
    return Object.assign(Object.assign({}, (0, workflow_graph_fixture_util_1.minimalAgentLangGraphInput)({
        runGeneration: 1,
        latestUserMessage: '查询详情',
        tools: [tool],
        allowedToolIds: [tool.id],
    })), { resumeFromWriteConfirm: true, graphInitialState });
}
exports.buildFetchReactGraphRunInput = buildFetchReactGraphRunInput;
function buildWorkflowResumeGraphInitialState() {
    const seeded = (0, workflow_graph_fixture_util_1.seedWorkflowGraphState)();
    const workflowRun = (0, workflow_plan_sync_util_1.ensureWorkflowNodeStarted)(seeded.workflowRun, 'load');
    return Object.assign(Object.assign({}, seeded), { workflowRun, workflowNodeDefs: workflow_graph_fixture_util_1.workflowGraphFixtureNodes, workflowNodeOutputs: {}, workflowAwaitingReact: false, finished: false, steps: [], toolObservations: [], pendingToolCalls: [], pendingRespond: null });
}
exports.buildWorkflowResumeGraphInitialState = buildWorkflowResumeGraphInitialState;
function buildWorkflowGraphRunInput(graphInitialState, options = {}) {
    var _a;
    return Object.assign(Object.assign({}, (0, workflow_graph_fixture_util_1.minimalAgentLangGraphInput)({ runGeneration: 1 })), { resumeFromWriteConfirm: (_a = options.resumeFromWriteConfirm) !== null && _a !== void 0 ? _a : true, graphInitialState });
}
exports.buildWorkflowGraphRunInput = buildWorkflowGraphRunInput;
function createIntegrationTestBundle(deps = createMockAgentGraphDeps()) {
    const input = (0, workflow_graph_fixture_util_1.minimalAgentLangGraphInput)({
        runGeneration: 1,
        resumeFromWriteConfirm: true,
        tools: [(0, workflow_graph_fixture_util_1.mockReadDetailTool)()],
        allowedToolIds: [1],
    });
    const ctx = {
        input,
        requestedSkillCtx: null,
        getSessionGoa: () => null,
        setSessionGoa: () => undefined,
        promptScope: { appClientId: input.appClientId, agentId: input.agentId },
    };
    const runHelpers = (0, runtime_1.bindRunContextHelpers)((0, runtime_1.createAgentGraphRunHelpers)(deps), ctx);
    return {
        deps,
        ctx,
        runHelpers,
        skillFrame: (0, runtime_1.createAgentGraphSkillFrameHelpers)(deps, ctx, runHelpers),
        hostToolHandle: (0, runtime_1.createAgentGraphHostToolHandleHelpers)(deps, runHelpers, (0, runtime_1.createAgentGraphSkillFrameHelpers)(deps, ctx, runHelpers), (0, runtime_1.createAgentGraphDecisionHelpers)(deps), ctx),
        decision: (0, runtime_1.createAgentGraphDecisionHelpers)(deps),
        summarize: (0, summarize_1.createAgentGraphSummarizeHelpers)(deps),
    };
}
exports.createIntegrationTestBundle = createIntegrationTestBundle;
//# sourceMappingURL=agent-graph.integration-fixture.js.map