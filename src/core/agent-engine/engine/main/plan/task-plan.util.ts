import type { LlmChatMessage } from '../../../../llm/llm.types';
import {
  parseAgentMetadata,
  resolveToolDecisionRole,
} from '../../../../tool-engine/tool-agent-metadata.util';
import type { ToolDecisionRole } from '../../../../tool-engine/tool-decision-role.enum';
import {
  normalizeSkillRunnableCapabilities,
  skillIsHostOnlySkill,
} from '../../../../skill/skill-runnable.util';
import { hasSummarizableToolObservations } from '../../tool/tool-observation.util';
import type { ToolExecutionStatus } from '../../tool/tool-execution-status.util';
import type { ToolObservation } from '../types/agent-engine.types';
import { resolveMapReduceGatherPhase } from '../../gather/list-map-reduce.util';
import { observationNeedsPagedFetch } from '../../../../mcp-utils/pagination';
import type {
  BuildTaskPlanInput,
  ResolveTaskPlanResult,
  TaskDeliverable,
  TaskPlanAdvanceResult,
  TaskPlanInitialAdvanceResult,
  TaskPlanSnapshot,
  TaskPlanSource,
  TaskPlanStep,
  TaskStepPhase,
  PlanSummarizePublishMode,
} from './task-plan.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';
import { getWorkflowNodeDef } from '../../../../workflow/workflow-graph-routing.util';
import type { PageContextUsage } from '../../../../host-bridge/page-context-usage.types';
import { planInitialSummarizeReadyOnFresh } from '../../../../host-bridge/page-context-execution-policy.util';
import type { PlanObservationBuckets } from './plan-observation-scope.util';
import {
  planSummarizeHasToolEvidence,
  planSummarizeRequiresToolEvidence,
} from './plan-summarize-gate.util';
import {
  isPageContextSourcedObservation,
  pageContextObservationMatchesEntity,
} from '../../../../host-bridge/page-context-usage.util';
import type { OuterPlanSkillSelectMethod } from './outer-plan-skill-resolve.util';
import {
  resolvePlanGoal,
  resolveSkillCapabilityConstraints,
  formatPlanConstraintsForPrompt,
} from './plan-goal.util';
import { compilePlanToolSteps } from './plan-step-bind.util';
import {
  applyActiveFrameStepComplete,
  syncPlanFromActiveFrame,
  wrapSnapshotWithPlanStack,
} from './plan-stack.util';

/** Plan 步 toolRole 过滤 / dedupe 判定用的最小工具字段。 */
export type PlanScopedTool = {
  name: string;
  description: string;
  agentMetadata: unknown;
  responseProfile: unknown;
  method?: string;
  inputSchema?: unknown;
  schema?: unknown;
};

export type ReadinessFieldGroup = {
  toolNames: string[];
  fields: string[];
};

const VALID_DELIVERABLES: TaskDeliverable[] = [
  'analysis',
  'list',
  'detail',
  'mutation',
  'answer',
];

const VALID_STEP_KINDS = new Set([
  'skill',
  'tool',
  'host_tool',
  'summarize',
  'reason',
  'workflow_gate',
]);
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

function readStringArray(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const values = raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function readPositiveIntArray(raw: unknown): number[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const values = raw.filter(
    (item): item is number => Number.isInteger(item) && item > 0,
  );
  return values.length > 0 ? values : undefined;
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
    const pinnedToolNames = readStringArray(item.pinnedToolNames);
    const hostToolNames = readStringArray(item.hostToolNames);
    const hostToolIds = readPositiveIntArray(item.hostToolIds);
    const stopWhen = readString(item.stopWhen);
    steps.push({
      id,
      phase: phase as TaskStepPhase,
      kind: kind as TaskPlanStep['kind'],
      ...(toolRole ? { toolRole: toolRole as ToolDecisionRole } : {}),
      ...(pinnedToolNames ? { pinnedToolNames } : {}),
      ...(hostToolNames ? { hostToolNames } : {}),
      ...(hostToolIds ? { hostToolIds } : {}),
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
  options?: {
    hostOnlySkill?: boolean;
  },
): TaskDeliverable {
  const { hasReadList, hasReadDetail, hasWrite } = summarizeScopedRoles(
    scopedToolSummaries,
  );
  if (configured) {
    if (options?.hostOnlySkill && configured === 'mutation') {
      return 'mutation';
    }
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

function hostOnlySkillFromPlanInput(
  input: Pick<BuildTaskPlanInput, 'skillToolIds' | 'skillHostToolIds'>,
): boolean {
  return skillIsHostOnlySkill(
    normalizeSkillRunnableCapabilities({
      skillToolIds: input.skillToolIds ?? [],
      hostToolIds: input.skillHostToolIds ?? [],
    }),
  );
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

type FlatPlanSnapshot = Omit<TaskPlanSnapshot, 'frames' | 'activeFrameIndex'>;

function finalizePlanSnapshot(input: {
  source: TaskPlanSource;
  userMessage: string;
  goal: string;
  deliverable: TaskDeliverable;
  steps: TaskPlanStep[];
  constraints?: string[];
}): FlatPlanSnapshot {
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

/** 将外层 Plan 选中元数据写入快照。 */
export function applyOuterPlanSelectMetadata(
  plan: TaskPlanSnapshot,
  meta: {
    outerSkillSelectMethod?: OuterPlanSkillSelectMethod;
    autoSelectedSkillId?: number | null;
  },
): TaskPlanSnapshot {
  return {
    ...plan,
    ...(meta.outerSkillSelectMethod != null
      ? { outerSkillSelectMethod: meta.outerSkillSelectMethod }
      : {}),
    ...(meta.autoSelectedSkillId !== undefined
      ? { autoSelectedSkillId: meta.autoSelectedSkillId }
      : {}),
  };
}

export function buildPlanSnapshot(input: {
  source: TaskPlanSource;
  userMessage: string;
  goal: string;
  deliverable: TaskDeliverable;
  steps: TaskPlanStep[];
  constraints?: string[];
  scopedToolSummaries?: BuildTaskPlanInput['scopedToolSummaries'];
}): TaskPlanSnapshot {
  const compiledSteps = input.scopedToolSummaries
    ? compilePlanToolSteps(input.steps, input.scopedToolSummaries)
    : input.steps;
  return wrapSnapshotWithPlanStack(
    finalizePlanSnapshot({ ...input, steps: compiledSteps }),
  );
}

/**
 * 外层 kind=skill 壳的 deliverable：以 Skill 配置为准，
 * 不因 intent 收窄出 write tool 就强行 mutation（page-host-primary 场景）。
 */
export function resolveOuterSkillPlanDeliverable(input: {
  skill: {
    config?: unknown;
    skillToolIds?: number[];
    hostToolIds?: number[];
    riskLevel?: BuildTaskPlanInput['skillRiskLevel'];
  };
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
  pageHostPrimary?: boolean;
}): TaskDeliverable {
  const planConfig = parseSkillPlanConfig(input.skill.config);
  const caps = normalizeSkillRunnableCapabilities({
    skillToolIds: input.skill.skillToolIds ?? [],
    hostToolIds: input.skill.hostToolIds ?? [],
  });
  const hostPrimary =
    input.pageHostPrimary === true || skillIsHostOnlySkill(caps);

  if (planConfig.deliverable) {
    return hostPrimary
      ? planConfig.deliverable
      : alignDeliverableWithScopedTools(
          planConfig.deliverable,
          input.scopedToolSummaries,
        );
  }

  if (hostPrimary) {
    return 'answer';
  }

  return inferDeliverableFromTools(
    input.scopedToolSummaries,
    undefined,
    true,
    input.skill.riskLevel,
    { hostOnlySkill: skillIsHostOnlySkill(caps) },
  );
}

/** chitchat / direct_answer 最小 plan（constraints 含 chitchat）。 */
export function planHasChitchatConstraint(
  plan: Pick<TaskPlanSnapshot, 'constraints'> | null | undefined,
): boolean {
  return plan?.constraints.includes('chitchat') === true;
}

/** Turn 契约：寒暄 / direct_answer → reason 步 + workflow_react（无工具，含会话历史）。 */
export function buildChitchatPlanResult(input: {
  userMessage: string;
}): ResolveTaskPlanResult {
  const userMessage = input.userMessage.trim();
  const goal = userMessage || 'Reply naturally to the user';
  const plan = buildPlanSnapshot({
    source: 'minimal',
    userMessage,
    goal,
    deliverable: 'answer',
    steps: [
      {
        id: 'chitchat_reply',
        phase: 'answer',
        kind: 'reason',
        objective:
          'Reply naturally and concisely in the same language as the user. Do not call tools.',
        stopWhen: 'always',
      },
    ],
    constraints: ['chitchat'],
  });
  return { plan, method: 'minimal' };
}

/** Turn 契约：页上已有内联正文，直接 summarize（不 gather）。 */
export function buildPageContextInlinePlanResult(input: {
  userMessage: string;
  pageContextUsage: PageContextUsage;
}): ResolveTaskPlanResult {
  const userMessage = input.userMessage.trim();
  const goal =
    userMessage ||
    `Analyze current ${input.pageContextUsage.entityType ?? 'page'} context`;
  const plan = buildPlanSnapshot({
    source: 'page_context',
    userMessage,
    goal,
    deliverable: 'analysis',
    steps: [
      {
        id: 'summarize_page_context',
        phase: 'analyze',
        kind: 'summarize',
        objective:
          'Analyze the entity content from page_context / working_memory_observations. Do not call read-list or read-detail unless the user explicitly requests a server refresh.',
        stopWhen: 'always',
      },
    ],
    constraints: ['page_context_inline'],
  });
  return { plan, method: 'page_context' };
}

/** Turn 契约：页上仅有实体 id，read-detail → summarize。 */
export function buildPageContextEntityReadPlanResult(input: {
  userMessage: string;
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
  pageContextUsage: PageContextUsage;
}): ResolveTaskPlanResult {
  const userMessage = input.userMessage.trim();
  const entityId = input.pageContextUsage.entityId ?? 'unknown';
  const entityType = input.pageContextUsage.entityType ?? 'entity';
  const goal =
    userMessage || `Answer using current page ${entityType} ${entityId}`;
  const { hasReadDetail } = summarizeScopedRoles(input.scopedToolSummaries);
  const steps: TaskPlanStep[] = [];
  if (hasReadDetail) {
    steps.push({
      id: 'read_page_entity',
      phase: 'gather',
      kind: 'tool',
      toolRole: 'read-detail',
      objective: `Call read-detail once for ${entityType} id ${entityId} from page_context. Do not call read-list.`,
      stopWhen: 'observation_non_empty',
    });
  } else {
    steps.push({
      id: 'list_page_entity',
      phase: 'gather',
      kind: 'tool',
      toolRole: 'read-list',
      objective: `Call read-list once filtered to ${entityType} id ${entityId} from page_context. Do not use unfiltered pagination.`,
      stopWhen: 'observation_non_empty',
    });
  }
  steps.push({
    id: 'summarize_page_entity',
    phase: 'analyze',
    kind: 'summarize',
    objective: 'Answer the user from observations.',
    stopWhen: 'always',
  });
  const plan = buildPlanSnapshot({
    source: 'page_context',
    userMessage,
    goal,
    deliverable: 'analysis',
    steps,
    constraints: ['page_context_entity'],
  });
  return { plan, method: 'page_context' };
}

/** C 端指定 Skill 时的外层 Plan：单步 kind=skill，跳过外层 Plan LLM。 */
export function buildRequestedSkillOuterPlanResult(input: {
  userMessage: string;
  skill: {
    id: number;
    name: string;
    description: string | null;
    riskLevel: BuildTaskPlanInput['skillRiskLevel'];
    config?: unknown;
    skillToolIds?: number[];
    hostToolIds?: number[];
  };
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
  pageHostPrimary?: boolean;
  outerSkillSelectMethod?: ResolveTaskPlanResult['outerSkillSelectMethod'];
}): ResolveTaskPlanResult {
  const userMessage = input.userMessage.trim();
  const goal = resolvePlanGoal({
    userMessage,
    skillDescription: input.skill.description,
    skillName: input.skill.name,
  });
  const constraints = resolveSkillCapabilityConstraints({
    skillDescription: input.skill.description,
    skillName: input.skill.name,
  });
  const skillObjective =
    input.skill.description?.trim() ||
    input.skill.name.trim() ||
    'Execute selected skill';
  const deliverable = resolveOuterSkillPlanDeliverable({
    skill: input.skill,
    scopedToolSummaries: input.scopedToolSummaries,
    pageHostPrimary: input.pageHostPrimary,
  });
  const phase: TaskStepPhase =
    deliverable === 'mutation'
      ? 'mutate'
      : deliverable === 'answer'
        ? 'answer'
        : deliverable === 'analysis'
          ? 'analyze'
          : 'gather';
  const plan = buildPlanSnapshot({
    source: 'template',
    userMessage,
    goal,
    deliverable,
    steps: [
      {
        id: 'requested-skill',
        phase,
        kind: 'skill',
        skillId: input.skill.id,
        objective: skillObjective,
      },
    ],
    constraints,
  });
  return {
    plan,
    method: 'template',
    outerSkillSelectMethod:
      input.outerSkillSelectMethod ??
      (input.pageHostPrimary ? 'page_host_unique' : 'requested'),
    autoSelectedSkillId: input.pageHostPrimary ? input.skill.id : null,
  };
}

export function buildTaskPlan(input: BuildTaskPlanInput): TaskPlanSnapshot {
  const userMessage = input.userMessage.trim();
  const scopedToolSummaries = input.scopedToolSummaries;
  const planConfig = parseSkillPlanConfig(input.skillConfig);
  const hostOnlySkill = hostOnlySkillFromPlanInput(input);
  const goal = resolvePlanGoal({
    userMessage,
    skillDescription: input.skillDescription,
    skillName: input.skillName,
  });
  const skillConstraints = resolveSkillCapabilityConstraints({
    skillDescription: input.skillDescription,
    skillName: input.skillName,
  });

  const deliverable = inferDeliverableFromTools(
    scopedToolSummaries,
    planConfig.deliverable,
    input.skillApplied,
    input.skillRiskLevel,
    { hostOnlySkill },
  );
  const templateSteps = buildTemplateSteps(deliverable, scopedToolSummaries);
  return buildPlanSnapshot({
    source: templateSteps.length <= 1 ? 'minimal' : 'template',
    userMessage,
    goal,
    deliverable,
    steps: templateSteps,
    constraints: skillConstraints,
    scopedToolSummaries,
  });
}

/**
 * 无 Skill 的 orchestrated 读路径：用领域模板 plan 替代 plan_llm 即兴拆分。
 */
export function buildOrchestratedTemplatePlanResult(input: {
  userMessage: string;
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
  deliverable: TaskDeliverable;
}): ResolveTaskPlanResult | null {
  const { hasReadList } = summarizeScopedRoles(input.scopedToolSummaries);
  if (!hasReadList) {
    return null;
  }
  const deliverable = alignDeliverableWithScopedTools(
    input.deliverable,
    input.scopedToolSummaries,
  );
  const templateSteps = buildTemplateSteps(deliverable, input.scopedToolSummaries);
  if (templateSteps.length <= 1) {
    return null;
  }
  const userMessage = input.userMessage.trim();
  const plan = buildPlanSnapshot({
    source: 'template',
    userMessage,
    goal: userMessage,
    deliverable,
    steps: templateSteps,
    constraints: [],
    scopedToolSummaries: input.scopedToolSummaries,
  });
  return { plan, method: 'template' };
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

/** Workflow 模式下 Plan 步解析的统一输入（图节点 / summarize / gate 共用）。 */
export type PlanExecutionContext = {
  taskPlan: TaskPlanSnapshot | null | undefined;
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
};

export function planExecutionContextFromState(input: {
  taskPlan?: TaskPlanSnapshot | null;
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
}): PlanExecutionContext {
  return {
    taskPlan: input.taskPlan,
    workflowRun: input.workflowRun,
    workflowNodeDefs: input.workflowNodeDefs,
  };
}

export function workflowNodeActionForPlanStepId(
  workflowNodeDefs: WorkflowNodeDef[] | null | undefined,
  stepId: string | null | undefined,
): string | null {
  return getWorkflowNodeDef(workflowNodeDefs, stepId)?.action ?? null;
}

export function resolvePlanExecutionStep(
  ctx: PlanExecutionContext,
): {
  step: TaskPlanStep | null;
  workflowNodeAction: string | null;
} {
  const step = resolveEffectivePlanStep({
    taskPlan: ctx.taskPlan,
    workflowRun: ctx.workflowRun,
  });
  const stepId =
    step?.id ??
    (ctx.workflowRun?.status === 'running'
      ? ctx.workflowRun.currentNodeId
      : null);
  return {
    step,
    workflowNodeAction: workflowNodeActionForPlanStepId(
      ctx.workflowNodeDefs,
      stepId,
    ),
  };
}

/** pending 队列首步（含 skill / tool / summarize / reason）。Plan-only 路径用。 */
export function getPendingPlanStep(
  plan: TaskPlanSnapshot | null | undefined,
): TaskPlanStep | null {
  if (!plan) {
    return null;
  }
  const stepId = plan.pendingStepIds[0] ?? plan.currentStepId;
  return getStepById(plan, stepId);
}

/**
 * Workflow 运行时有效 Plan 步：workflowRun.currentNodeId 为 SSOT，否则 fallback pending 队列。
 * readiness / llm / tools / summarize 在 workflow 模式应统一使用此入口。
 */
export function resolveEffectivePlanStep(input: {
  taskPlan: TaskPlanSnapshot | null | undefined;
  workflowRun?: WorkflowRunState | null;
}): TaskPlanStep | null {
  const plan = input.taskPlan;
  if (!plan) {
    return null;
  }
  const run = input.workflowRun;
  if (run?.status === 'running' && run.currentNodeId) {
    const fromWorkflow = getStepById(plan, run.currentNodeId);
    if (fromWorkflow) {
      return fromWorkflow;
    }
  }
  return getPendingPlanStep(plan);
}

export function resolveEffectivePlanStepId(input: {
  taskPlan: TaskPlanSnapshot | null | undefined;
  workflowRun?: WorkflowRunState | null;
}): string | null {
  return resolveEffectivePlanStep(input)?.id ?? null;
}

/** pending 队列首步（仅 kind=host_tool）。 */
export function getPendingPlanHostToolStep(
  plan: TaskPlanSnapshot | null | undefined,
  workflowRun?: WorkflowRunState | null,
): TaskPlanStep | null {
  const step = resolveEffectivePlanStep({ taskPlan: plan, workflowRun });
  return step?.kind === 'host_tool' ? step : null;
}

/** Plan 步在 LangGraph 中的执行通路（单一来源，供 advance / summarize 续跑共用）。 */
export type PlanStepExecutionRoute =
  | 'llm'
  | 'summarize'
  | 'workflow'
  | 'terminal';

/**
 * 当前 pending 步应走哪条图路由。
 * - summarize / reason → summarize 节点（文本生成）
 * - workflow_gate → Workflow execute_node（如 await_user_confirm）
 * - tool / host_tool / skill → llm 节点（工具决策 / Host Tool dispatch / skill 帧）
 * - 无 pending → terminal
 */
export function resolvePlanStepExecutionRoute(
  step: TaskPlanStep | null | undefined,
  workflowNodeAction?: string | null,
): PlanStepExecutionRoute {
  if (!step) {
    return 'terminal';
  }
  if (isPlanAwaitUserConfirmStep(step, workflowNodeAction)) {
    return 'workflow';
  }
  if (step.kind === 'summarize' || step.kind === 'reason') {
    return 'summarize';
  }
  if (step.kind === 'workflow_gate') {
    return 'workflow';
  }
  return 'llm';
}

/** await_user_confirm 对应 Plan 步（workflow_gate；兼容历史 summarize 编译）。 */
export function isPlanAwaitUserConfirmStep(
  step: TaskPlanStep | null | undefined,
  workflowNodeAction?: string | null,
): boolean {
  return (
    step?.kind === 'workflow_gate' ||
    workflowNodeAction === 'await_user_confirm'
  );
}

/** Workflow 托管门控步（非 summarize 文本生成）。 */
export function isPlanWorkflowGateStep(
  step: TaskPlanStep | null | undefined,
  workflowNodeAction?: string | null,
): boolean {
  return resolvePlanStepExecutionRoute(step, workflowNodeAction) === 'workflow';
}

/** summarize / reason / workflow_gate：不向 LLM 暴露 HTTP tool scope。 */
export function isPlanStepBlockingToolScope(
  step: TaskPlanStep | null | undefined,
  workflowNodeAction?: string | null,
): boolean {
  const route = resolvePlanStepExecutionRoute(step, workflowNodeAction);
  return route === 'summarize' || route === 'workflow';
}

/** 文本生成步（summarize / reason），与 resolvePlanStepExecutionRoute 一致。 */
export function isPlanTextGenerationStep(
  step: TaskPlanStep | null | undefined,
  workflowNodeAction?: string | null,
): boolean {
  return resolvePlanStepExecutionRoute(step, workflowNodeAction) === 'summarize';
}

/** pending 队列首步（仅 kind=tool）。 */
export function getPendingPlanToolStep(
  plan: TaskPlanSnapshot | null | undefined,
  workflowRun?: WorkflowRunState | null,
): TaskPlanStep | null {
  const step = resolveEffectivePlanStep({ taskPlan: plan, workflowRun });
  return step?.kind === 'tool' ? step : null;
}

/** Gather tool step requires engine-driven pagination before plan advance. */
export function planGatherRequiresFullFetch(
  step: TaskPlanStep | null | undefined,
): boolean {
  return (
    step?.kind === 'tool' && step.stopWhen === 'observation_fetch_complete'
  );
}

/** summarize / reason 步不应再 bind 工具，仅文本决策或走 summarize 节点。 */
export function isPendingPlanAnswerStep(
  plan: TaskPlanSnapshot | null | undefined,
  workflowRun?: WorkflowRunState | null,
  workflowNodeDefs?: WorkflowNodeDef[] | null,
): boolean {
  const { step, workflowNodeAction } = resolvePlanExecutionStep({
    taskPlan: plan,
    workflowRun,
    workflowNodeDefs,
  });
  return isPlanTextGenerationStep(step, workflowNodeAction);
}

function matchingToolNamesForPlanStep(
  step: TaskPlanStep,
  scopedTools?: PlanScopedTool[],
): Set<string> | null {
  if (step.pinnedToolNames?.length) {
    const pinned = new Set(step.pinnedToolNames);
    if (scopedTools?.length) {
      const valid = scopedTools
        .filter((tool) => pinned.has(tool.name))
        .map((tool) => tool.name);
      if (valid.length > 0) {
        return new Set(valid);
      }
    }
    return pinned;
  }
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
  pageContextEntityId?: string | null;
}): ToolObservation[] {
  const matchingToolNames = matchingToolNamesForPlanStep(
    input.step,
    input.scopedTools,
  );
  if (!matchingToolNames) {
    return input.observations;
  }
  return input.observations.filter((row) => {
    if (matchingToolNames.has(row.name)) {
      return true;
    }
    if (!isPageContextSourcedObservation(row)) {
      return false;
    }
    if (input.step.toolRole !== 'read-detail') {
      return false;
    }
    return pageContextObservationMatchesEntity({
      observation: row,
      entityId: input.pageContextEntityId,
    });
  });
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

/**
 * - pre_tools_advance：readiness / plan_sync / resultCheck 跳步；写步永不满足；观测集为 runOwned（由 plan-observation-scope 选取）。
 * - observation_bucket：summarize reflect 等；在调用方提供的观测桶内按 stopWhen 判定（可含 write 步）。
 */
export type PlanToolStepSatisfactionPurpose =
  | 'pre_tools_advance'
  | 'observation_bucket';

/**
 * 当前 plan tool 步是否已被 observations 满足。
 * 必须有 toolRole；EMPTY 列表不算满足；与 post_tools 语义对齐。
 */
export function isPlanToolStepSatisfiedByObservations(input: {
  step: TaskPlanStep;
  observations: ToolObservation[];
  scopedTools?: PlanScopedTool[];
  taskPlan?: TaskPlanSnapshot | null;
  skillConfig?: unknown;
  purpose?: PlanToolStepSatisfactionPurpose;
  pageContextEntityId?: string | null;
}): boolean {
  const purpose = input.purpose ?? 'pre_tools_advance';
  if (input.step.kind !== 'tool' || !input.step.toolRole) {
    return false;
  }
  if (
    purpose === 'pre_tools_advance' &&
    isPlanWriteToolRole(input.step.toolRole)
  ) {
    return false;
  }
  const relevant = observationsForPlanToolStep({
    step: input.step,
    observations: input.observations,
    scopedTools: input.scopedTools,
    pageContextEntityId: input.pageContextEntityId,
  });
  return observationsSatisfyPlanToolStepStopWhen(input.step, relevant, {
    taskPlan: input.taskPlan,
    skillConfig: input.skillConfig,
  });
}

/** workflow_react 内环诊断步：不计入连续无 tool_calls 的 LLM 轮次。 */
const REACT_LOOP_SKIP_STEP_TYPES = new Set([
  'result_check',
  'tool',
  'readiness',
  'tool_resolve',
  'param_gate',
  'intent',
]);

/** 连续多少次 decision LLM 未产出 tool_calls（用于 plan tool 步脱困）。 */
export function countConsecutiveLlmRoundsWithoutToolCalls(
  steps: Array<{ type: string; output?: unknown }>,
): number {
  let count = 0;
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const row = steps[index];
    if (row?.type && REACT_LOOP_SKIP_STEP_TYPES.has(row.type)) {
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
  workflowRun?: WorkflowRunState | null,
  workflowNodeDefs?: WorkflowNodeDef[] | null,
): T[] {
  const { step: executionStep, workflowNodeAction } = resolvePlanExecutionStep({
    taskPlan,
    workflowRun,
    workflowNodeDefs,
  });
  if (isPlanStepBlockingToolScope(executionStep, workflowNodeAction)) {
    return [];
  }
  if (getPendingPlanHostToolStep(taskPlan, workflowRun)) {
    return [];
  }
  const step = getPendingPlanToolStep(taskPlan, workflowRun);
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

/** Plan 当前 pending 步是否为写 tool 步（仅描述步类型，不改队列顺序）。 */
export function isPlanWriteToolStep(
  step: TaskPlanStep | null | undefined,
): boolean {
  return step?.kind === 'tool' && isPlanWriteToolRole(step.toolRole);
}

/**
 * present_mutation 步展示草稿时解析 write tool：不依赖 finalize 后的 await 步（会触发 answer 步空工具集）。
 * 优先 plan_compose_write 绑定的 tool，其次 mutation 链上的 write_data / write 步。
 */
export function resolveMutationWriteToolsForPresent<T extends PlanScopedTool>(
  scopedTools: T[],
  taskPlan: TaskPlanSnapshot | null | undefined,
  composedToolName?: string | null,
): T[] {
  const trimmed = composedToolName?.trim();
  if (trimmed) {
    const bound = scopedTools.find((tool) => tool.name === trimmed);
    if (bound) {
      return [bound];
    }
  }
  if (!taskPlan) {
    return [];
  }
  const writeStep = taskPlan.steps.find((step) =>
    isPlanWriteExecutionStepInMutationFlow(step),
  );
  if (!writeStep) {
    return [];
  }
  const planForWriteStep: TaskPlanSnapshot = {
    ...taskPlan,
    currentStepId: writeStep.id,
    currentObjective: writeStep.objective,
    taskPhase: writeStep.phase,
    pendingStepIds: taskPlan.pendingStepIds.includes(writeStep.id)
      ? taskPlan.pendingStepIds
      : [writeStep.id, ...taskPlan.pendingStepIds],
  };
  return filterScopedToolsForPlanStep(scopedTools, planForWriteStep);
}

export const PLAN_COMPOSE_WRITE_STEP_ID = 'compose_write';
export const PLAN_PRESENT_STEP_ID = 'present';
export const PLAN_WRITE_STEP_ID = 'write';
/** Workflow DB 节点 id（mutation preset present_mutation） */
export const WORKFLOW_PRESENT_MUTATION_STEP_ID = 'present_mutation';
/** @deprecated 旧模板步 id，与 present 等价 */
export const PLAN_DRAFT_STEP_ID = 'draft';

type PresentSummarizeWorkflowNodeHint = {
  id: string;
  action: string;
};

export function isPlanComposeWriteStep(
  step: TaskPlanStep | null | undefined,
): boolean {
  return (
    step?.kind === 'tool' &&
    step.id === PLAN_COMPOSE_WRITE_STEP_ID &&
    isPlanWriteToolStep(step)
  );
}

/**
 * compose 阶段：只产 write 参数、不执行 HTTP。
 * Plan 模板 compose_write，或 Workflow compose_mutation（analyze + write tool）。
 */
export function isComposeMutationParameterStep(
  step: TaskPlanStep | null | undefined,
  workflowNodeAction?: string | null,
): boolean {
  if (isPlanComposeWriteStep(step)) {
    return true;
  }
  if (workflowNodeAction === 'compose_mutation') {
    return (
      step?.kind === 'tool' &&
      step.phase === 'analyze' &&
      isPlanWriteToolStep(step)
    );
  }
  return (
    step?.kind === 'tool' &&
    step.phase === 'analyze' &&
    isPlanWriteToolStep(step) &&
    step.id !== PLAN_WRITE_STEP_ID
  );
}

/** present 失败后 write 步 fallback（非 compose）。 */
export function isPlanWriteFallbackStep(
  step: TaskPlanStep | null | undefined,
): boolean {
  return (
    step?.kind === 'tool' &&
    step.id === PLAN_WRITE_STEP_ID &&
    isPlanWriteToolStep(step)
  );
}

/** 实际 HTTP 写执行步：Plan write fallback 或 Workflow write_data。 */
export function isPlanWriteExecutionStep(
  step: TaskPlanStep | null | undefined,
  workflowNodeAction?: string | null,
): boolean {
  if (isPlanWriteFallbackStep(step)) {
    return true;
  }
  if (
    step?.kind !== 'tool' ||
    step.phase !== 'mutate' ||
    !isPlanWriteToolStep(step)
  ) {
    return false;
  }
  if (workflowNodeAction === 'write_data') {
    return true;
  }
  return step.id === PLAN_WRITE_STEP_ID;
}

/** Plan / TaskPlan 镜像：mutate 阶段写 tool 步（含 Workflow write_data 投影）。 */
export function isPlanWriteExecutionStepInMutationFlow(
  step: TaskPlanStep | null | undefined,
): boolean {
  if (isPlanWriteFallbackStep(step)) {
    return true;
  }
  return (
    step?.kind === 'tool' &&
    step.phase === 'mutate' &&
    isPlanWriteToolStep(step)
  );
}

export function isPlanPresentSummarizeStep(
  step: TaskPlanStep | null | undefined,
  workflowNodeDefs?: PresentSummarizeWorkflowNodeHint[] | null,
): boolean {
  if (step?.kind !== 'summarize') {
    return false;
  }
  if (
    step.id === PLAN_PRESENT_STEP_ID ||
    step.id === PLAN_DRAFT_STEP_ID ||
    step.id === WORKFLOW_PRESENT_MUTATION_STEP_ID
  ) {
    return true;
  }
  const def = workflowNodeDefs?.find((row) => row.id === step.id);
  return def?.action === 'present_mutation';
}

const MUTATION_CORE_STEP_IDS = [
  PLAN_COMPOSE_WRITE_STEP_ID,
  PLAN_PRESENT_STEP_ID,
  PLAN_WRITE_STEP_ID,
] as const;

function mutationStepById(
  steps: TaskPlanStep[],
  id: string,
): TaskPlanStep | undefined {
  return steps.find((step) => step.id === id);
}

/** Plan 步序是否符合 read → compose_write → present → write → confirm 模板。 */
export function isCompliantMutationPlan(steps: TaskPlanStep[]): boolean {
  for (const id of MUTATION_CORE_STEP_IDS) {
    if (!mutationStepById(steps, id)) {
      return false;
    }
  }
  const compose = mutationStepById(steps, PLAN_COMPOSE_WRITE_STEP_ID);
  const present = mutationStepById(steps, PLAN_PRESENT_STEP_ID);
  const write = mutationStepById(steps, PLAN_WRITE_STEP_ID);
  if (
    compose?.kind !== 'tool' ||
    !isPlanWriteToolRole(compose.toolRole) ||
    present?.kind !== 'summarize' ||
    write?.kind !== 'tool' ||
    !isPlanWriteToolRole(write.toolRole)
  ) {
    return false;
  }
  const composeIndex = steps.findIndex(
    (step) => step.id === PLAN_COMPOSE_WRITE_STEP_ID,
  );
  const presentIndex = steps.findIndex((step) => step.id === PLAN_PRESENT_STEP_ID);
  const writeIndex = steps.findIndex((step) => step.id === PLAN_WRITE_STEP_ID);
  return composeIndex < presentIndex && presentIndex < writeIndex;
}

/** compose_write 完成后推进 Plan（进入 present summarize）。 */
export function advancePlanAfterStepComplete(
  plan: TaskPlanSnapshot,
  completedStepId: string,
): TaskPlanAdvanceResult {
  return buildPlanAdvanceAfterStepComplete(plan, completedStepId);
}

/** read → compose_write(tool/llm 产参) → present(summarize) → write → confirm */
export function buildMutationSteps(
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
    id: 'compose_write',
    phase: 'analyze',
    kind: 'tool',
    toolRole: writeToolRole,
    objective:
      'Compose write parameters only: emit one bound write tool_call with all required parameters from tool_schema (identifiers, headers, enums) and full submit body from read observations. Runtime stores plan_compose_write; do not wait for user draft.',
    // 完成由 llm 节点 intercept 推进，不经 tools HTTP。
  });
  steps.push({
    id: 'present',
    phase: 'answer',
    kind: 'summarize',
    objective:
      'Present user-facing draft from plan_compose_write observation. Quote the submit body from composed arguments verbatim. Do not call write tools.',
    stopWhen: 'always',
  });
  steps.push({
    id: 'write',
    phase: 'mutate',
    kind: 'tool',
    toolRole: writeToolRole,
    objective:
      'Fallback only if present did not gate: call the bound write tool from <tool_schema> using plan_compose_write arguments verbatim. Never call observation names as tools.',
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

export function buildDeterministicMutationPlanSnapshot(input: {
  userMessage: string;
  goal?: string;
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
}): TaskPlanSnapshot {
  const userMessage = input.userMessage.trim();
  const goal = resolvePlanGoal({ userMessage });
  return buildPlanSnapshot({
    source: 'template',
    userMessage,
    goal,
    deliverable: 'mutation',
    steps: buildMutationSteps(input.scopedToolSummaries),
    constraints: [],
  });
}

/** scoped 含 write 且意图为 mutation 时，使用确定性 mutation 模板。 */
export function shouldUseDeterministicMutationPlan(
  planInput: BuildTaskPlanInput,
): boolean {
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
    return true;
  }
  if (!planInput.skillApplied) {
    return true;
  }
  const risk = planInput.skillRiskLevel;
  if (risk === 'L2' || risk === 'L3') {
    return hasReadDetail || hasReadList;
  }
  return false;
}

/** 强制 mutation 模板 Plan 结果（外层/内层 LLM 步序不合规时）。 */
export function buildDeterministicMutationPlanResult(input: {
  userMessage: string;
  goal: string;
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
  llmFallbackReason?: string;
}): ResolveTaskPlanResult {
  const plan = buildDeterministicMutationPlanSnapshot({
    userMessage: input.userMessage,
    goal: input.goal,
    scopedToolSummaries: input.scopedToolSummaries,
  });
  return {
    plan,
    method: 'template',
    llmFallbackReason: input.llmFallbackReason,
  };
}

export function buildHostToolWritePlanResult(input: {
  userMessage: string;
  availableHostTools: Array<{ name: string }>;
}): ResolveTaskPlanResult {
  const userMessage = input.userMessage.trim();
  const hostToolNames = input.availableHostTools
    .map((tool) => tool.name.trim())
    .filter(Boolean);
  const plan = buildPlanSnapshot({
    source: 'template',
    userMessage,
    goal: resolvePlanGoal({ userMessage }),
    deliverable: 'answer',
    steps: [
      {
        id: 'host_operation',
        phase: 'mutate',
        kind: 'host_tool',
        ...(hostToolNames.length > 0 ? { hostToolNames } : {}),
        objective:
          'Use a browser-side host tool to perform the requested page task without server-side HTTP tools.',
        stopWhen: 'always',
      },
      {
        id: 'answer',
        phase: 'answer',
        kind: 'summarize',
        objective: 'Summarize the page automation outcome for the user.',
        stopWhen: 'always',
      },
    ],
    constraints: ['host_write_channel'],
  });
  return {
    plan,
    method: 'template',
    llmFallbackReason: 'host_write_contract',
  };
}

export function scopedToolsIncludeWrite(
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'],
): boolean {
  return summarizeScopedRoles(scopedToolSummaries).hasWrite;
}

function planHasNonCompliantMutationSteps(plan: TaskPlanSnapshot): boolean {
  if (plan.deliverable === 'mutation') {
    return !isCompliantMutationPlan(plan.steps);
  }
  return plan.steps.some(
    (step) => step.kind === 'tool' && isPlanWriteToolRole(step.toolRole),
  );
}

/**
 * 将 LLM 自由步序替换为 mutation 模板。
 * 外层不传 planInput；内层传入以校验 skill 是否应走 mutation。
 */
export function shouldReplacePlanWithMutationTemplate(
  plan: TaskPlanSnapshot,
  hasWrite: boolean,
  planInput?: BuildTaskPlanInput,
): boolean {
  if (!hasWrite) {
    return false;
  }
  if (planInput && !shouldUseDeterministicMutationPlan(planInput)) {
    return false;
  }
  if (plan.steps.some((step) => step.kind === 'skill')) {
    return false;
  }
  return planHasNonCompliantMutationSteps(plan);
}

/** tool call 是否符合 plan 当前 pending tool 步的 toolRole。 */
export function toolCallMatchesPendingPlanToolRole(
  call: { name: string },
  taskPlan: TaskPlanSnapshot,
  scopedTools: PlanScopedTool[],
): boolean {
  const step = getPendingPlanToolStep(taskPlan);
  if (!step || step.kind !== 'tool') {
    return true;
  }
  if (step.pinnedToolNames?.length) {
    return step.pinnedToolNames.includes(call.name);
  }
  if (!step.toolRole) {
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
  const normalized =
    plan.frames.length === 0 ? wrapSnapshotWithPlanStack(plan) : plan;
  return syncPlanFromActiveFrame(
    applyActiveFrameStepComplete(normalized, completedStepId),
  );
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
  const nextStep = getPendingPlanStep(updatedPlan);
  const route = resolvePlanStepExecutionRoute(nextStep);

  if (route === 'terminal') {
    return {
      updatedPlan,
      route: 'summarize',
      reason: 'plan_complete',
    };
  }

  if (route === 'summarize') {
    return {
      updatedPlan,
      route: 'summarize',
      reason: 'plan_advance_summarize',
    };
  }

  return {
    updatedPlan,
    route: 'llm',
    reason: planAdvanceReasonForLlmStep(nextStep!),
  };
}

function planAdvanceReasonForLlmStep(step: TaskPlanStep): string {
  switch (step.kind) {
    case 'skill':
      return 'plan_advance_skill_step';
    case 'host_tool':
      return 'plan_advance_host_tool_step';
    default:
      return 'plan_advance_tool_step';
  }
}

/**
 * pre_tools：当前 pending tool 步已被 observations 满足时推进（dedupe / 无 tool_calls 等）。
 */
export function resolveTaskPlanAdvanceWhenStepSatisfied(input: {
  plan: TaskPlanSnapshot;
  observations: ToolObservation[];
  scopedTools?: PlanScopedTool[];
  skillConfig?: unknown;
  purpose?: PlanToolStepSatisfactionPurpose;
  pageContextEntityId?: string | null;
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
      purpose: input.purpose ?? 'pre_tools_advance',
      pageContextEntityId: input.pageContextEntityId,
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
        purpose?: PlanToolStepSatisfactionPurpose;
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
    purpose: input.purpose ?? 'pre_tools_advance',
  });
}

/** summarize/reason 步完成后移出 pending；无剩余步骤时返回 null。 */
export function finalizePlanAfterSummarize(
  plan: TaskPlanSnapshot | null | undefined,
): TaskPlanSnapshot | null {
  if (!plan) {
    return null;
  }
  const normalized =
    plan.frames.length === 0 ? wrapSnapshotWithPlanStack(plan) : plan;
  const stepId = normalized.pendingStepIds[0] ?? normalized.currentStepId;
  const step = getStepById(normalized, stepId);
  if (!step || !isPlanTextGenerationStep(step)) {
    return normalized;
  }
  const updated = applyPlanAdvance(normalized, step.id);
  return updated.pendingStepIds.length > 0 ? updated : null;
}

/**
 * summarize/reason 中间步完成后，Agent 图是否应继续（非 END）。
 * - tool / host_tool / skill 步 → llm 环
 * - workflow_gate 步 → Workflow execute_node（非二次 summarize）
 */
export function shouldContinuePlanAfterSummarize(
  plan: TaskPlanSnapshot | null | undefined,
  workflowRun?: WorkflowRunState | null,
  workflowNodeDefs?: WorkflowNodeDef[] | null,
): boolean {
  const { step, workflowNodeAction } = resolvePlanExecutionStep({
    taskPlan: plan,
    workflowRun,
    workflowNodeDefs,
  });
  const route = resolvePlanStepExecutionRoute(step, workflowNodeAction);
  return route === 'llm' || route === 'workflow';
}

/** Plan 首步即为 summarize/reason 时，跳过 ReAct tool 环。 */
function observationBucketsForPlanInitialAdvance(input: {
  allObservations: ToolObservation[];
  runOwnedObservations: ToolObservation[];
  observationBuckets?: PlanObservationBuckets;
}): PlanObservationBuckets {
  if (input.observationBuckets) {
    return input.observationBuckets;
  }
  const runOwnedSet = new Set(input.runOwnedObservations);
  return {
    preloaded: input.allObservations.filter((row) => !runOwnedSet.has(row)),
    runOwned: input.runOwnedObservations,
  };
}

export function resolveTaskPlanInitialAdvance(input: {
  plan: TaskPlanSnapshot;
  allObservations: ToolObservation[];
  runOwnedObservations: ToolObservation[];
  observationBuckets?: PlanObservationBuckets;
  scopedTools?: PlanScopedTool[];
  workflowRun?: WorkflowRunState | null;
  userMessage: string;
  /** resume 续跑允许仅凭 GOA 预载进入 summarize；fresh 允许 page_context 物化观测。 */
  planRunContext?: 'fresh' | 'resume' | 'fresh_same_goal';
  buildMergedObservation: (
    observations: ToolObservation[],
  ) => ToolObservation | null;
}): TaskPlanInitialAdvanceResult | null {
  const firstStepId = input.plan.pendingStepIds[0] ?? input.plan.currentStepId;
  const firstStep = getStepById(input.plan, firstStepId);
  if (!firstStep || !isPlanTextGenerationStep(firstStep)) {
    return null;
  }

  if (input.plan.constraints.includes('chitchat')) {
    return null;
  }

  const planRunContext = input.planRunContext ?? 'fresh';
  const observationBuckets = observationBucketsForPlanInitialAdvance(input);

  if (planSummarizeRequiresToolEvidence(input.plan)) {
    if (
      !planSummarizeHasToolEvidence({
        plan: input.plan,
        observationBuckets,
        scopedTools: input.scopedTools,
        workflowRun: input.workflowRun,
      })
    ) {
      return null;
    }
  } else if (planRunContext !== 'resume') {
    if (
      !planInitialSummarizeReadyOnFresh({
        planSource: input.plan.source,
        planConstraints: input.plan.constraints,
        allObservations: input.allObservations,
      })
    ) {
      return null;
    }
  }

  const merged = input.buildMergedObservation(input.allObservations);
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
  workflowRun?: WorkflowRunState | null,
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
    const readSteps = steps.filter(
      (step) =>
        step.toolRole === 'read-detail' || step.toolRole === 'read-list',
    );
    const pendingStep = resolveEffectivePlanStep({
      taskPlan: plan,
      workflowRun,
    });
    const terminalMutationSummarize =
      pendingStep?.kind === 'summarize' && plan.pendingStepIds.length <= 1;
    const writeSteps = terminalMutationSummarize
      ? steps.filter((step) => isPlanWriteExecutionStepInMutationFlow(step))
      : [];
    steps =
      readSteps.length > 0 || writeSteps.length > 0
        ? [...readSteps, ...writeSteps]
        : [];
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
  workflowRun?: WorkflowRunState | null;
}): ObservationsForPlanSummarizeResult {
  const strict = input.strict === true;
  const gatherSteps = completedGatherToolStepsForPlan(
    input.plan,
    input.workflowRun,
  );
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
  workflowRun?: WorkflowRunState | null;
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
      purpose: 'observation_bucket',
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

/** reason 或队列中仍有后续步的 summarize/reason：中间步，非用户终稿。 */
export function isIntermediatePlanTextGenerationStep(
  plan: TaskPlanSnapshot | null | undefined,
): boolean {
  const step = getPendingPlanStep(plan);
  if (!step || !isPlanTextGenerationStep(step)) {
    return false;
  }
  if (step.kind === 'reason') {
    return true;
  }
  return (plan?.pendingStepIds.length ?? 0) > 1;
}

export function resolvePlanSummarizePublishMode(
  plan: TaskPlanSnapshot | null | undefined,
): PlanSummarizePublishMode {
  if (isIntermediatePlanTextGenerationStep(plan)) {
    return { artifactPhase: 'draft', emitAuthoritativeFull: false };
  }
  return { artifactPhase: 'final', emitAuthoritativeFull: true };
}

/** Plan summarize/reason 步注入 summarize LLM 的上下文块。 */
export function formatPlanContextForSummarize(
  plan: TaskPlanSnapshot | null | undefined,
): string | null {
  if (!plan) {
    return null;
  }
  const step = getPendingPlanToolStep(plan);
  const constraintBlock = formatPlanConstraintsForPrompt(plan.constraints);
  const lines = [
    `Goal: ${plan.goal}`,
    `Deliverable: ${plan.deliverable}`,
    `Original request: ${plan.originalUserRequest}`,
    ...(constraintBlock ? [`Constraints:\n${constraintBlock}`] : []),
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
