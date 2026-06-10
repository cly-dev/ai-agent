import {
  buildNextPageToolArgs,
  extractListPaginationMeta,
  resolveGatherMaxPages,
  resolvePaginationCursor,
  shouldFetchAnotherPage,
  type ListPaginationCursor,
  type ListPaginationMeta,
} from '../../../mcp-utils/pagination';
import type { LlmService } from '../../../llm/llm.service';
import type { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import {
  isReadListGatherToolStep,
  planAwaitingPagedGatherCompletion,
  shouldExpandPlanPagedGather,
} from './plan-paged-gather.util';
import { classifyPaginationParam } from '../../../tool-engine/tool-pagination-params.util';
import { formatObservationForLlm } from '../observation-format.util';
import type { ExecuteToolCallsRoundResult } from '../main/agent-tool-runtime.util';
import type {
  AgentEngineTool,
  AgentRunStep,
  GraphToolCall,
  ToolObservation,
} from '../main/agent-engine.types';
import type { TaskPlanSnapshot } from '../main/task-plan.types';
import type { PlanScopedTool } from '../main/task-plan.util';
import type {
  ListMapReduceState,
  ListPageSummary,
} from './list-map-reduce.types';
import {
  applyPageSummariesToState,
  buildMapReduceObservationOutput,
  createEmptyMapReduceState,
  findPageSourceCache,
  hasReachedMaxListRows,
  isMapReducePagedGatherResumable,
  mergePageSummaryResults,
  needsMapSummaryResume,
  needsPaginationResume,
  readMapReduceFromObservation,
  recordPageFetch,
  recordPageSourceCache,
  resolveMapReduceFetchComplete,
  resolvePagesNeedingSummary,
} from './list-map-reduce.util';
import {
  ListPageSummaryPipeline,
  type SummarizeListPageInput,
} from './list-page-summary.util';
import { extractListRowsFromToolOutput } from '../message/message-blocks.util';
import type { RunMetricsAccumulator } from '../run-metrics.util';

export type RunToolRoundFn = (
  toolCalls: GraphToolCall[],
  observations: ToolObservation[],
  steps: AgentRunStep[],
) => Promise<ExecuteToolCallsRoundResult>;

export type PagedGatherHttpBudget = {
  used: number;
  max: number;
};

export type PagedGatherLlmContext = {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  currentObjective?: string;
  runMetrics?: RunMetricsAccumulator;
  runId?: number;
  sessionId?: string;
  iteration?: number;
  onDebugLog?: (message: string) => void;
};

export type ExpandPagedListGatherInput = {
  round: ExecuteToolCallsRoundResult;
  taskPlan?: TaskPlanSnapshot | null;
  scopedTools: AgentEngineTool[];
  runRound: RunToolRoundFn;
  gatherLlm: PagedGatherLlmContext;
  httpBudget?: PagedGatherHttpBudget;
  onProgress?: (message: string) => void;
};

export type ResumePagedListGatherInput = {
  taskPlan?: TaskPlanSnapshot | null;
  scopedTools: AgentEngineTool[];
  observations: ToolObservation[];
  steps: AgentRunStep[];
  runRound: RunToolRoundFn;
  gatherLlm: PagedGatherLlmContext;
  httpBudget?: PagedGatherHttpBudget;
  onProgress?: (message: string) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function listToolStepsFromRound(
  round: ExecuteToolCallsRoundResult,
): AgentRunStep[] {
  const needed = round.lastToolRoundMeta.toolCalls.length;
  if (needed === 0) {
    return [];
  }
  const toolSteps: AgentRunStep[] = [];
  for (
    let i = round.steps.length - 1;
    i >= 0 && toolSteps.length < needed;
    i -= 1
  ) {
    const step = round.steps[i];
    if (step?.type === 'tool') {
      toolSteps.unshift(step);
    }
  }
  return toolSteps;
}

function resolveExecutedToolArgs(
  round: ExecuteToolCallsRoundResult,
  toolCall: GraphToolCall,
  toolCallIndex: number,
): Record<string, unknown> {
  const toolSteps = listToolStepsFromRound(round);
  const step = toolSteps[toolCallIndex];
  if (step && isRecord(step.input)) {
    return step.input;
  }
  return toolCall.arguments;
}

function resolveExecutedArgsFromObservation(
  observation: ToolObservation,
  toolName: string,
  steps: AgentRunStep[],
): Record<string, unknown> {
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    const step = steps[i];
    if (
      step?.type === 'tool' &&
      step.name === toolName &&
      isRecord(step.input)
    ) {
      return step.input;
    }
  }
  const payloadArgs = observation.llmPayload?.args;
  if (isRecord(payloadArgs)) {
    return payloadArgs;
  }
  return {};
}

function remapObservationIndicesAfterConsolidation(
  indices: number[],
  primaryIndex: number,
  pagesFetched: number,
): number[] {
  const removedCount = Math.max(0, pagesFetched - 1);
  return indices.map((idx) => {
    if (idx >= primaryIndex + pagesFetched) {
      return idx - removedCount;
    }
    return idx;
  });
}

function readPageRowFingerprint(output: unknown): string | null {
  const rows = extractListRowsFromToolOutput(output);
  const first = rows[0];
  if (!first) {
    return null;
  }
  if (first.id != null) {
    return `id:${String(first.id)}`;
  }
  return JSON.stringify(first).slice(0, 120);
}

export function findIncompletePagedGatherTarget(input: {
  taskPlan?: TaskPlanSnapshot | null;
  scopedTools: PlanScopedTool[];
  observations: ToolObservation[];
}): { observationIndex: number; toolName: string } | null {
  for (let index = 0; index < input.observations.length; index += 1) {
    const observation = input.observations[index];
    if (!isMapReducePagedGatherResumable(observation.output)) {
      continue;
    }
    if (
      !isReadListGatherToolStep({
        toolName: observation.name,
        scopedTools: input.scopedTools,
        taskPlan: input.taskPlan,
      })
    ) {
      continue;
    }
    return { observationIndex: index, toolName: observation.name };
  }
  return null;
}

export type PagedGatherResumeRouteInput = {
  pendingToolCalls: GraphToolCall[];
  taskPlan?: TaskPlanSnapshot | null;
  scopedTools: PlanScopedTool[];
  observations: ToolObservation[];
};

/** 是否存在可续拉的不完整 gather（resultCheck / 图边 / tools 统一入口）。 */
export function shouldResumePagedGather(input: {
  taskPlan?: TaskPlanSnapshot | null;
  scopedTools: PlanScopedTool[];
  observations: ToolObservation[];
}): boolean {
  return findIncompletePagedGatherTarget(input) != null;
}

/**
 * pre_tools：是否应路由到 tools 续拉。
 * pending 为空时仅看可续拉目标；pending 非空时需 gather 步优先于新 tool_calls。
 */
export type PagedGatherResumeKind = 'pagination' | 'map_summary';

export function resolvePagedGatherResumeKind(input: {
  taskPlan?: TaskPlanSnapshot | null;
  scopedTools: PlanScopedTool[];
  observations: ToolObservation[];
}): PagedGatherResumeKind | null {
  const target = findIncompletePagedGatherTarget(input);
  if (!target) {
    return null;
  }
  const observation = input.observations[target.observationIndex];
  const state = readMapReduceFromObservation(observation.output);
  if (!state) {
    return null;
  }
  if (needsMapSummaryResume(state)) {
    return 'map_summary';
  }
  if (needsPaginationResume(state)) {
    return 'pagination';
  }
  return null;
}

export function resolvePagedGatherResumeRoute(
  input: PagedGatherResumeRouteInput,
): { supersededPendingToolCallCount: number } | null {
  const gatherCtx = {
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools,
    observations: input.observations,
  };
  if (!shouldResumePagedGather(gatherCtx)) {
    return null;
  }
  if (input.pendingToolCalls.length > 0) {
    if (!planAwaitingPagedGatherCompletion(input.taskPlan)) {
      return null;
    }
    return { supersededPendingToolCallCount: input.pendingToolCalls.length };
  }
  return { supersededPendingToolCallCount: 0 };
}

/** resultCheck → tools：有待执行 tool_calls，或应续拉分页。 */
export function shouldRouteGraphToTools(input: {
  pendingToolCalls: GraphToolCall[];
  taskPlan?: TaskPlanSnapshot | null;
  scopedTools: PlanScopedTool[];
  observations: ToolObservation[];
}): boolean {
  if (input.pendingToolCalls.length > 0) {
    return true;
  }
  return shouldResumePagedGather(input);
}

type PageSummaryObservationContext = {
  fieldLabels: Record<string, string>;
  fieldDescriptions?: Record<string, string>;
  enumLabelsByPath?: Record<string, Record<string, string>>;
  gatherLlm: PagedGatherLlmContext;
  pipeline: ListPageSummaryPipeline;
};

type PaginationLoopInput = PageSummaryObservationContext & {
  toolName: string;
  executedArgs: Record<string, unknown>;
  mapState: ListMapReduceState;
  pagesFetched: number;
  primaryObservationIndex: number;
  observations: ToolObservation[];
  steps: AgentRunStep[];
  firstTotal?: number;
  initialLastPageMeta: ListPaginationMeta;
  initialCursor: ListPaginationCursor;
  runRound: RunToolRoundFn;
  httpBudget?: PagedGatherHttpBudget;
  onProgress?: (message: string) => void;
};

type PaginationLoopResult = {
  steps: AgentRunStep[];
  observations: ToolObservation[];
  mapState: ListMapReduceState;
  pagesFetched: number;
  pagesAdded: number;
  lastPageMeta: ListPaginationMeta;
  lastPageFingerprint: string | null;
  hitMaxPages: boolean;
  hitHttpBudget: boolean;
  hitMaxRows: boolean;
};

function schedulePageSummaryFromRows(input: {
  pageMeta: ListPaginationMeta;
  rows: Record<string, unknown>[];
  fieldLabels: Record<string, string>;
  fieldDescriptions?: Record<string, string>;
  enumLabelsByPath?: Record<string, Record<string, string>>;
  pipeline: ListPageSummaryPipeline;
  gatherLlm: PagedGatherLlmContext;
  toolName?: string;
  onProgress?: (message: string) => void;
  progressLabel?: string;
}): void {
  const summaryInput: SummarizeListPageInput = {
    llmService: input.gatherLlm.llmService,
    promptRegistry: input.gatherLlm.promptRegistry,
    scope: input.gatherLlm.scope,
    currentObjective: input.gatherLlm.currentObjective,
    runMetrics: input.gatherLlm.runMetrics,
    runId: input.gatherLlm.runId,
    sessionId: input.gatherLlm.sessionId,
    iteration: input.gatherLlm.iteration,
    toolName: input.toolName,
    onDebugLog: input.gatherLlm.onDebugLog,
    page: input.pageMeta.page,
    rows: input.rows,
    fieldLabels: input.fieldLabels,
    fieldDescriptions: input.fieldDescriptions,
    enumLabelsByPath: input.enumLabelsByPath,
  };
  input.pipeline.schedule({
    ...summaryInput,
    onScheduled: (page) => {
      const label = input.progressLabel ?? '拉取';
      input.onProgress?.(
        `第 ${page} 页已${label}（${input.rows.length} 条），正在异步生成页内摘要…\n`,
      );
    },
  });
}

function schedulePageSummaryOnly(input: {
  pageMeta: ListPaginationMeta;
  output: unknown;
  fieldLabels: Record<string, string>;
  fieldDescriptions?: Record<string, string>;
  enumLabelsByPath?: Record<string, Record<string, string>>;
  pipeline: ListPageSummaryPipeline;
  gatherLlm: PagedGatherLlmContext;
  toolName?: string;
  onProgress?: (message: string) => void;
  progressLabel?: string;
}): void {
  const rows = extractListRowsFromToolOutput(input.output);
  schedulePageSummaryFromRows({
    pageMeta: input.pageMeta,
    rows,
    fieldLabels: input.fieldLabels,
    fieldDescriptions: input.fieldDescriptions,
    enumLabelsByPath: input.enumLabelsByPath,
    pipeline: input.pipeline,
    gatherLlm: input.gatherLlm,
    toolName: input.toolName,
    onProgress: input.onProgress,
    progressLabel: input.progressLabel,
  });
}

function schedulePageSummaryForOutput(input: {
  mapState: ListMapReduceState;
  output: unknown;
  pageMeta: ListPaginationMeta;
  total?: number;
  fieldLabels: Record<string, string>;
  fieldDescriptions?: Record<string, string>;
  enumLabelsByPath?: Record<string, Record<string, string>>;
  pipeline: ListPageSummaryPipeline;
  gatherLlm: PagedGatherLlmContext;
  toolName?: string;
  onProgress?: (message: string) => void;
}): ListMapReduceState {
  const rows = extractListRowsFromToolOutput(input.output);
  let mapState = recordPageFetch({
    state: input.mapState,
    output: input.output,
    total: input.total ?? input.pageMeta.total,
    apiPage: input.pageMeta.page,
    pageSize: input.pageMeta.pageSize,
  });
  mapState = recordPageSourceCache({
    state: mapState,
    page: input.pageMeta.page,
    rows,
  });
  schedulePageSummaryOnly({
    pageMeta: input.pageMeta,
    output: input.output,
    fieldLabels: input.fieldLabels,
    fieldDescriptions: input.fieldDescriptions,
    enumLabelsByPath: input.enumLabelsByPath,
    pipeline: input.pipeline,
    gatherLlm: input.gatherLlm,
    toolName: input.toolName,
    onProgress: input.onProgress,
  });
  return mapState;
}

function isHttpBudgetExhausted(budget?: PagedGatherHttpBudget): boolean {
  return budget != null && budget.used >= budget.max;
}

function consumeHttpBudget(budget?: PagedGatherHttpBudget): void {
  if (budget) {
    budget.used += 1;
  }
}

async function runPaginationLoop(
  input: PaginationLoopInput,
): Promise<PaginationLoopResult> {
  const pagesFetchedAtStart = input.pagesFetched;
  let cursor = input.initialCursor;
  let steps = [...input.steps];
  let observations = [...input.observations];
  let mapState = input.mapState;
  const maxPages = resolveGatherMaxPages(
    mapState.pageSize || input.initialLastPageMeta.pageSize,
  );
  let pagesFetched = input.pagesFetched;
  let lastPageMeta = input.initialLastPageMeta;
  let hitMaxPages = false;
  let hitHttpBudget = false;
  let hitMaxRows = false;
  let lastPageFingerprint =
    mapState.lastPageFingerprint ??
    readPageRowFingerprint(
      observations[input.primaryObservationIndex]?.output,
    );
  let previousPageFingerprint = lastPageFingerprint;

  while (
    pagesFetched < maxPages &&
    shouldFetchAnotherPage(lastPageMeta) &&
    !isHttpBudgetExhausted(input.httpBudget) &&
    !hasReachedMaxListRows(mapState)
  ) {
    const nextArgs = buildNextPageToolArgs(input.executedArgs, cursor);
    const nextCall: GraphToolCall = {
      name: input.toolName,
      arguments: nextArgs,
    };
    input.onProgress?.(`正在拉取第 ${cursor.nextPage} 页…\n`);

    const pageRound = await input.runRound([nextCall], observations, steps);
    consumeHttpBudget(input.httpBudget);
    steps = pageRound.steps;
    observations = pageRound.toolObservations;

    const pageObservationIndex =
      pageRound.lastToolRoundMeta.roundObservationIndices[0];
    const pageObservation = observations[pageObservationIndex];
    if (!pageObservation) {
      break;
    }

    const pageExecutedArgs = resolveExecutedToolArgs(pageRound, nextCall, 0);
    const pageMeta = extractListPaginationMeta({
      output: pageObservation.output,
      args: pageExecutedArgs,
      llmPayload: pageObservation.llmPayload,
    });
    if (!pageMeta || pageMeta.rowCount === 0) {
      break;
    }

    const pageFingerprint = readPageRowFingerprint(pageObservation.output);
    if (
      pageFingerprint != null &&
      previousPageFingerprint != null &&
      pageFingerprint === previousPageFingerprint
    ) {
      input.onProgress?.('检测到分页结果重复，停止继续拉取。\n');
      break;
    }
    previousPageFingerprint = pageFingerprint;
    lastPageFingerprint = pageFingerprint;

    mapState = schedulePageSummaryForOutput({
      mapState,
      output: pageObservation.output,
      pageMeta,
      total: pageMeta.total ?? input.firstTotal ?? mapState.total,
      fieldLabels: input.fieldLabels,
      fieldDescriptions: input.fieldDescriptions,
      enumLabelsByPath: input.enumLabelsByPath,
      pipeline: input.pipeline,
      gatherLlm: input.gatherLlm,
      toolName: input.toolName,
      onProgress: input.onProgress,
    });
    pagesFetched += 1;
    lastPageMeta = pageMeta;

    if (hasReachedMaxListRows(mapState)) {
      hitMaxRows = true;
      if (mapState.total != null && mapState.fetchedCount < mapState.total) {
        input.onProgress?.(
          `已达单次分析上限 ${mapState.maxRows} 条（共 ${mapState.total} 条），将基于已拉取样本继续摘要…\n`,
        );
      }
      break;
    }
    if (!shouldFetchAnotherPage(pageMeta)) {
      break;
    }
    if (pagesFetched >= maxPages) {
      hitMaxPages = true;
      break;
    }
    cursor = resolvePaginationCursor(pageExecutedArgs, pageMeta);
  }

  if (pagesFetched >= maxPages && shouldFetchAnotherPage(lastPageMeta)) {
    hitMaxPages = true;
  }
  if (isHttpBudgetExhausted(input.httpBudget) && shouldFetchAnotherPage(lastPageMeta)) {
    hitHttpBudget = true;
  }
  if (
    hasReachedMaxListRows(mapState) &&
    mapState.total != null &&
    mapState.fetchedCount < mapState.total
  ) {
    hitMaxRows = true;
  }

  return {
    steps,
    observations,
    mapState,
    pagesFetched,
    pagesAdded: pagesFetched - pagesFetchedAtStart,
    lastPageMeta,
    lastPageFingerprint,
    hitMaxPages,
    hitHttpBudget,
    hitMaxRows,
  };
}

function resolveLatestStepIteration(steps: AgentRunStep[]): number {
  if (steps.length === 0) {
    return 0;
  }
  return steps[steps.length - 1]?.step ?? 0;
}

function upsertGatherMapRunStep(
  steps: AgentRunStep[],
  iteration: number,
  toolName: string,
  mapState: ListMapReduceState,
): AgentRunStep[] {
  const gatherStep: AgentRunStep = {
    step: iteration,
    type: 'gather',
    name: toolName,
    output: {
      complete: mapState.complete,
      mapComplete: mapState.mapComplete,
      fetchedCount: mapState.fetchedCount,
      total: mapState.total,
      pageCount: mapState.pageCount,
      fetchedApiPages: mapState.fetchedApiPages,
      pageSummaries: mapState.pageSummaries,
      truncated: mapState.truncated === true,
      truncatedByMaxRows: mapState.truncatedByMaxRows === true,
      mapPartial: mapState.mapPartial === true,
      mapResumeStalled: mapState.mapResumeStalled === true,
      resumeStalled: mapState.resumeStalled === true,
      httpBudgetExhausted: mapState.httpBudgetExhausted === true,
    },
  };
  const without = steps.filter(
    (step) => step.type !== 'gather' || step.name !== toolName,
  );
  return [...without, gatherStep];
}

function finalizePagedGatherRound(input: {
  round: ExecuteToolCallsRoundResult;
  primaryObservationIndex: number;
  pagesFetched: number;
  pagesAdded: number;
  mapState: ListMapReduceState;
  lastPageMeta: ListPaginationMeta;
  lastPageFingerprint: string | null;
  hitMaxPages: boolean;
  hitHttpBudget: boolean;
  hitMaxRows: boolean;
  observations: ToolObservation[];
  steps: AgentRunStep[];
  executedArgs: Record<string, unknown>;
  toolName: string;
  onProgress?: (message: string) => void;
}): ExecuteToolCallsRoundResult {
  input.mapState.lastPageFingerprint = input.lastPageFingerprint;
  const fetchStatus = resolveMapReduceFetchComplete({
    state: input.mapState,
    lastPageMeta: input.lastPageMeta,
    hitMaxPages: input.hitMaxPages || input.hitHttpBudget,
    hitHttpBudget: input.hitHttpBudget,
    hitMaxRows: input.hitMaxRows,
  });
  input.mapState.complete = fetchStatus.complete;
  input.mapState.truncated = fetchStatus.truncated;
  if (input.hitMaxRows) {
    input.mapState.truncatedByMaxRows = true;
  }
  if (input.hitHttpBudget) {
    input.mapState.httpBudgetExhausted = true;
  }
  if (input.pagesAdded === 0 && input.mapState.fetchedCount > 0) {
    if (!fetchStatus.complete) {
      input.mapState.resumeStalled = true;
    } else if (!input.mapState.mapComplete && !input.hitMaxRows) {
      input.mapState.mapResumeStalled = true;
    }
  }

  const stateForObservation =
    input.mapState.mapComplete === true
      ? { ...input.mapState, pageSourceByApiPage: undefined }
      : input.mapState;
  const consolidatedOutput = buildMapReduceObservationOutput(stateForObservation);
  const steps = upsertGatherMapRunStep(
    input.steps,
    resolveLatestStepIteration(input.steps),
    input.toolName,
    input.mapState,
  );
  const primaryObservation = input.observations[input.primaryObservationIndex];
  const consolidatedObservation: ToolObservation = {
    ...primaryObservation,
    output: consolidatedOutput,
    llmPayload: formatObservationForLlm({
      toolName: input.toolName,
      output: consolidatedOutput,
      fieldLabels: primaryObservation.fieldLabels,
      args: input.executedArgs,
    }),
    quality:
      fetchStatus.complete && input.mapState.mapComplete ? 'high' : 'medium',
  };
  const observations = [
    ...input.observations.slice(0, input.primaryObservationIndex),
    consolidatedObservation,
    ...input.observations.slice(
      input.primaryObservationIndex + input.pagesFetched,
    ),
  ];

  const capNote =
    input.mapState.truncatedByMaxRows === true && input.mapState.total != null
      ? `（已达分析上限 ${input.mapState.maxRows} 条，全量共 ${input.mapState.total} 条）`
      : '';
  input.onProgress?.(
    fetchStatus.complete && input.mapState.mapComplete
      ? `分页与页内摘要完成：共 ${input.mapState.fetchedCount} 条（${input.mapState.pageCount} 页）${capNote}\n`
      : `分页或摘要未完整结束：已获取 ${input.mapState.fetchedCount}${input.mapState.total != null ? `/${input.mapState.total}` : ''} 条（${input.mapState.pageCount} 页）${capNote}\n`,
  );

  return {
    steps,
    toolObservations: observations,
    lastToolRoundMeta: {
      toolCalls: input.round.lastToolRoundMeta.toolCalls,
      executionStatuses: [...input.round.lastToolRoundMeta.executionStatuses],
      errorDispositions: [...input.round.lastToolRoundMeta.errorDispositions],
      roundObservationIndices: remapObservationIndicesAfterConsolidation(
        input.round.lastToolRoundMeta.roundObservationIndices,
        input.primaryObservationIndex,
        input.pagesFetched,
      ),
    },
  };
}

async function expandSingleReadListCall(input: {
  toolCall: GraphToolCall;
  toolCallIndex: number;
  observationIndex: number;
  round: ExecuteToolCallsRoundResult;
  runRound: RunToolRoundFn;
  gatherLlm: PagedGatherLlmContext;
  httpBudget?: PagedGatherHttpBudget;
  onProgress?: (message: string) => void;
}): Promise<ExecuteToolCallsRoundResult> {
  const {
    toolCall,
    toolCallIndex,
    observationIndex,
    round,
    runRound,
    onProgress,
  } = input;

  const observation = round.toolObservations[observationIndex];
  if (!observation) {
    return round;
  }

  const executedArgs = resolveExecutedToolArgs(round, toolCall, toolCallIndex);

  const firstMeta = extractListPaginationMeta({
    output: observation.output,
    args: executedArgs,
    llmPayload: observation.llmPayload,
  });
  if (!firstMeta || firstMeta.rowCount === 0) {
    return round;
  }

  const fieldLabels = observation.fieldLabels ?? {};
  const fieldDescriptions = observation.fieldDescriptions ?? {};
  const enumLabelsByPath = observation.enumLabelsByPath ?? {};
  const pipeline = new ListPageSummaryPipeline();
  const pageContext: PageSummaryObservationContext = {
    fieldLabels,
    fieldDescriptions,
    enumLabelsByPath,
    gatherLlm: input.gatherLlm,
    pipeline,
  };

  let mapState = createEmptyMapReduceState(firstMeta.pageSize);
  mapState = schedulePageSummaryForOutput({
    mapState,
    output: observation.output,
    pageMeta: firstMeta,
    total: firstMeta.total,
    fieldLabels,
    fieldDescriptions,
    enumLabelsByPath,
    pipeline,
    gatherLlm: input.gatherLlm,
    toolName: toolCall.name,
    onProgress,
  });
  mapState.lastPageFingerprint = readPageRowFingerprint(observation.output);
  let pagesFetched = 1;
  let hitMaxRows = hasReachedMaxListRows(mapState);
  let loopResult: PaginationLoopResult | null = null;

  if (!firstMeta.hasMore || hitMaxRows) {
    onProgress?.(
      `数据共 ${firstMeta.total ?? firstMeta.rowCount} 条（${pagesFetched} 页），等待页内摘要完成…\n`,
    );
  } else {
    const estimatedPages =
      firstMeta.total != null
        ? Math.ceil(
            Math.min(firstMeta.total, mapState.maxRows) / firstMeta.pageSize,
          )
        : null;
    onProgress?.(
      `数据共 ${firstMeta.total ?? '未知'} 条，正在分页拉取（第 1${estimatedPages != null ? `/${estimatedPages}` : ''} 页）…\n`,
    );
    loopResult = await runPaginationLoop({
      toolName: toolCall.name,
      executedArgs,
      mapState,
      pagesFetched,
      primaryObservationIndex: observationIndex,
      observations: [...round.toolObservations],
      steps: [...round.steps],
      firstTotal: firstMeta.total,
      initialLastPageMeta: firstMeta,
      initialCursor: resolvePaginationCursor(executedArgs, firstMeta),
      runRound,
      httpBudget: input.httpBudget,
      onProgress,
      ...pageContext,
    });
    mapState = loopResult.mapState;
    pagesFetched = loopResult.pagesFetched;
    hitMaxRows = loopResult.hitMaxRows;
  }

  onProgress?.('正在等待各页摘要完成…\n');
  const pageSummaries = await pipeline.awaitAll();
  mapState = applyPageSummariesToState(mapState, pageSummaries);

  const lastPageMeta = loopResult?.lastPageMeta ?? firstMeta;
  const lastPageFingerprint =
    loopResult?.lastPageFingerprint ?? mapState.lastPageFingerprint ?? null;

  return finalizePagedGatherRound({
    round,
    primaryObservationIndex: observationIndex,
    pagesFetched,
    pagesAdded: loopResult?.pagesAdded ?? 0,
    mapState,
    lastPageMeta,
    lastPageFingerprint,
    hitMaxPages: loopResult?.hitMaxPages ?? false,
    hitHttpBudget: loopResult?.hitHttpBudget ?? false,
    hitMaxRows,
    observations: loopResult?.observations ?? [...round.toolObservations],
    steps: loopResult?.steps ?? [...round.steps],
    executedArgs,
    toolName: toolCall.name,
    onProgress,
  });
}

function buildResumeLastPageMeta(
  executedArgs: Record<string, unknown>,
  existing: ListMapReduceState,
): ListPaginationMeta {
  const pageParam =
    Object.keys(executedArgs).find(
      (key) => classifyPaginationParam(key) === 'page',
    ) ?? 'page';
  const sizeParam =
    Object.keys(executedArgs).find(
      (key) => classifyPaginationParam(key) === 'size',
    ) ?? 'size';
  return {
    page: existing.lastApiPage ?? existing.pageCount,
    pageSize: existing.pageSize,
    rowCount: Math.max(1, existing.pageSize),
    total: existing.total,
    hasMore:
      existing.total != null
        ? existing.fetchedCount < existing.total
        : true,
    pageParam,
    sizeParam,
  };
}

async function resumeMapSummariesOnly(input: {
  toolName: string;
  executedArgs: Record<string, unknown>;
  pages: number[];
  mapState: ListMapReduceState;
  observations: ToolObservation[];
  steps: AgentRunStep[];
  runRound: RunToolRoundFn;
  httpBudget?: PagedGatherHttpBudget;
  pageContext: PageSummaryObservationContext;
  onProgress?: (message: string) => void;
}): Promise<{
  observations: ToolObservation[];
  steps: AgentRunStep[];
  summaries: ListPageSummary[];
}> {
  const pageParam =
    Object.keys(input.executedArgs).find(
      (key) => classifyPaginationParam(key) === 'page',
    ) ?? 'page';
  const sizeParam =
    Object.keys(input.executedArgs).find(
      (key) => classifyPaginationParam(key) === 'size',
    ) ?? 'size';
  let observations = [...input.observations];
  let steps = [...input.steps];

  for (const page of input.pages) {
    const cached = findPageSourceCache(input.mapState, page);
    if (cached) {
      input.onProgress?.(`正在重试第 ${page} 页页内摘要（复用已拉取数据）…\n`);
      schedulePageSummaryFromRows({
        pageMeta: {
          page,
          pageSize: input.mapState.pageSize,
          rowCount: cached.rowCount,
          total: input.mapState.total,
          hasMore: false,
          pageParam,
          sizeParam,
        },
        rows: cached.rows,
        fieldLabels: input.pageContext.fieldLabels,
        fieldDescriptions: input.pageContext.fieldDescriptions,
        enumLabelsByPath: input.pageContext.enumLabelsByPath,
        pipeline: input.pageContext.pipeline,
        gatherLlm: input.pageContext.gatherLlm,
        toolName: input.toolName,
        onProgress: input.onProgress,
        progressLabel: '缓存',
      });
      continue;
    }

    if (isHttpBudgetExhausted(input.httpBudget)) {
      input.onProgress?.('HTTP 预算已用尽，停止页内摘要补跑。\n');
      break;
    }
    const pageArgs = {
      ...input.executedArgs,
      [pageParam]: page,
      [sizeParam]: input.mapState.pageSize,
    };
    const nextCall: GraphToolCall = {
      name: input.toolName,
      arguments: pageArgs,
    };
    input.onProgress?.(`第 ${page} 页无缓存，正在补拉以重试页内摘要…\n`);
    const pageRound = await input.runRound([nextCall], observations, steps);
    consumeHttpBudget(input.httpBudget);
    steps = pageRound.steps;
    observations = pageRound.toolObservations;

    const pageObservationIndex =
      pageRound.lastToolRoundMeta.roundObservationIndices[0];
    const pageObservation = observations[pageObservationIndex];
    if (!pageObservation) {
      continue;
    }
    const pageExecutedArgs = resolveExecutedToolArgs(pageRound, nextCall, 0);
    const pageMeta = extractListPaginationMeta({
      output: pageObservation.output,
      args: pageExecutedArgs,
      llmPayload: pageObservation.llmPayload,
    });
    if (!pageMeta || pageMeta.rowCount === 0) {
      continue;
    }
    schedulePageSummaryOnly({
      pageMeta,
      output: pageObservation.output,
      fieldLabels: input.pageContext.fieldLabels,
      fieldDescriptions: input.pageContext.fieldDescriptions,
      enumLabelsByPath: input.pageContext.enumLabelsByPath,
      pipeline: input.pageContext.pipeline,
      gatherLlm: input.pageContext.gatherLlm,
      toolName: input.toolName,
      onProgress: input.onProgress,
      progressLabel: '补拉',
    });
  }

  const summaries = await input.pageContext.pipeline.awaitAll();
  return { observations, steps, summaries };
}

/** Resume engine pagination or page-summary from an incomplete __mapReduce observation. */
export async function resumeIncompletePagedGather(
  input: ResumePagedListGatherInput,
): Promise<ExecuteToolCallsRoundResult | null> {
  const target = findIncompletePagedGatherTarget(input);
  if (!target) {
    return null;
  }

  const observation = input.observations[target.observationIndex];
  const existing = readMapReduceFromObservation(observation.output);
  if (!existing) {
    return null;
  }

  const executedArgs = resolveExecutedArgsFromObservation(
    observation,
    target.toolName,
    input.steps,
  );
  const fieldLabels = observation.fieldLabels ?? {};
  const fieldDescriptions = observation.fieldDescriptions ?? {};
  const enumLabelsByPath = observation.enumLabelsByPath ?? {};
  const pipeline = new ListPageSummaryPipeline();
  const pageContext: PageSummaryObservationContext = {
    fieldLabels,
    fieldDescriptions,
    enumLabelsByPath,
    gatherLlm: input.gatherLlm,
    pipeline,
  };
  const resumeLastPageMeta = buildResumeLastPageMeta(executedArgs, existing);

  const syntheticRound: ExecuteToolCallsRoundResult = {
    steps: input.steps,
    toolObservations: input.observations,
    lastToolRoundMeta: {
      toolCalls: [{ name: target.toolName, arguments: executedArgs }],
      executionStatuses: ['SUCCESS'],
      errorDispositions: ['llm'],
      roundObservationIndices: [target.observationIndex],
    },
  };

  if (needsMapSummaryResume(existing)) {
    const pagesToRetry = resolvePagesNeedingSummary(existing);
    input.onProgress?.(
      `分页已完成，正在补跑 ${pagesToRetry.length} 个页的页内摘要…\n`,
    );
    const retryResult = await resumeMapSummariesOnly({
      toolName: target.toolName,
      executedArgs,
      pages: pagesToRetry,
      mapState: existing,
      observations: [...input.observations],
      steps: [...input.steps],
      runRound: input.runRound,
      httpBudget: input.httpBudget,
      pageContext,
      onProgress: input.onProgress,
    });
    let mapState = applyPageSummariesToState(
      existing,
      mergePageSummaryResults(existing.pageSummaries, retryResult.summaries),
    );
    mapState = {
      ...mapState,
      mapResumeStalled:
        !mapState.mapComplete && pagesToRetry.length > 0 ? true : false,
    };

    return finalizePagedGatherRound({
      round: syntheticRound,
      primaryObservationIndex: target.observationIndex,
      pagesFetched: existing.pageCount,
      pagesAdded: 0,
      mapState,
      lastPageMeta: resumeLastPageMeta,
      lastPageFingerprint: existing.lastPageFingerprint ?? null,
      hitMaxPages: false,
      hitHttpBudget: isHttpBudgetExhausted(input.httpBudget),
      hitMaxRows: existing.truncatedByMaxRows === true,
      observations: retryResult.observations,
      steps: retryResult.steps,
      executedArgs,
      toolName: target.toolName,
      onProgress: input.onProgress,
    });
  }

  if (
    !needsPaginationResume(existing) ||
    hasReachedMaxListRows(existing)
  ) {
    return null;
  }

  input.onProgress?.(
    `继续分页拉取：已获取 ${existing.fetchedCount}${existing.total != null ? `/${existing.total}` : ''} 条…\n`,
  );

  const loopResult = await runPaginationLoop({
    toolName: target.toolName,
    executedArgs,
    mapState: existing,
    pagesFetched: existing.pageCount,
    primaryObservationIndex: target.observationIndex,
    observations: [...input.observations],
    steps: [...input.steps],
    firstTotal: existing.total,
    initialLastPageMeta: resumeLastPageMeta,
    initialCursor: resolvePaginationCursor(executedArgs, resumeLastPageMeta),
    runRound: input.runRound,
    httpBudget: input.httpBudget,
    onProgress: input.onProgress,
    ...pageContext,
  });

  input.onProgress?.('正在等待各页摘要完成…\n');
  const newPageSummaries = await pipeline.awaitAll();
  const mapState = applyPageSummariesToState(
    loopResult.mapState,
    mergePageSummaryResults(existing.pageSummaries, newPageSummaries),
  );

  return finalizePagedGatherRound({
    round: syntheticRound,
    primaryObservationIndex: target.observationIndex,
    pagesFetched: loopResult.pagesFetched,
    pagesAdded: loopResult.pagesAdded,
    mapState,
    lastPageMeta: loopResult.lastPageMeta,
    lastPageFingerprint: loopResult.lastPageFingerprint,
    hitMaxPages: loopResult.hitMaxPages,
    hitHttpBudget: loopResult.hitHttpBudget,
    hitMaxRows: loopResult.hitMaxRows,
    observations: loopResult.observations,
    steps: loopResult.steps,
    executedArgs,
    toolName: target.toolName,
    onProgress: input.onProgress,
  });
}

/**
 * After a normal tool round, auto-paginate when plan has analyze ahead and
 * the list observation still needs more pages; otherwise leave raw observation.
 */
export async function expandPagedListGather(
  input: ExpandPagedListGatherInput,
): Promise<ExecuteToolCallsRoundResult> {
  const { round, taskPlan, scopedTools, runRound, gatherLlm, httpBudget, onProgress } =
    input;

  if (round.lastToolRoundMeta.toolCalls.length === 0) {
    return round;
  }

  let result = round;

  for (
    let index = 0;
    index < result.lastToolRoundMeta.toolCalls.length;
    index += 1
  ) {
    const toolCall = result.lastToolRoundMeta.toolCalls[index];
    const observationIndex =
      result.lastToolRoundMeta.roundObservationIndices[index];
    if (observationIndex == null) {
      continue;
    }

    const status = result.lastToolRoundMeta.executionStatuses[index];
    if (status === 'ERROR' || status === 'EMPTY') {
      continue;
    }

    const observation = result.toolObservations[observationIndex];
    const executedArgs = resolveExecutedToolArgs(result, toolCall, index);
    if (
      !shouldExpandPlanPagedGather({
        taskPlan,
        toolName: toolCall.name,
        scopedTools,
        output: observation?.output,
        args: executedArgs,
        llmPayload: observation?.llmPayload,
      })
    ) {
      continue;
    }

    result = await expandSingleReadListCall({
      toolCall,
      toolCallIndex: index,
      observationIndex,
      round: result,
      runRound,
      gatherLlm,
      httpBudget,
      onProgress,
    });
  }

  return result;
}
