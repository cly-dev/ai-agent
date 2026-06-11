import type { LlmChatMessage } from '../../../llm/llm.types';
import { resolveToolDecisionRole } from '../../../tool-engine/tool-agent-metadata.util';
import type { ToolDecisionRole } from '../../../tool-engine/tool-decision-role.enum';
import { hasSummarizableToolObservations } from '../tool/tool-observation.util';
import type { ToolExecutionStatus } from '../tool/tool-execution-status.util';
import type { ToolObservation } from './agent-engine.types';
import { resolveMapReduceGatherPhase } from '../gather/list-map-reduce.util';
import { observationNeedsPagedFetch } from '../../../mcp-utils/pagination';
import type {
  BuildTaskPlanInput,
  TaskDeliverable,
  TaskPlanAdvanceResult,
  TaskPlanInitialAdvanceResult,
  TaskPlanSnapshot,
  TaskPlanSource,
  TaskPlanStep,
  TaskStepPhase,
} from './task-plan.types';

/** Plan 步 toolRole 过滤 / dedupe 判定用的最小工具字段。 */
export type PlanScopedTool = {
  name: string;
  description: string;
  agentMetadata: unknown;
  responseProfile: unknown;
  method?: string;
};

const VALID_DELIVERABLES: TaskDeliverable[] = [
  'analysis',
  'list',
  'detail',
  'mutation',
  'answer',
];

const VALID_STEP_KINDS = new Set(['tool', 'summarize', 'reason']);
const VALID_STEP_PHASES = new Set(['gather', 'analyze', 'answer', 'mutate']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function parseDeliverable(value: unknown): TaskDeliverable | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase() as TaskDeliverable;
  return VALID_DELIVERABLES.includes(normalized) ? normalized : null;
}

function parseWorkflowSteps(raw: unknown): TaskPlanStep[] | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }
  const steps: TaskPlanStep[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      return null;
    }
    const id = readString(item.id);
    const phase = readString(item.phase);
    const kind = readString(item.kind);
    const objective = readString(item.objective);
    if (!id || !phase || !kind || !objective) {
      return null;
    }
    if (!VALID_STEP_PHASES.has(phase) || !VALID_STEP_KINDS.has(kind)) {
      return null;
    }
    const toolRole = readString(item.toolRole);
    const stopWhen = readString(item.stopWhen);
    steps.push({
      id,
      phase: phase as TaskStepPhase,
      kind: kind as TaskPlanStep['kind'],
      ...(toolRole ? { toolRole: toolRole as ToolDecisionRole } : {}),
      objective,
      ...(stopWhen
        ? { stopWhen: stopWhen as TaskPlanStep['stopWhen'] }
        : {}),
    });
  }
  return steps;
}

export function parseSkillPlanConfig(config: unknown): {
  deliverable?: TaskDeliverable;
  workflowSteps?: TaskPlanStep[];
} {
  if (!isRecord(config)) {
    return {};
  }
  const workflow = isRecord(config.workflow) ? config.workflow : null;
  if (!workflow) {
    return {
      deliverable: parseDeliverable(config.deliverable) ?? undefined,
    };
  }
  return {
    deliverable:
      parseDeliverable(workflow.deliverable) ??
      parseDeliverable(config.deliverable) ??
      undefined,
    workflowSteps: parseWorkflowSteps(workflow.steps) ?? undefined,
  };
}

function summarizeScopedRoles(
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'],
): {
  roles: Set<ToolDecisionRole>;
  hasReadList: boolean;
  hasReadDetail: boolean;
  hasWrite: boolean;
} {
  const roles = new Set(scopedToolSummaries.map((tool) => tool.role));
  const hasWrite =
    roles.has('write-single') ||
    roles.has('write-batch') ||
    roles.has('write-meta') ||
    roles.has('admin');
  return {
    roles,
    hasReadList: roles.has('read-list'),
    hasReadDetail: roles.has('read-detail'),
    hasWrite,
  };
}

function validatePlanStepsAgainstScoped(
  steps: TaskPlanStep[],
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'],
): TaskPlanStep[] | null {
  const scopedRoles = new Set(scopedToolSummaries.map((tool) => tool.role));
  for (const step of steps) {
    if (step.kind !== 'tool') {
      continue;
    }
    if (!step.toolRole || !scopedRoles.has(step.toolRole)) {
      return null;
    }
  }
  return steps;
}

/** Plan tool 步连续未产出 tool_calls 后强制 summarize，避免 llm ⇄ resultCheck 死循环。 */
export const PLAN_TOOL_STEP_MAX_SKIPS_WITHOUT_CALLS = 2;

export function alignDeliverableWithScopedTools(
  deliverable: TaskDeliverable,
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'],
): TaskDeliverable {
  const { hasReadList, hasReadDetail, hasWrite } = summarizeScopedRoles(
    scopedToolSummaries,
  );
  switch (deliverable) {
    case 'analysis':
    case 'list':
      return hasReadList ? deliverable : 'answer';
    case 'detail':
      if (hasReadList && hasReadDetail) {
        return 'detail';
      }
      if (hasReadDetail) {
        return 'detail';
      }
      if (hasReadList) {
        return 'list';
      }
      return 'answer';
    case 'mutation':
      if (hasWrite) {
        return 'mutation';
      }
      if (hasReadList) {
        return 'list';
      }
      if (hasReadDetail) {
        return 'detail';
      }
      return 'answer';
    default:
      return deliverable;
  }
}

function inferDeliverableFromTools(
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'],
  configured?: TaskDeliverable,
  skillApplied?: boolean,
  skillRiskLevel?: BuildTaskPlanInput['skillRiskLevel'],
): TaskDeliverable {
  const { hasReadList, hasReadDetail, hasWrite } = summarizeScopedRoles(
    scopedToolSummaries,
  );
  if (configured) {
    return alignDeliverableWithScopedTools(configured, scopedToolSummaries);
  }
  if (
    skillApplied &&
    hasWrite &&
    hasReadDetail &&
    (skillRiskLevel === 'L2' || skillRiskLevel === 'L3')
  ) {
    return 'mutation';
  }
  if (hasWrite) {
    return 'mutation';
  }
  if (hasReadList && hasReadDetail) {
    return 'detail';
  }
  if (hasReadList) {
    return skillApplied ? 'analysis' : 'list';
  }
  if (hasReadDetail) {
    return 'detail';
  }
  return 'answer';
}

function buildTemplateSteps(
  deliverable: TaskDeliverable,
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'],
): TaskPlanStep[] {
  const { hasReadList, hasReadDetail, hasWrite } = summarizeScopedRoles(
    scopedToolSummaries,
  );

  if (deliverable === 'analysis' && hasReadList) {
    return [
      {
        id: 'fetch',
        phase: 'gather',
        kind: 'tool',
        toolRole: 'read-list',
        objective:
          'Call the read-list tool once with filters derived from user_intent. Use default pagination when not specified; the engine will auto-fetch remaining pages when needed.',
        stopWhen: 'observation_fetch_complete',
      },
      {
        id: 'analyze',
        phase: 'analyze',
        kind: 'summarize',
        objective:
          'Use observations only. Perform analysis per active_skill / agent_prompt. Do NOT call read-list again unless observations lack required fields.',
        stopWhen: 'always',
      },
    ];
  }

  if (deliverable === 'list' && hasReadList) {
    return [
      {
        id: 'fetch',
        phase: 'gather',
        kind: 'tool',
        toolRole: 'read-list',
        objective:
          'Call read-list once to satisfy user_intent. Do not repeat the same call.',
        stopWhen: 'observation_non_empty',
      },
      {
        id: 'answer',
        phase: 'answer',
        kind: 'summarize',
        objective:
          'Summarize the list from observations for the user. No further read-list calls.',
        stopWhen: 'always',
      },
    ];
  }

  if (deliverable === 'detail') {
    const steps: TaskPlanStep[] = [];
    if (hasReadList && hasReadDetail) {
      steps.push(
        {
          id: 'list',
          phase: 'gather',
          kind: 'tool',
          toolRole: 'read-list',
          objective:
            'When entity id is unknown, call read-list once to discover candidates.',
          stopWhen: 'observation_non_empty',
        },
        {
          id: 'detail',
          phase: 'gather',
          kind: 'tool',
          toolRole: 'read-detail',
          objective:
            'Call read-detail for the target entity using ids from observations or user_intent.',
          stopWhen: 'observation_non_empty',
        },
      );
    } else if (hasReadDetail) {
      steps.push({
        id: 'detail',
        phase: 'gather',
        kind: 'tool',
        toolRole: 'read-detail',
        objective:
          'Call read-detail once with identifiers from user_intent or observations.',
        stopWhen: 'observation_non_empty',
      });
    } else if (hasReadList) {
      return buildTemplateSteps('list', scopedToolSummaries);
    }
    steps.push({
      id: 'answer',
      phase: 'answer',
      kind: 'summarize',
      objective: 'Answer from observations. Do not re-fetch unless data is missing.',
      stopWhen: 'always',
    });
    return steps;
  }

  if (deliverable === 'mutation' && hasWrite) {
    return buildMutationSteps(scopedToolSummaries);
  }

  if (deliverable === 'answer' && hasReadDetail) {
    return [
      {
        id: 'read_detail',
        phase: 'gather',
        kind: 'tool',
        toolRole: 'read-detail',
        objective:
          'Call read-detail once with identifiers from user_intent. Load entity data needed for the answer.',
        stopWhen: 'observation_non_empty',
      },
      {
        id: 'answer',
        phase: 'answer',
        kind: 'summarize',
        objective:
          'Answer from observations and user_intent. If user_intent specifies exact fixed text, output that text. Do not call write tools unless user_intent requires mutation.',
        stopWhen: 'always',
      },
    ];
  }

  if (hasReadList) {
    return buildTemplateSteps('list', scopedToolSummaries);
  }
  if (hasReadDetail) {
    return buildTemplateSteps('detail', scopedToolSummaries);
  }

  return [
    {
      id: 'answer',
      phase: 'answer',
      kind: 'summarize',
      objective:
        'Answer from observations and agent context. Use tools only if observations cannot satisfy user_intent.',
      stopWhen: 'always',
    },
  ];
}

/** Analysis plans must not complete gather after a single list page when read-list is used. */
function normalizePlanStepsForDeliverable(
  steps: TaskPlanStep[],
  deliverable: TaskDeliverable,
): TaskPlanStep[] {
  if (deliverable !== 'analysis') {
    return steps;
  }
  return steps.map((step) => {
    if (
      step.phase === 'gather' &&
      step.kind === 'tool' &&
      step.toolRole === 'read-list'
    ) {
      return {
        ...step,
        stopWhen: 'observation_fetch_complete',
      };
    }
    return step;
  });
}

function finalizePlanSnapshot(input: {
  source: TaskPlanSource;
  userMessage: string;
  goal: string;
  deliverable: TaskDeliverable;
  steps: TaskPlanStep[];
  constraints?: string[];
}): TaskPlanSnapshot {
  const steps = normalizePlanStepsForDeliverable(
    input.steps,
    input.deliverable,
  );
  const pendingStepIds = steps.map((step) => step.id);
  const first = steps[0] ?? null;
  return {
    source: input.source,
    originalUserRequest: input.userMessage.trim(),
    goal: input.goal,
    deliverable: input.deliverable,
    constraints: input.constraints ?? [],
    steps,
    pendingStepIds,
    completedStepIds: [],
    taskPhase: first?.phase ?? 'answer',
    currentObjective: first?.objective ?? input.goal,
    currentStepId: first?.id ?? null,
  };
}

export function buildPlanSnapshot(input: {
  source: TaskPlanSource;
  userMessage: string;
  goal: string;
  deliverable: TaskDeliverable;
  steps: TaskPlanStep[];
  constraints?: string[];
}): TaskPlanSnapshot {
  return finalizePlanSnapshot(input);
}

export function buildTaskPlan(input: BuildTaskPlanInput): TaskPlanSnapshot {
  const userMessage = input.userMessage.trim();
  const scopedToolSummaries = input.scopedToolSummaries;
  const planConfig = parseSkillPlanConfig(input.skillConfig);
  const goal =
    input.skillDescription?.trim() ||
    input.skillName?.trim() ||
    userMessage ||
    'Complete the user request';

  if (planConfig.workflowSteps && planConfig.workflowSteps.length > 0) {
    const validatedSteps = validatePlanStepsAgainstScoped(
      planConfig.workflowSteps,
      scopedToolSummaries,
    );
    if (validatedSteps) {
      const deliverable = inferDeliverableFromTools(
        scopedToolSummaries,
        planConfig.deliverable,
        input.skillApplied,
        input.skillRiskLevel,
      );
      return buildPlanSnapshot({
        source: 'workflow',
        userMessage,
        goal,
        deliverable,
        steps: validatedSteps,
        constraints: [],
      });
    }
  }

  const deliverable = inferDeliverableFromTools(
    scopedToolSummaries,
    planConfig.deliverable,
    input.skillApplied,
    input.skillRiskLevel,
  );
  const templateSteps = buildTemplateSteps(deliverable, scopedToolSummaries);
  return buildPlanSnapshot({
    source: templateSteps.length <= 1 ? 'minimal' : 'template',
    userMessage,
    goal,
    deliverable,
    steps: templateSteps,
    constraints: [],
  });
}

export function summarizeScopedToolsForPlan(
  tools: Array<{
    name: string;
    description: string;
    agentMetadata: unknown;
    responseProfile: unknown;
    method?: string;
  }>,
): BuildTaskPlanInput['scopedToolSummaries'] {
  return tools.map((tool) => ({
    name: tool.name,
    role: resolveToolDecisionRole({
      agentMetadata: tool.agentMetadata,
      responseProfile: tool.responseProfile,
      method: tool.method,
      name: tool.name,
      description: tool.description,
    }),
  }));
}

function getStepById(
  plan: TaskPlanSnapshot,
  stepId: string | null | undefined,
): TaskPlanStep | null {
  if (!stepId) {
    return null;
  }
  return plan.steps.find((step) => step.id === stepId) ?? null;
}

/** pending 队列首步（当前应执行的 plan 步，含 tool / summarize / reason）。 */
export function getPendingPlanToolStep(
  plan: TaskPlanSnapshot | null | undefined,
): TaskPlanStep | null {
  if (!plan) {
    return null;
  }
  const stepId = plan.pendingStepIds[0] ?? plan.currentStepId;
  return getStepById(plan, stepId);
}

/** summarize / reason 步不应再 bind 工具，仅文本决策或走 summarize 节点。 */
export function isPendingPlanAnswerStep(
  plan: TaskPlanSnapshot | null | undefined,
): boolean {
  const step = getPendingPlanToolStep(plan);
  return step?.kind === 'summarize' || step?.kind === 'reason';
}

function matchingToolNamesForPlanStep(
  step: TaskPlanStep,
  scopedTools?: PlanScopedTool[],
): Set<string> | null {
  if (!step.toolRole || !scopedTools?.length) {
    return null;
  }
  const names = scopedTools
    .filter((tool) => resolveScopedToolRoleForPlan(tool) === step.toolRole)
    .map((tool) => tool.name);
  return names.length > 0 ? new Set(names) : null;
}

/** 仅保留与 plan 当前 tool 步 toolRole 匹配的 observations（避免 step1 数据误判 step2 完成）。 */
function observationsForPlanToolStep(input: {
  step: TaskPlanStep;
  observations: ToolObservation[];
  scopedTools?: PlanScopedTool[];
}): ToolObservation[] {
  const matchingToolNames = matchingToolNamesForPlanStep(
    input.step,
    input.scopedTools,
  );
  if (!matchingToolNames) {
    return input.observations;
  }
  return input.observations.filter((row) => matchingToolNames.has(row.name));
}

function observationsSatisfyPlanToolStepStopWhen(
  step: TaskPlanStep,
  observations: ToolObservation[],
  planContext?: {
    taskPlan?: TaskPlanSnapshot | null;
    skillConfig?: unknown;
  },
): boolean {
  const stopWhen = step.stopWhen ?? 'observation_non_empty';
  if (stopWhen === 'always') {
    return true;
  }
  if (stopWhen === 'observation_fetch_complete') {
    if (
      observations.some(
        (row) => resolveMapReduceGatherPhase(row.output) === 'resumable',
      )
    ) {
      return false;
    }
    if (
      observations.some((row) => {
        const phase = resolveMapReduceGatherPhase(row.output);
        return phase === 'complete' || phase === 'partial';
      })
    ) {
      return true;
    }
    if (!hasSummarizableToolObservations(observations)) {
      return false;
    }
    // Single-page analyze path: raw observation already holds the full dataset.
    return !observations.some((row) =>
      observationNeedsPagedFetch({
        output: row.output,
        args: row.llmPayload?.args,
        llmPayload: row.llmPayload,
      }),
    );
  }
  return hasSummarizableToolObservations(observations);
}

function isObservationRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractListRecordsFromObservationOutput(output: unknown): Record<string, unknown>[] {
  if (Array.isArray(output)) {
    return output.filter(isObservationRecord);
  }
  if (!isObservationRecord(output)) {
    return [];
  }
  const data = output.data;
  if (Array.isArray(data)) {
    return data.filter(isObservationRecord);
  }
  return [output];
}

function recordHasUsableDetailContent(record: Record<string, unknown>): boolean {
  for (const key of ['content', 'body', 'text', 'comment', 'description']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return true;
    }
  }
  return false;
}

/** read-detail 步：若 ledger/预载的 read-list 已含目标 id 且正文非空，则不必再调 detail。 */
function readDetailSatisfiedByListObservations(input: {
  step: TaskPlanStep;
  observations: ToolObservation[];
  scopedTools?: PlanScopedTool[];
  taskPlan?: TaskPlanSnapshot | null;
}): boolean {
  if (input.step.toolRole !== 'read-detail') {
    return false;
  }
  const hintText = [
    input.taskPlan?.originalUserRequest,
    input.taskPlan?.goal,
  ]
    .filter((row): row is string => typeof row === 'string' && row.trim().length > 0)
    .join(' ');
  if (!hintText.trim()) {
    return false;
  }
  const listToolNames = matchingToolNamesForPlanStep(
    { ...input.step, toolRole: 'read-list' },
    input.scopedTools,
  );
  if (!listToolNames) {
    return false;
  }
  for (const observation of input.observations) {
    if (!listToolNames.has(observation.name)) {
      continue;
    }
    for (const record of extractListRecordsFromObservationOutput(observation.output)) {
      const id = record.id ?? record.reviewId;
      if (id == null) {
        continue;
      }
      const idStr = String(id).trim();
      if (idStr.length === 0 || !hintText.includes(idStr)) {
        continue;
      }
      if (recordHasUsableDetailContent(record)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * pre_tools：当前 plan tool 步是否已被 observations 满足。
 * 必须有 toolRole；EMPTY 列表不算满足；与 post_tools 语义对齐。
 */
export function isPlanToolStepSatisfiedByObservations(input: {
  step: TaskPlanStep;
  observations: ToolObservation[];
  scopedTools?: PlanScopedTool[];
  taskPlan?: TaskPlanSnapshot | null;
  skillConfig?: unknown;
}): boolean {
  if (input.step.kind !== 'tool' || !input.step.toolRole) {
    return false;
  }
  const relevant = observationsForPlanToolStep(input);
  if (
    observationsSatisfyPlanToolStepStopWhen(input.step, relevant, {
      taskPlan: input.taskPlan,
      skillConfig: input.skillConfig,
    })
  ) {
    return true;
  }
  return readDetailSatisfiedByListObservations(input);
}

/** 连续多少次 decision LLM 未产出 tool_calls（用于 plan tool 步脱困）。 */
export function countConsecutiveLlmRoundsWithoutToolCalls(
  steps: Array<{ type: string; output?: unknown }>,
): number {
  let count = 0;
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const row = steps[index];
    if (row?.type === 'result_check' || row?.type === 'tool') {
      continue;
    }
    if (row?.type !== 'llm') {
      break;
    }
    const output = row.output;
    if (!isRecord(output)) {
      break;
    }
    const toolCalls = output.toolCalls;
    if (!Array.isArray(toolCalls) || toolCalls.length > 0) {
      break;
    }
    count += 1;
  }
  return count;
}

export function resolveScopedToolRoleForPlan(
  tool: PlanScopedTool,
): ToolDecisionRole {
  return resolveToolDecisionRole({
    agentMetadata: tool.agentMetadata,
    responseProfile: tool.responseProfile,
    method: tool.method,
    name: tool.name,
    description: tool.description,
  });
}

/** Plan 当前 tool 步按 toolRole 收窄 scoped tools；无匹配时 fallback 全量。 */
export function filterScopedToolsForPlanStep<T extends PlanScopedTool>(
  tools: T[],
  taskPlan: TaskPlanSnapshot | null | undefined,
): T[] {
  if (isPendingPlanAnswerStep(taskPlan)) {
    return [];
  }
  const step = getPendingPlanToolStep(taskPlan);
  if (!step || step.kind !== 'tool' || !step.toolRole) {
    return tools;
  }
  const filtered = tools.filter(
    (tool) => resolveScopedToolRoleForPlan(tool) === step.toolRole,
  );
  return filtered.length > 0 ? filtered : tools;
}

const WRITE_TOOL_ROLES: ToolDecisionRole[] = [
  'write-single',
  'write-batch',
  'write-meta',
  'admin',
];

export function isPlanWriteToolRole(
  role: ToolDecisionRole | string | null | undefined,
): boolean {
  return (
    role != null &&
    (WRITE_TOOL_ROLES as readonly string[]).includes(role)
  );
}

export function isPlanWriteToolStep(
  step: TaskPlanStep | null | undefined,
): boolean {
  return step?.kind === 'tool' && isPlanWriteToolRole(step.toolRole);
}

/** Plan 队列中是否仍有未完成的写 tool 步。 */
export function hasPendingWriteToolStep(
  plan: TaskPlanSnapshot | null | undefined,
): boolean {
  if (!plan) {
    return false;
  }
  return plan.pendingStepIds.some((id) =>
    isPlanWriteToolStep(getStepById(plan, id)),
  );
}

/** 是否应拦截 summarize（写步未完成）；exhausted 终态需放行以输出失败说明。 */
export function shouldDeferSummarizeForPendingWritePlan(
  plan: TaskPlanSnapshot | null | undefined,
  summarizeReason?: string | null,
): boolean {
  if (summarizeReason === 'plan_write_step_exhausted') {
    return false;
  }
  return hasPendingWriteToolStep(plan);
}

function findFirstPendingWriteToolStepId(
  plan: TaskPlanSnapshot,
): string | null {
  for (const id of plan.pendingStepIds) {
    if (isPlanWriteToolStep(getStepById(plan, id))) {
      return id;
    }
  }
  return null;
}

/**
 * summarize/reason 步排在写 tool 步之前时，将写步提前（避免未确认写操作就汇总）。
 * 当前 pending 已是 tool 步时不调整顺序。
 */
export function reprioritizePlanForPendingWriteStep(
  plan: TaskPlanSnapshot | null | undefined,
): TaskPlanSnapshot | null {
  if (!plan) {
    return null;
  }
  const writeStepId = findFirstPendingWriteToolStepId(plan);
  if (!writeStepId) {
    return null;
  }
  const headId = plan.pendingStepIds[0] ?? plan.currentStepId;
  const head = getStepById(plan, headId);
  if (isPlanWriteToolStep(head)) {
    return null;
  }
  if (head?.kind === 'tool') {
    return null;
  }
  const writeStep = getStepById(plan, writeStepId);
  if (!writeStep) {
    return null;
  }
  const rest = plan.pendingStepIds.filter((id) => id !== writeStepId);
  return {
    ...plan,
    pendingStepIds: [writeStepId, ...rest],
    currentStepId: writeStepId,
    currentObjective: writeStep.objective,
    taskPhase: writeStep.phase,
  };
}

/** read(-detail) → write → summarize；与 skill.config.workflow 或 deliverable=mutation 模板一致。 */
function buildMutationSteps(
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'],
): TaskPlanStep[] {
  const { hasReadList, hasReadDetail } = summarizeScopedRoles(
    scopedToolSummaries,
  );
  const writeToolRole = pickWriteToolRoleForTemplate(scopedToolSummaries);
  const steps: TaskPlanStep[] = [];
  if (hasReadDetail) {
    steps.push({
      id: 'read_detail',
      phase: 'gather',
      kind: 'tool',
      toolRole: 'read-detail',
      objective:
        'Call read-detail once with identifiers from user_intent. Load data required before write.',
      stopWhen: 'observation_non_empty',
    });
  } else if (hasReadList) {
    steps.push({
      id: 'list',
      phase: 'gather',
      kind: 'tool',
      toolRole: 'read-list',
      objective:
        'When entity id is unknown, call read-list once before write.',
      stopWhen: 'observation_non_empty',
    });
  }
  steps.push({
    id: 'write',
    phase: 'mutate',
    kind: 'tool',
    toolRole: writeToolRole,
    objective:
      'Call the write tool when businessFields are satisfied. Map user_intent values to write params per tool_schema; use exact fixed text verbatim when specified.',
    stopWhen: 'observation_non_empty',
  });
  steps.push({
    id: 'confirm',
    phase: 'answer',
    kind: 'summarize',
    objective:
      'Summarize whether the write succeeded and what changed, citing observations.',
    stopWhen: 'always',
  });
  return steps;
}

function pickWriteToolRoleForTemplate(
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'],
): ToolDecisionRole {
  const roles = new Set(scopedToolSummaries.map((tool) => tool.role));
  for (const role of WRITE_TOOL_ROLES) {
    if (roles.has(role)) {
      return role;
    }
  }
  return 'write-single';
}

/** tool call 是否符合 plan 当前 pending tool 步的 toolRole。 */
export function toolCallMatchesPendingPlanToolRole(
  call: { name: string },
  taskPlan: TaskPlanSnapshot,
  scopedTools: PlanScopedTool[],
): boolean {
  const step = getPendingPlanToolStep(taskPlan);
  if (!step || step.kind !== 'tool' || !step.toolRole) {
    return true;
  }
  const tool = scopedTools.find((row) => row.name === call.name);
  if (!tool) {
    return false;
  }
  return resolveScopedToolRoleForPlan(tool) === step.toolRole;
}

/** 本轮工具均为 EMPTY 终态（非缺参/可恢复），应中断 plan 而非 advance。 */
export function isTerminalEmptyToolRound(
  executionStatuses: ToolExecutionStatus[],
): boolean {
  return (
    executionStatuses.length > 0 &&
    executionStatuses.every((status) => status === 'EMPTY')
  );
}

function observationsForRound(
  observations: ToolObservation[],
  roundObservationIndices: number[],
): ToolObservation[] {
  return roundObservationIndices
    .map((index) => observations[index])
    .filter((row): row is ToolObservation => row != null);
}

function roundObservationsForPlanToolStep(input: {
  step: TaskPlanStep;
  observations: ToolObservation[];
  roundObservationIndices: number[];
  scopedTools?: PlanScopedTool[];
}): ToolObservation[] {
  const roundObservations = observationsForRound(
    input.observations,
    input.roundObservationIndices,
  );
  const matchingToolNames = matchingToolNamesForPlanStep(
    input.step,
    input.scopedTools,
  );
  if (!matchingToolNames) {
    return roundObservations;
  }
  return roundObservations.filter((row) => matchingToolNames.has(row.name));
}

function isToolStepComplete(input: {
  step: TaskPlanStep;
  roundObservations: ToolObservation[];
  executionStatuses: ToolExecutionStatus[];
  taskPlan?: TaskPlanSnapshot | null;
  skillConfig?: unknown;
}): boolean {
  if (input.executionStatuses.includes('ERROR')) {
    return false;
  }
  if (input.executionStatuses.length === 0) {
    return false;
  }
  return observationsSatisfyPlanToolStepStopWhen(
    input.step,
    input.roundObservations,
    {
      taskPlan: input.taskPlan,
      skillConfig: input.skillConfig,
    },
  );
}

function roundToolCallsMatchPendingPlanStep(input: {
  plan: TaskPlanSnapshot;
  scopedTools?: PlanScopedTool[];
  toolCalls: Array<{ name: string }>;
}): boolean {
  const step = getPendingPlanToolStep(input.plan);
  if (!step || step.kind !== 'tool' || !step.toolRole) {
    return true;
  }
  if (input.toolCalls.length === 0) {
    return false;
  }
  return input.toolCalls.every((call) =>
    toolCallMatchesPendingPlanToolRole(
      call,
      input.plan,
      input.scopedTools ?? [],
    ),
  );
}

function applyPlanAdvance(
  plan: TaskPlanSnapshot,
  completedStepId: string,
): TaskPlanSnapshot {
  const pendingStepIds = plan.pendingStepIds.filter(
    (id) => id !== completedStepId,
  );
  const completedStepIds = plan.completedStepIds.includes(completedStepId)
    ? plan.completedStepIds
    : [...plan.completedStepIds, completedStepId];
  const nextStep = getStepById(plan, pendingStepIds[0] ?? null);
  return {
    ...plan,
    pendingStepIds,
    completedStepIds,
    currentStepId: nextStep?.id ?? null,
    currentObjective: nextStep?.objective ?? plan.goal,
    taskPhase: nextStep?.phase ?? 'answer',
  };
}

/** post_tools 后推进 Plan；返回 null 表示不干预原有 resultCheck 路由。 */
export function resolveTaskPlanAfterTools(input: {
  plan: TaskPlanSnapshot;
  observations: ToolObservation[];
  executionStatuses: ToolExecutionStatus[];
  roundObservationIndices: number[];
  scopedTools?: PlanScopedTool[];
  toolCalls?: Array<{ name: string }>;
  skillConfig?: unknown;
}): TaskPlanAdvanceResult | null {
  const currentStepId = input.plan.pendingStepIds[0] ?? input.plan.currentStepId;
  const currentStep = getStepById(input.plan, currentStepId);
  if (!currentStep || currentStep.kind !== 'tool') {
    return null;
  }
  if (
    !roundToolCallsMatchPendingPlanStep({
      plan: input.plan,
      scopedTools: input.scopedTools,
      toolCalls: input.toolCalls ?? [],
    })
  ) {
    return null;
  }
  const roundObservations = roundObservationsForPlanToolStep({
    step: currentStep,
    observations: input.observations,
    roundObservationIndices: input.roundObservationIndices,
    scopedTools: input.scopedTools,
  });
  if (
    !isToolStepComplete({
      step: currentStep,
      roundObservations,
      executionStatuses: input.executionStatuses,
      taskPlan: input.plan,
      skillConfig: input.skillConfig,
    })
  ) {
    return null;
  }

  // 本轮全 EMPTY：不 advance，由 resultCheck empty_tool_results 中断 plan 并 summarize。
  if (isTerminalEmptyToolRound(input.executionStatuses)) {
    return null;
  }

  return buildPlanAdvanceAfterStepComplete(input.plan, currentStep.id);
}

function buildPlanAdvanceAfterStepComplete(
  plan: TaskPlanSnapshot,
  completedStepId: string,
): TaskPlanAdvanceResult {
  const updatedPlan = applyPlanAdvance(plan, completedStepId);
  const nextStep = getStepById(
    updatedPlan,
    updatedPlan.pendingStepIds[0] ?? null,
  );

  if (!nextStep) {
    return {
      updatedPlan,
      route: 'summarize',
      reason: 'plan_complete',
    };
  }

  if (nextStep.kind === 'summarize' || nextStep.kind === 'reason') {
    const deferred = reprioritizePlanForPendingWriteStep(updatedPlan);
    if (deferred) {
      return {
        updatedPlan: deferred,
        route: 'llm',
        reason: 'plan_defer_summarize_pending_write',
      };
    }
    return {
      updatedPlan,
      route: 'summarize',
      reason: 'plan_advance_summarize',
    };
  }

  return {
    updatedPlan,
    route: 'llm',
    reason: 'plan_advance_tool_step',
  };
}

/**
 * pre_tools：当前 pending tool 步已被 observations 满足时推进（dedupe / 无 tool_calls 等）。
 */
export function resolveTaskPlanAdvanceWhenStepSatisfied(input: {
  plan: TaskPlanSnapshot;
  observations: ToolObservation[];
  scopedTools?: PlanScopedTool[];
  skillConfig?: unknown;
}): TaskPlanAdvanceResult | null {
  const currentStepId =
    input.plan.pendingStepIds[0] ?? input.plan.currentStepId;
  const currentStep = getStepById(input.plan, currentStepId);
  if (!currentStep || currentStep.kind !== 'tool') {
    return null;
  }
  if (
    !isPlanToolStepSatisfiedByObservations({
      step: currentStep,
      observations: input.observations,
      scopedTools: input.scopedTools,
      taskPlan: input.plan,
      skillConfig: input.skillConfig,
    })
  ) {
    return null;
  }
  return buildPlanAdvanceAfterStepComplete(input.plan, currentStep.id);
}

/** resultCheck 统一入口：post_tools 看本轮执行；pre_tools 看 role 收窄后的 observations。 */
export function resolveTaskPlanAdvance(
  input:
    | {
        phase: 'post_tools';
        plan: TaskPlanSnapshot;
        observations: ToolObservation[];
        executionStatuses: ToolExecutionStatus[];
        roundObservationIndices: number[];
        scopedTools?: PlanScopedTool[];
        toolCalls?: Array<{ name: string }>;
        skillConfig?: unknown;
      }
    | {
        phase: 'pre_tools';
        plan: TaskPlanSnapshot;
        observations: ToolObservation[];
        scopedTools?: PlanScopedTool[];
        skillConfig?: unknown;
      },
): TaskPlanAdvanceResult | null {
  if (input.phase === 'post_tools') {
    return resolveTaskPlanAfterTools({
      plan: input.plan,
      observations: input.observations,
      executionStatuses: input.executionStatuses,
      roundObservationIndices: input.roundObservationIndices,
      scopedTools: input.scopedTools,
      toolCalls: input.toolCalls,
      skillConfig: input.skillConfig,
    });
  }
  return resolveTaskPlanAdvanceWhenStepSatisfied({
    plan: input.plan,
    observations: input.observations,
    scopedTools: input.scopedTools,
    skillConfig: input.skillConfig,
  });
}

/** summarize/reason 步完成后移出 pending；无剩余步骤时返回 null。 */
export function finalizePlanAfterSummarize(
  plan: TaskPlanSnapshot | null | undefined,
): TaskPlanSnapshot | null {
  if (!plan) {
    return null;
  }
  const stepId = plan.pendingStepIds[0] ?? plan.currentStepId;
  const step = getStepById(plan, stepId);
  if (!step || (step.kind !== 'summarize' && step.kind !== 'reason')) {
    return plan;
  }
  const updated = applyPlanAdvance(plan, step.id);
  return updated.pendingStepIds.length > 0 ? updated : null;
}

/** Plan 中间 summarize/reason 完成后是否仍有待执行的 tool 步（需回 llm 续跑，不可结束 run）。 */
export function shouldContinuePlanAfterSummarize(
  plan: TaskPlanSnapshot | null | undefined,
): boolean {
  if (!plan) {
    return false;
  }
  const nextId = plan.pendingStepIds[0] ?? plan.currentStepId;
  const next = getStepById(plan, nextId);
  return next?.kind === 'tool';
}

/** Plan 首步即为 summarize/reason 时，跳过 ReAct tool 环。 */
export function resolveTaskPlanInitialAdvance(input: {
  plan: TaskPlanSnapshot;
  observations: ToolObservation[];
  userMessage: string;
  buildMergedObservation: (
    observations: ToolObservation[],
  ) => ToolObservation | null;
}): TaskPlanInitialAdvanceResult | null {
  const firstStepId = input.plan.pendingStepIds[0] ?? input.plan.currentStepId;
  const firstStep = getStepById(input.plan, firstStepId);
  if (
    !firstStep ||
    (firstStep.kind !== 'summarize' && firstStep.kind !== 'reason')
  ) {
    return null;
  }

  const merged = input.buildMergedObservation(input.observations);
  const summaryObservation = buildPlanSummarizeObservation({
    userMessage: input.userMessage,
    merged,
  });

  // 不在此处 advance：summarize 节点需 pending 仍指向当前 summarize/reason 步，
  // 由 finalizePlanAfterSummarize 在汇总完成后再推进。
  return {
    updatedPlan: input.plan,
    summaryObservation,
    reason: 'plan_initial_summarize',
  };
}

/** Skill 命中且 scoped 含 read-detail + write → 必须走确定性回复/提交模板，不由 Plan LLM 猜步序。 */
export function shouldUseDeterministicMutationReplyPlan(
  planInput: BuildTaskPlanInput,
): boolean {
  if (!planInput.skillApplied) {
    return false;
  }
  const planConfig = parseSkillPlanConfig(planInput.skillConfig);
  if (planConfig.deliverable === 'answer') {
    return false;
  }
  const { hasWrite, hasReadDetail, hasReadList } = summarizeScopedRoles(
    planInput.scopedToolSummaries,
  );
  if (!hasWrite) {
    return false;
  }
  if (planConfig.deliverable === 'mutation') {
    return hasReadDetail || hasReadList;
  }
  const risk = planInput.skillRiskLevel;
  if (risk === 'L2' || risk === 'L3') {
    return hasReadDetail || hasReadList;
  }
  return false;
}

/** LLM Plan 在回复场景下若缺少 write 步则视为无效。 */
export function llmPlanMissingRequiredWriteStep(
  steps: TaskPlanStep[],
  planInput: BuildTaskPlanInput,
): boolean {
  if (!shouldUseDeterministicMutationReplyPlan(planInput)) {
    return false;
  }
  return !steps.some(
    (step) => step.kind === 'tool' && isPlanWriteToolRole(step.toolRole),
  );
}

function observationArgsFingerprint(observation: ToolObservation): string {
  const args = observation.llmPayload?.args;
  if (!args || typeof args !== 'object') {
    return '';
  }
  try {
    return JSON.stringify(args);
  } catch {
    return '';
  }
}

/** 已完成 gather 步（不在 pending 中的 tool 步）。 */
function completedGatherToolStepsForPlan(
  plan: TaskPlanSnapshot,
): TaskPlanStep[] {
  const pending = new Set(plan.pendingStepIds);
  let steps = plan.steps.filter(
    (step) => step.kind === 'tool' && step.toolRole && !pending.has(step.id),
  );
  if (plan.deliverable === 'detail') {
    const detailSteps = steps.filter((step) => step.toolRole === 'read-detail');
    if (detailSteps.length > 0) {
      steps = detailSteps;
    }
  } else if (plan.deliverable === 'list' || plan.deliverable === 'analysis') {
    const listSteps = steps.filter((step) => step.toolRole === 'read-list');
    if (listSteps.length > 0) {
      steps = listSteps;
    }
  } else if (plan.deliverable === 'mutation') {
    const writeSteps = steps.filter((step) => isPlanWriteToolRole(step.toolRole));
    if (writeSteps.length > 0) {
      steps = writeSteps;
    }
  }
  return steps;
}

export type ObservationsForPlanSummarizeResult = {
  observations: ToolObservation[];
  filterMiss: boolean;
};

/**
 * Plan summarize/reason 步：只保留本轮 plan 已完成 gather 步对应的观测。
 * `strict: true` 时过滤失败返回空数组并标记 filterMiss（供 reflect_memory 使用）。
 */
export function filterObservationsForPlanSummarize(input: {
  plan: TaskPlanSnapshot;
  observations: ToolObservation[];
  scopedTools?: PlanScopedTool[];
  strict?: boolean;
}): ObservationsForPlanSummarizeResult {
  const strict = input.strict === true;
  const gatherSteps = completedGatherToolStepsForPlan(input.plan);
  if (gatherSteps.length === 0) {
    return { observations: input.observations, filterMiss: false };
  }
  const allowedToolNames = new Set<string>();
  for (const step of gatherSteps) {
    const names = matchingToolNamesForPlanStep(step, input.scopedTools);
    if (names) {
      for (const name of names) {
        allowedToolNames.add(name);
      }
    }
  }
  if (allowedToolNames.size === 0) {
    return {
      observations: strict ? [] : input.observations,
      filterMiss: strict && input.observations.length > 0,
    };
  }
  const filtered = input.observations.filter((row) =>
    allowedToolNames.has(row.name),
  );
  if (filtered.length === 0) {
    return {
      observations: strict ? [] : input.observations,
      filterMiss: strict && input.observations.length > 0,
    };
  }
  const deduped = new Map<string, ToolObservation>();
  for (const row of filtered) {
    const key = `${row.name}:${observationArgsFingerprint(row)}`;
    deduped.set(key, row);
  }
  return { observations: [...deduped.values()], filterMiss: false };
}

/**
 * Plan summarize/reason 步：只保留本轮 plan 已完成 gather 步对应的观测，
 * 避免 GOA 预载的无关历史列表污染 detail 汇总。
 */
export function observationsForPlanSummarize(input: {
  plan: TaskPlanSnapshot;
  observations: ToolObservation[];
  scopedTools?: PlanScopedTool[];
}): ToolObservation[] {
  return filterObservationsForPlanSummarize({
    ...input,
    strict: false,
  }).observations;
}

/** 观测是否满足 plan 任一已完成 gather 步的 stopWhen。 */
export function completedGatherStepsSatisfiedInObservations(input: {
  plan: TaskPlanSnapshot;
  observations: ToolObservation[];
  scopedTools?: PlanScopedTool[];
}): boolean {
  const gatherSteps = completedGatherToolStepsForPlan(input.plan);
  return gatherSteps.some((step) =>
    isPlanToolStepSatisfiedByObservations({
      step,
      observations: input.observations,
      scopedTools: input.scopedTools,
      taskPlan: input.plan,
    }),
  );
}

/** Plan summarize 步使用的 observation：分块或单条 tool 结果，否则 direct_user。 */
export function buildPlanSummarizeObservation(input: {
  userMessage: string;
  summarizeObservation?: ToolObservation | null;
  merged?: ToolObservation | null;
}): ToolObservation {
  const resolved = input.summarizeObservation ?? input.merged;
  return (
    resolved ?? {
      name: 'direct_user',
      output: { userMessage: input.userMessage.trim() },
    }
  ) as ToolObservation;
}

/** summarize 节点 user 消息：有 plan 时用 originalUserRequest 保留固定回复等完整意图。 */
export function resolveSummarizeUserMessageForPlan(
  latestUserMessage: string,
  plan: TaskPlanSnapshot | null | undefined,
): string {
  const original = plan?.originalUserRequest?.trim();
  if (original) {
    return original;
  }
  return latestUserMessage.trim();
}

/** Plan summarize/reason 步注入 summarize LLM 的上下文块。 */
export function formatPlanContextForSummarize(
  plan: TaskPlanSnapshot | null | undefined,
): string | null {
  if (!plan) {
    return null;
  }
  const step = getPendingPlanToolStep(plan);
  const lines = [
    `Goal: ${plan.goal}`,
    `Deliverable: ${plan.deliverable}`,
    `Original request: ${plan.originalUserRequest}`,
    step
      ? `Current step (${step.id}, kind=${step.kind}, phase=${step.phase}): ${step.objective}`
      : `Current objective: ${plan.currentObjective}`,
  ];
  return lines.join('\n');
}

/** ReAct Reason 阶段 user 消息：有 plan 时每轮带 user_intent + current_objective。 */
export function buildDecisionUserFrame(input: {
  taskPlan: TaskPlanSnapshot | null | undefined;
  observationCount: number;
  latestUserMessage: string;
}): LlmChatMessage | null {
  const trimmed = input.latestUserMessage.trim();
  if (input.taskPlan) {
    const parts: string[] = [
      `<user_intent>\nOriginal request: ${input.taskPlan.originalUserRequest}\nGoal: ${input.taskPlan.goal}\nDeliverable: ${input.taskPlan.deliverable}\n</user_intent>`,
      `<current_objective>\n${input.taskPlan.currentObjective}\n</current_objective>`,
    ];
    return {
      role: 'user',
      content: parts.join('\n\n'),
    };
  }
  if (!trimmed) {
    return null;
  }
  return {
    role: 'user',
    content: `<current_user_request>\n${trimmed}\n</current_user_request>`,
  };
}
