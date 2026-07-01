import type { AgentGraphNodeBundle } from '../agent-engine/engine/main/agent-graph/types/graph.types';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import type {
  AgentEngineTool,
  AgentGraphState,
  AgentLangGraphRunInput,
  ToolObservation,
} from '../agent-engine/engine/main/types/agent-engine.types';
import { createRunMetricsAccumulator } from '../agent-engine/engine/run-metrics.util';
import { initWorkflowRun } from './workflow-run.util';
import type { WorkflowNodeDef, WorkflowRunState } from './workflow.types';

export function minimalAgentLangGraphInput(
  overrides: Partial<AgentLangGraphRunInput> = {},
): AgentLangGraphRunInput {
  return {
    runId: 42,
    sessionId: 'session-test',
    turnId: 7,
    userId: 1,
    appClientId: 10,
    agentId: 20,
    latestUserMessage: '请说明页面内容',
    promptMessages: [{ role: 'user', content: '请说明页面内容' }],
    tools: [],
    langChainTools: { tools: [], byName: new Map() },
    allowedToolIds: [],
    maxSteps: 12,
    enableToolCall: true,
    messageTokenBudget: 16_000,
    runMetrics: createRunMetricsAccumulator(),
    toolProfilesByName: {},
    toolBuildCtx: {} as AgentLangGraphRunInput['toolBuildCtx'],
    runGeneration: 1,
    pageContext: { page: 'home' },
    ...overrides,
  };
}

export function createMinimalAgentGraphBundle(
  inputOverrides: Partial<AgentLangGraphRunInput> = {},
): AgentGraphNodeBundle {
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
    normalizeJsonLike: (value: unknown) => {
      if (value == null) {
        return undefined;
      }
      if (typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
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
    sanitizeFinalOutput: (value: string) => value,
    tryParseJsonObject: () => null,
    resolveFallbackReply: () => null,
    buildTurnRespondState: (
      state: AgentGraphState,
      steps: AgentGraphState['steps'],
      request: { kind: string; userMessage: string },
    ) => ({
      ...state,
      steps,
      pendingRespond: {
        mode: 'turn' as const,
        request: request as never,
      },
    }),
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
      prisma: {} as AgentGraphNodeBundle['deps']['prisma'],
      llmService: {} as AgentGraphNodeBundle['deps']['llmService'],
      promptRegistry: {} as AgentGraphNodeBundle['deps']['promptRegistry'],
      toolEngine: {} as AgentGraphNodeBundle['deps']['toolEngine'],
      sse: { emitThink: jest.fn() } as unknown as AgentGraphNodeBundle['deps']['sse'],
      sessionRunCoordinator: {
        throwIfAborted: jest.fn(),
      } as unknown as AgentGraphNodeBundle['deps']['sessionRunCoordinator'],
      runSseGateway: {} as AgentGraphNodeBundle['deps']['runSseGateway'],
      assistantArtifact: {
        peek: jest.fn().mockReturnValue(null),
        peekSerialized: jest.fn().mockReturnValue(''),
        peekBlocks: jest.fn().mockReturnValue([]),
        peekTurnId: jest.fn().mockReturnValue(input.turnId),
      } as unknown as AgentGraphNodeBundle['deps']['assistantArtifact'],
      goaService: {} as AgentGraphNodeBundle['deps']['goaService'],
      resumeGate: {} as AgentGraphNodeBundle['deps']['resumeGate'],
      categoryIntentRecall: {} as AgentGraphNodeBundle['deps']['categoryIntentRecall'],
      pendingWriteConfirmationStore: {
        set: jest.fn().mockResolvedValue(undefined),
      } as unknown as AgentGraphNodeBundle['deps']['pendingWriteConfirmationStore'],
      sessionScope: {} as AgentGraphNodeBundle['deps']['sessionScope'],
      skillService: {} as AgentGraphNodeBundle['deps']['skillService'],
      requestedSkillRun: {} as AgentGraphNodeBundle['deps']['requestedSkillRun'],
      hostToolService: {} as AgentGraphNodeBundle['deps']['hostToolService'],
      runScopeCache: {} as AgentGraphNodeBundle['deps']['runScopeCache'],
      approvalGate: {} as AgentGraphNodeBundle['deps']['approvalGate'],
      approvalRequests: {} as AgentGraphNodeBundle['deps']['approvalRequests'],
      approvalTriggerPermission: {
        evaluateForNodes: () => ({ allowed: true, skipped: false }),
      } as unknown as AgentGraphNodeBundle['deps']['approvalTriggerPermission'],
      logger: logger as unknown as AgentGraphNodeBundle['deps']['logger'],
    },
    ctx,
    runHelpers: runHelpers as unknown as AgentGraphNodeBundle['runHelpers'],
    skillFrame: {} as AgentGraphNodeBundle['skillFrame'],
    hostToolHandle: {} as AgentGraphNodeBundle['hostToolHandle'],
    decision: {} as AgentGraphNodeBundle['decision'],
    summarize: {} as AgentGraphNodeBundle['summarize'],
  };
}

export const workflowGraphFixtureNodes: WorkflowNodeDef[] = [
  {
    id: 'load',
    action: 'load_page_context',
    name: 'Load',
    objective: 'Load page',
    input: {},
  },
  {
    id: 'answer',
    action: 'summarize',
    name: 'Answer',
    objective: 'Explain page',
    input: { mode: 'final' },
  },
];

export function workflowGraphFixtureTaskPlan(): TaskPlanSnapshot {
  return {
    source: 'template',
    originalUserRequest: '请说明页面内容',
    goal: '请说明页面内容',
    deliverable: 'answer',
    constraints: [],
    steps: [
      {
        id: 'load',
        phase: 'gather',
        kind: 'tool',
        objective: 'Load page',
      },
      {
        id: 'answer',
        phase: 'answer',
        kind: 'summarize',
        objective: 'Explain page',
      },
    ],
    pendingStepIds: ['load', 'answer'],
    completedStepIds: [],
    taskPhase: 'gather',
    currentObjective: 'Load page',
    currentStepId: 'load',
    frames: [],
    activeFrameIndex: 0,
  };
}

export function seedWorkflowGraphState(input?: {
  nodes?: WorkflowNodeDef[];
  taskPlan?: TaskPlanSnapshot;
  pageContext?: AgentGraphState['pageContext'];
}): AgentGraphState {
  const nodes = input?.nodes ?? workflowGraphFixtureNodes;
  const workflowRun = initWorkflowRun({
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
    taskPlan: input?.taskPlan ?? workflowGraphFixtureTaskPlan(),
    lastToolRoundMeta: null,
    pagedListHttpUsed: 0,
    preloadedToolObservations: [],
    pageContext: input?.pageContext ?? { page: 'home' },
    scopedHostTools: [],
    scopedHostLangChainTools: [],
    turnRoutingDecision: null,
    turnExecutionContract: null,
    workflowRun,
    workflowNodeDefs: nodes,
    workflowNodeOutputs: {},
    workflowAwaitingReact: false,
  } as AgentGraphState;
}

export function completedNodeRun(
  workflowRun: WorkflowRunState,
  nodeId: string,
): WorkflowRunState {
  return {
    ...workflowRun,
    nodes: workflowRun.nodes.map((row) =>
      row.nodeId === nodeId
        ? { ...row, status: 'succeeded' as const }
        : row,
    ),
  };
}

export const fetchSummarizeWorkflowNodes: WorkflowNodeDef[] = [
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

export function fetchSummarizeTaskPlan(): TaskPlanSnapshot {
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

export function mockReadDetailTool(): AgentEngineTool {
  return {
    id: 1,
    name: 'get_entity_detail',
    description: 'Get entity detail',
    method: 'Get',
    path: '/entity',
    timeout: 30_000,
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
  } as AgentEngineTool;
}

export function mockFetchToolObservation(): ToolObservation {
  return {
    name: 'get_entity_detail',
    output: {
      data: { id: '43689', title: 'Campaign A' },
    },
  };
}

export function seedFetchSummarizeWorkflowState(): AgentGraphState {
  const nodes = fetchSummarizeWorkflowNodes;
  const taskPlan = fetchSummarizeTaskPlan();
  const scopedTool = mockReadDetailTool();
  const workflowRun = initWorkflowRun({
    workflowId: 2,
    version: 1,
    nodes,
    compiledFrom: 'workflow_db',
  });
  return {
    ...seedWorkflowGraphState({ nodes, taskPlan }),
    workflowRun,
    workflowNodeDefs: nodes,
    scopedTools: [scopedTool],
    scopedLangChainTools: [],
    scopedAllowedToolIds: [scopedTool.id],
    toolObservations: [mockFetchToolObservation()],
    turnExecutionContract: {
      routing: { route: 'orchestrated_task', reason: 'test' },
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
    },
  } as AgentGraphState;
}
