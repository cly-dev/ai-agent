import type { AgentGraphDeps } from '../types/graph.types';
import type { AgentGraphNodeBundle } from '../types/graph.types';
import {
  bindRunContextHelpers,
  createAgentGraphRunHelpers,
  createAgentGraphSkillFrameHelpers,
  createAgentGraphDecisionHelpers,
  createAgentGraphHostToolHandleHelpers,
} from '../runtime';
import { createAgentGraphSummarizeHelpers } from '../summarize';
import {
  createMinimalAgentGraphBundle,
  fetchSummarizeWorkflowNodes,
  minimalAgentLangGraphInput,
  mockReadDetailTool,
  seedFetchSummarizeWorkflowState,
  seedWorkflowGraphState,
  workflowGraphFixtureNodes,
} from '../../../../../workflow/workflow-graph-fixture.util';
import { ensureWorkflowNodeStarted } from '../../../../../workflow/workflow-plan-sync.util';
import type { AgentGraphState } from '../../types/agent-engine.types';

const SUMMARIZE_REPLY = '页面已说明';

export function createMockLlmServiceForReact() {
  return {
    fitMessagesToBudget: jest.fn().mockImplementation(async (input: { messages: unknown[] }) => ({
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

export function createMockAgentGraphDeps(
  overrides: Partial<AgentGraphDeps> = {},
): AgentGraphDeps {
  const logger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
  const summarizeBlocks = [
    { type: 'text' as const, text: SUMMARIZE_REPLY, format: 'markdown' as const },
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
    formatOutput: (_sessionId: string, _runId: number, fallback: string) => ({
      serialized: fallback || SUMMARIZE_REPLY,
      stepPlain: fallback || SUMMARIZE_REPLY,
    }),
    commit: jest.fn().mockReturnValue({ blocks: summarizeBlocks }),
    rephase: jest.fn(),
  };
  return {
    prisma: {
      agentRun: {
        update: jest.fn().mockResolvedValue({}),
      },
    } as unknown as AgentGraphDeps['prisma'],
    llmService: createMockLlmServiceForReact() as unknown as AgentGraphDeps['llmService'],
    promptRegistry: {
      render: jest.fn().mockResolvedValue('mock summarize system prompt'),
    } as unknown as AgentGraphDeps['promptRegistry'],
    toolEngine: {
      buildLangChainTools: jest.fn().mockReturnValue({ tools: [], byName: new Map() }),
    } as unknown as AgentGraphDeps['toolEngine'],
    sse: sse as unknown as AgentGraphDeps['sse'],
    sessionRunCoordinator: {
      throwIfAborted: jest.fn(),
    } as unknown as AgentGraphDeps['sessionRunCoordinator'],
    runSseGateway: {} as AgentGraphDeps['runSseGateway'],
    assistantArtifact:
      assistantArtifact as unknown as AgentGraphDeps['assistantArtifact'],
    goaService: {
      ensurePayload: jest.fn().mockResolvedValue(null),
      buildPriorToolObservationsForGraph: jest.fn().mockReturnValue([]),
    } as unknown as AgentGraphDeps['goaService'],
    resumeGate: {} as AgentGraphDeps['resumeGate'],
    categoryIntentRecall: {} as AgentGraphDeps['categoryIntentRecall'],
    pendingWriteConfirmationStore: {
      set: jest.fn().mockResolvedValue(undefined),
    } as unknown as AgentGraphDeps['pendingWriteConfirmationStore'],
    sessionScope: {} as AgentGraphDeps['sessionScope'],
    skillService: {
      resolveSkillsForOuterPlan: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      bindSkillToScopedTools: jest.fn((_skill, tools: { id: number }[]) => ({
        scopedTools: tools,
        scopedAllowedToolIds: tools.map((tool) => tool.id),
        scopedToolBundle: { tools: [], byName: new Map() },
      })),
    } as unknown as AgentGraphDeps['skillService'],
    requestedSkillRun: {
      loadRunContext: jest.fn().mockResolvedValue(null),
    } as unknown as AgentGraphDeps['requestedSkillRun'],
    hostToolService: {
      resolveLlmHostToolsForDecision: jest.fn().mockResolvedValue([]),
    } as unknown as AgentGraphDeps['hostToolService'],
    runScopeCache: {
      getHostToolsForRun: jest.fn().mockReturnValue(null),
      setHostToolsForRun: jest.fn(),
    } as unknown as AgentGraphDeps['runScopeCache'],
    approvalTriggerPermission: {
      evaluateForNodes: jest.fn().mockReturnValue({ allowed: true, skipped: false }),
    } as unknown as AgentGraphDeps['approvalTriggerPermission'],
    logger: logger as unknown as AgentGraphDeps['logger'],
    ...overrides,
  };
}

export function buildFetchReactGraphInitialState(): AgentGraphState {
  const seeded = seedFetchSummarizeWorkflowState();
  const workflowRun = ensureWorkflowNodeStarted(seeded.workflowRun!, 'fetch');
  return {
    ...seeded,
    workflowRun,
    workflowNodeDefs: fetchSummarizeWorkflowNodes,
    workflowAwaitingReact: false,
    finished: false,
    steps: [],
    pendingToolCalls: [],
    pendingRespond: null,
    lastToolRoundMeta: null,
    skillApplied: true,
    activeSkillId: 1,
  } as AgentGraphState;
}

export function buildFetchReactGraphRunInput(
  graphInitialState: Partial<AgentGraphState>,
) {
  const tool = mockReadDetailTool();
  return {
    ...minimalAgentLangGraphInput({
      runGeneration: 1,
      latestUserMessage: '查询详情',
      tools: [tool],
      allowedToolIds: [tool.id],
    }),
    resumeFromWriteConfirm: true,
    graphInitialState,
  };
}

export function buildWorkflowResumeGraphInitialState(): AgentGraphState {
  const seeded = seedWorkflowGraphState();
  const workflowRun = ensureWorkflowNodeStarted(seeded.workflowRun!, 'load');
  return {
    ...seeded,
    workflowRun,
    workflowNodeDefs: workflowGraphFixtureNodes,
    workflowNodeOutputs: {},
    workflowAwaitingReact: false,
    finished: false,
    steps: [],
    toolObservations: [],
    pendingToolCalls: [],
    pendingRespond: null,
  };
}

export function buildWorkflowGraphRunInput(
  graphInitialState: Partial<AgentGraphState>,
  options: { resumeFromWriteConfirm?: boolean } = {},
) {
  return {
    ...minimalAgentLangGraphInput({ runGeneration: 1 }),
    resumeFromWriteConfirm: options.resumeFromWriteConfirm ?? true,
    graphInitialState,
  };
}

export function createIntegrationTestBundle(
  deps: AgentGraphDeps = createMockAgentGraphDeps(),
): AgentGraphNodeBundle {
  const input = minimalAgentLangGraphInput({
    runGeneration: 1,
    resumeFromWriteConfirm: true,
    tools: [mockReadDetailTool()],
    allowedToolIds: [1],
  });
  const ctx = {
    input,
    requestedSkillCtx: null,
    getSessionGoa: () => null,
    setSessionGoa: () => undefined,
    promptScope: { appClientId: input.appClientId, agentId: input.agentId },
  };
  const runHelpers = bindRunContextHelpers(
    createAgentGraphRunHelpers(deps),
    ctx,
  );
  return {
    deps,
    ctx,
    runHelpers,
    skillFrame: createAgentGraphSkillFrameHelpers(deps, ctx, runHelpers),
    hostToolHandle: createAgentGraphHostToolHandleHelpers(
      deps,
      runHelpers,
      createAgentGraphSkillFrameHelpers(deps, ctx, runHelpers),
      createAgentGraphDecisionHelpers(deps),
      ctx,
    ),
    decision: createAgentGraphDecisionHelpers(deps),
    summarize: createAgentGraphSummarizeHelpers(deps),
  };
}

export { createMinimalAgentGraphBundle, SUMMARIZE_REPLY };
