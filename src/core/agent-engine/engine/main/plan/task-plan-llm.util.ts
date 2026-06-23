import { z } from 'zod';
import type { LlmService } from '../../../../llm/llm.service';
import type { LlmChatMessage } from '../../../../llm/llm.types';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import { PROMPT_KEYS } from '../../../../prompt/prompt-template.keys';
import {
  TOOL_DECISION_ROLES,
  type ToolDecisionRole,
} from '../../../../tool-engine/tool-decision-role.enum';
import type {
  BuildTaskPlanInput,
  ResolveOuterPlanInput,
  ResolveTaskPlanInput,
  ResolveTaskPlanResult,
  TaskDeliverable,
  TaskPlanStep,
} from './task-plan.types';
import {
  normalizeSkillRunnableCapabilities,
  skillIsHostOnlySkill,
} from '../../../../skill/skill-runnable.util';
import { RequestedSkillRunError } from '../skill/requested-skill-run.error';
import {
  alignDeliverableWithScopedTools,
  buildDeterministicMutationPlanResult,
  buildPlanSnapshot,
  buildRequestedSkillOuterPlanResult,
  buildTaskPlan,
  parseSkillPlanConfig,
  scopedToolsIncludeWrite,
  shouldReplacePlanWithMutationTemplate,
  shouldUseDeterministicMutationPlan,
} from './task-plan.util';
import {
  resolvePlanGoal,
  resolveSkillCapabilityConstraints,
} from './plan-goal.util';

export function isRequestedHostOnlyOuterPlanInput(
  planInput: ResolveOuterPlanInput,
): boolean {
  const requestedSkillId = planInput.requestedSkillId;
  if (requestedSkillId == null) {
    return false;
  }
  const skill =
    planInput.requestedSkillDetail ??
    planInput.availableSkills.find((row) => row.id === requestedSkillId);
  if (!skill) {
    return false;
  }
  if ('runnableKind' in skill && skill.runnableKind === 'host') {
    return true;
  }
  const caps = normalizeSkillRunnableCapabilities({
    skillToolIds:
      'skillToolIds' in skill ? skill.skillToolIds : undefined,
    hostToolIds: skill.hostToolIds,
  });
  return skillIsHostOnlySkill(caps);
}

export function resolveRequestedSkillOuterPlan(
  planInput: ResolveOuterPlanInput,
): ResolveTaskPlanResult {
  const requestedSkillId = planInput.requestedSkillId;
  if (requestedSkillId == null) {
    throw new RequestedSkillRunError(
      'SKILL_NOT_IN_SCOPE',
      'requestedSkillId is required',
    );
  }
  const skill =
    planInput.requestedSkillDetail ??
    planInput.availableSkills.find((row) => row.id === requestedSkillId);
  if (!skill) {
    throw new RequestedSkillRunError(
      'SKILL_NOT_IN_SCOPE',
      `requested skill ${requestedSkillId} is not available for scoped tools`,
    );
  }
  return buildRequestedSkillOuterPlanResult({
    userMessage: planInput.userMessage,
    skill: {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      riskLevel: skill.riskLevel,
      config:
        'config' in skill && skill.config !== undefined ? skill.config : undefined,
      skillToolIds: 'skillToolIds' in skill ? skill.skillToolIds : undefined,
      hostToolIds: 'hostToolIds' in skill ? skill.hostToolIds : undefined,
    },
    scopedToolSummaries: planInput.scopedToolSummaries,
    outerSkillSelectMethod: 'requested',
  });
}

const LLM_PLAN_STEP_PHASES = ['gather', 'analyze', 'answer', 'mutate'] as const;
const LLM_INNER_PLAN_STEP_KINDS = [
  'tool',
  'host_tool',
  'summarize',
  'reason',
] as const;
const LLM_OUTER_PLAN_STEP_KINDS = [
  'skill',
  'tool',
  'host_tool',
  'summarize',
  'reason',
] as const;
const LLM_PLAN_STOP_WHEN = [
  'observation_non_empty',
  'observation_fetch_complete',
  'observation_has_fields',
  'always',
] as const;
const LLM_PLAN_DELIVERABLES = [
  'analysis',
  'list',
  'detail',
  'mutation',
  'answer',
] as const;

export const llmTaskPlanStepSchema = z.object({
  id: z.string().min(1).max(64),
  phase: z.enum(LLM_PLAN_STEP_PHASES),
  kind: z.enum(LLM_INNER_PLAN_STEP_KINDS),
  toolRole: z.string().nullable().optional(),
  hostToolNames: z.array(z.string().min(1).max(128)).nullable().optional(),
  objective: z.string().min(1).max(2000),
  stopWhen: z.enum(LLM_PLAN_STOP_WHEN).nullable().optional(),
});

export const llmOuterPlanStepSchema = z.object({
  id: z.string().min(1).max(64),
  phase: z.enum(LLM_PLAN_STEP_PHASES),
  kind: z.enum(LLM_OUTER_PLAN_STEP_KINDS),
  skillId: z.number().int().positive().nullable().optional(),
  toolRole: z.string().nullable().optional(),
  hostToolNames: z.array(z.string().min(1).max(128)).nullable().optional(),
  objective: z.string().min(1).max(2000),
  stopWhen: z.enum(LLM_PLAN_STOP_WHEN).nullable().optional(),
});

export const llmOuterPlanSchema = z.object({
  deliverable: z.enum(LLM_PLAN_DELIVERABLES),
  goal: z.string().min(1).max(500),
  steps: z.array(llmOuterPlanStepSchema).min(1).max(8),
});

export const llmTaskPlanSchema = z.object({
  deliverable: z.enum(LLM_PLAN_DELIVERABLES),
  goal: z.string().min(1).max(500),
  steps: z.array(llmTaskPlanStepSchema).min(1).max(8),
});

export type LlmTaskPlanOutput = z.infer<typeof llmTaskPlanSchema>;

const PLAN_SKILL_PROMPT_EXCERPT_CHARS = 1200;

export function readPlanSkillPromptExcerptChars(): number {
  return PLAN_SKILL_PROMPT_EXCERPT_CHARS;
}

function isConfiguredToolRole(value: string): value is ToolDecisionRole {
  return (TOOL_DECISION_ROLES as readonly string[]).includes(value);
}

function normalizeHostToolNamesForPlanStep(
  row: { hostToolNames?: string[] | null },
  scopedHostToolNames: Set<string>,
): string[] | null {
  if (scopedHostToolNames.size === 0) {
    return null;
  }
  const requested = (row.hostToolNames ?? [])
    .map((name) => name.trim())
    .filter(Boolean);
  const names =
    requested.length > 0
      ? requested.filter((name) => scopedHostToolNames.has(name))
      : [...scopedHostToolNames];
  return names.length > 0 ? names : null;
}

export type NormalizePlanStepsResult = {
  steps: TaskPlanStep[] | null;
  droppedHostToolStepIds: string[];
};

export function normalizeOuterLlmPlanSteps(
  raw: z.infer<typeof llmOuterPlanSchema>,
  scopedRoles: Set<ToolDecisionRole>,
  availableSkillIds: Set<number>,
  scopedHostToolNames: Set<string>,
): NormalizePlanStepsResult {
  const steps: TaskPlanStep[] = [];
  const droppedHostToolStepIds: string[] = [];
  for (const row of raw.steps) {
    const id = row.id.trim();
    const objective = row.objective.trim();
    if (!id || !objective) {
      return { steps: null, droppedHostToolStepIds };
    }
    if (row.kind === 'skill') {
      if (row.skillId == null || !availableSkillIds.has(row.skillId)) {
        return { steps: null, droppedHostToolStepIds };
      }
      steps.push({
        id,
        phase: row.phase,
        kind: 'skill',
        skillId: row.skillId,
        objective,
        ...(row.stopWhen ? { stopWhen: row.stopWhen } : {}),
      });
      continue;
    }
    if (row.kind === 'host_tool') {
      const hostToolNames = normalizeHostToolNamesForPlanStep(
        row,
        scopedHostToolNames,
      );
      if (!hostToolNames) {
        droppedHostToolStepIds.push(id);
        continue;
      }
      steps.push({
        id,
        phase: row.phase,
        kind: 'host_tool',
        hostToolNames,
        objective,
        ...(row.stopWhen ? { stopWhen: row.stopWhen } : {}),
      });
      continue;
    }
    let toolRole: ToolDecisionRole | undefined;
    if (row.kind === 'tool') {
      const roleRaw = row.toolRole?.trim();
      if (!roleRaw || !isConfiguredToolRole(roleRaw) || roleRaw === 'unknown') {
        return { steps: null, droppedHostToolStepIds };
      }
      if (!scopedRoles.has(roleRaw)) {
        return { steps: null, droppedHostToolStepIds };
      }
      toolRole = roleRaw;
    } else if (row.toolRole?.trim()) {
      const roleRaw = row.toolRole.trim();
      if (isConfiguredToolRole(roleRaw) && roleRaw !== 'unknown') {
        toolRole = roleRaw;
      }
    }
    steps.push({
      id,
      phase: row.phase,
      kind: row.kind,
      objective,
      ...(toolRole ? { toolRole } : {}),
      ...(row.stopWhen ? { stopWhen: row.stopWhen } : {}),
    });
  }
  return {
    steps: steps.length > 0 ? steps : null,
    droppedHostToolStepIds,
  };
}

export function normalizeLlmPlanSteps(
  raw: LlmTaskPlanOutput,
  scopedRoles: Set<ToolDecisionRole>,
  scopedHostToolNames: Set<string>,
): NormalizePlanStepsResult {
  const steps: TaskPlanStep[] = [];
  const droppedHostToolStepIds: string[] = [];
  for (const row of raw.steps) {
    const id = row.id.trim();
    const objective = row.objective.trim();
    if (!id || !objective) {
      return { steps: null, droppedHostToolStepIds };
    }
    if (row.kind === 'host_tool') {
      const hostToolNames = normalizeHostToolNamesForPlanStep(
        row,
        scopedHostToolNames,
      );
      if (!hostToolNames) {
        droppedHostToolStepIds.push(id);
        continue;
      }
      steps.push({
        id,
        phase: row.phase,
        kind: 'host_tool',
        hostToolNames,
        objective,
        ...(row.stopWhen ? { stopWhen: row.stopWhen } : { stopWhen: 'always' }),
      });
      continue;
    }
    let toolRole: ToolDecisionRole | undefined;
    if (row.kind === 'tool') {
      const roleRaw = row.toolRole?.trim();
      if (!roleRaw || !isConfiguredToolRole(roleRaw) || roleRaw === 'unknown') {
        return { steps: null, droppedHostToolStepIds };
      }
      if (!scopedRoles.has(roleRaw)) {
        return { steps: null, droppedHostToolStepIds };
      }
      toolRole = roleRaw;
    } else if (row.toolRole?.trim()) {
      const roleRaw = row.toolRole.trim();
      if (isConfiguredToolRole(roleRaw) && roleRaw !== 'unknown') {
        toolRole = roleRaw;
      }
    }
    const stopWhen = row.stopWhen ?? undefined;
    steps.push({
      id,
      phase: row.phase,
      kind: row.kind,
      objective,
      ...(toolRole ? { toolRole } : {}),
      ...(stopWhen ? { stopWhen } : {}),
    });
  }
  return {
    steps: steps.length > 0 ? steps : null,
    droppedHostToolStepIds,
  };
}

function buildPlanLlmUserPayload(input: ResolveTaskPlanInput): string {
  const skillPrompt = input.skillPrompt?.trim();
  const excerpt = skillPrompt
    ? skillPrompt.slice(0, readPlanSkillPromptExcerptChars())
    : null;
  const payload: Record<string, unknown> = {
    userMessage: input.userMessage.trim(),
    skill: input.skillApplied
      ? {
          name: input.skillName ?? null,
          description: input.skillDescription ?? null,
          promptExcerpt: excerpt,
        }
      : null,
    scopedTools: input.scopedToolSummaries.map((tool) => ({
      name: tool.name,
      role: tool.role,
    })),
    configuredDeliverable:
      parseSkillPlanConfig(input.skillConfig).deliverable ?? null,
  };
  if (input.sessionWorkingMemory) {
    payload.sessionWorkingMemory = input.sessionWorkingMemory;
  }
  if (input.availableHostTools && input.availableHostTools.length > 0) {
    payload.availableHostTools = input.availableHostTools;
  }
  return JSON.stringify(payload, null, 2);
}

function buildOuterPlanLlmUserPayload(input: ResolveOuterPlanInput): string {
  const payload: Record<string, unknown> = {
    userMessage: input.userMessage.trim(),
    scopedTools: input.scopedToolSummaries.map((tool) => ({
      name: tool.name,
      role: tool.role,
    })),
    availableSkills: input.availableSkills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      capabilityKey: skill.capabilityKey,
      riskLevel: skill.riskLevel,
      toolRoles: skill.toolRoles,
      hostToolIds: skill.hostToolIds,
      runnableKind: skill.runnableKind,
    })),
    planMode: 'outer_orchestration',
  };
  if (input.availableHostTools && input.availableHostTools.length > 0) {
    payload.availableHostTools = input.availableHostTools;
  }
  if (input.sessionWorkingMemory) {
    payload.sessionWorkingMemory = input.sessionWorkingMemory;
  }
  return JSON.stringify(payload, null, 2);
}

export function tryParseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

async function invokeLlmTaskPlan(input: {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  planInput: ResolveTaskPlanInput;
}): Promise<LlmTaskPlanOutput | null> {
  const systemPrompt = await input.promptRegistry.render(
    PROMPT_KEYS.AGENT_PLAN,
    input.scope,
  );
  const messages: LlmChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: buildPlanLlmUserPayload(input.planInput),
    },
  ];

  try {
    const { model } = await input.llmService.createLangChainChatModelForMessages(
      messages,
    );
    const structuredModel = model.withStructuredOutput(llmTaskPlanSchema);
    return (await structuredModel.invoke(messages)) as LlmTaskPlanOutput;
  } catch {
    const result = await input.llmService.chat({ messages, tools: [] });
    const parsed = tryParseJsonObject(result.content);
    if (!parsed) {
      return null;
    }
    const safe = llmTaskPlanSchema.safeParse(parsed);
    return safe.success ? safe.data : null;
  }
}

export async function tryBuildTaskPlanViaLlm(input: {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  planInput: ResolveTaskPlanInput;
}): Promise<ResolveTaskPlanResult | null> {
  const scopedRoles = new Set(
    input.planInput.scopedToolSummaries.map((tool) => tool.role),
  );
  const scopedHostToolNames = new Set(
    (input.planInput.availableHostTools ?? []).map((tool) => tool.name),
  );
  const llmRaw = await invokeLlmTaskPlan(input);
  if (!llmRaw) {
    return null;
  }

  const normalized = normalizeLlmPlanSteps(llmRaw, scopedRoles, scopedHostToolNames);
  if (!normalized.steps) {
    return null;
  }

  const userMessage = input.planInput.userMessage.trim();
  const plan = buildPlanSnapshot({
    source: 'llm',
    userMessage,
    goal: resolvePlanGoal({ userMessage }),
    deliverable: alignDeliverableWithScopedTools(
      llmRaw.deliverable as TaskDeliverable,
      input.planInput.scopedToolSummaries,
    ),
    steps: normalized.steps,
    constraints: resolveSkillCapabilityConstraints({
      skillDescription: input.planInput.skillDescription,
      skillName: input.planInput.skillName,
    }),
  });

  return {
    plan,
    method: 'llm',
    droppedHostToolStepIds: normalized.droppedHostToolStepIds,
  };
}

async function invokeLlmOuterPlan(input: {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  planInput: ResolveOuterPlanInput;
}): Promise<z.infer<typeof llmOuterPlanSchema> | null> {
  const systemPrompt = await input.promptRegistry.render(
    PROMPT_KEYS.AGENT_PLAN,
    input.scope,
  );
  const messages: LlmChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: buildOuterPlanLlmUserPayload(input.planInput),
    },
  ];
  try {
    const { model } = await input.llmService.createLangChainChatModelForMessages(
      messages,
    );
    const structuredModel = model.withStructuredOutput(llmOuterPlanSchema);
    return (await structuredModel.invoke(messages)) as z.infer<
      typeof llmOuterPlanSchema
    >;
  } catch {
    const result = await input.llmService.chat({ messages, tools: [] });
    const parsed = tryParseJsonObject(result.content);
    if (!parsed) {
      return null;
    }
    const safe = llmOuterPlanSchema.safeParse(parsed);
    return safe.success ? safe.data : null;
  }
}

export async function tryBuildOuterPlanViaLlm(input: {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  planInput: ResolveOuterPlanInput;
}): Promise<ResolveTaskPlanResult | null> {
  const scopedRoles = new Set(
    input.planInput.scopedToolSummaries.map((tool) => tool.role),
  );
  const availableSkillIds = new Set(
    input.planInput.availableSkills.map((skill) => skill.id),
  );
  const scopedHostToolNames = new Set(
    (input.planInput.availableHostTools ?? []).map((tool) => tool.name),
  );
  const llmRaw = await invokeLlmOuterPlan(input);
  if (!llmRaw) {
    return null;
  }
  const normalized = normalizeOuterLlmPlanSteps(
    llmRaw,
    scopedRoles,
    availableSkillIds,
    scopedHostToolNames,
  );
  if (!normalized.steps) {
    return null;
  }
  const userMessage = input.planInput.userMessage.trim();
  const plan = buildPlanSnapshot({
    source: 'llm',
    userMessage,
    goal: resolvePlanGoal({ userMessage }),
    deliverable: alignDeliverableWithScopedTools(
      llmRaw.deliverable as TaskDeliverable,
      input.planInput.scopedToolSummaries,
    ),
    steps: normalized.steps,
    constraints: [],
  });
  return {
    plan,
    method: 'llm',
    droppedHostToolStepIds: normalized.droppedHostToolStepIds,
  };
}

function outerPlanInputAsBuildTaskPlan(
  planInput: ResolveOuterPlanInput,
): BuildTaskPlanInput {
  return {
    userMessage: planInput.userMessage,
    scopedToolSummaries: planInput.scopedToolSummaries,
    skillApplied: false,
  };
}

/**
 * 外层 Plan：编排 kind=skill 复合步（进入 skill 后由内层帧展开 tool/summarize 步）。
 */
export async function resolveOuterPlan(input: {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  planInput: ResolveOuterPlanInput;
}): Promise<ResolveTaskPlanResult> {
  const scopedSummaries = input.planInput.scopedToolSummaries;
  const hasWrite = scopedToolsIncludeWrite(scopedSummaries);
  const userMessage = input.planInput.userMessage.trim();
  const requestedSkillId = input.planInput.requestedSkillId;

  if (requestedSkillId != null) {
    return resolveRequestedSkillOuterPlan(input.planInput);
  }

  const llmResult = await tryBuildOuterPlanViaLlm(input);
  if (llmResult) {
    if (
      shouldReplacePlanWithMutationTemplate(llmResult.plan, hasWrite)
    ) {
      return buildDeterministicMutationPlanResult({
        userMessage,
        goal: llmResult.plan.goal,
        scopedToolSummaries: scopedSummaries,
        llmFallbackReason: 'mutation_template_forced',
      });
    }
    return llmResult;
  }

  const plan = buildTaskPlan(outerPlanInputAsBuildTaskPlan(input.planInput));
  return {
    plan,
    method: plan.source,
    llmFallbackReason: 'outer_plan_llm_failed',
  };
}

/**
 * 内层 Plan（skill 帧展开）：skill.config.workflow / 模板 / 内层 LLM。
 * 1. skill.config.workflow（显式步序，mutation 须合规）
 * 2. mutation 场景 → 确定性 compose_write → present → write → confirm 模板
 * 3. Plan LLM（不合规 mutation 步序则替换为模板）
 * 4. 规则 template / minimal 兜底
 */
export async function resolveTaskPlan(input: {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  planInput: ResolveTaskPlanInput;
}): Promise<ResolveTaskPlanResult> {
  const planConfig = parseSkillPlanConfig(input.planInput.skillConfig);

  // ① skill.config.workflow：显式步序，校验通过则直接采用（不调 LLM）
  if (planConfig.workflowSteps && planConfig.workflowSteps.length > 0) {
    const workflowPlan = buildTaskPlan(input.planInput);
    if (workflowPlan.source === 'workflow') {
      return { plan: workflowPlan, method: 'workflow' };
    }
  }

  // ② scoped 含 write：固定 compose_write → present → write → confirm 模板
  if (shouldUseDeterministicMutationPlan(input.planInput)) {
    const goal =
      input.planInput.skillDescription?.trim() ||
      input.planInput.skillName?.trim() ||
      input.planInput.userMessage.trim() ||
      'Complete the user request';
    return buildDeterministicMutationPlanResult({
      userMessage: input.planInput.userMessage.trim(),
      goal,
      scopedToolSummaries: input.planInput.scopedToolSummaries,
    });
  }

  // ③ Plan LLM；不合规 mutation 步序则替换为模板
  const llmResult = await tryBuildTaskPlanViaLlm(input);
  if (llmResult) {
    const hasWrite = scopedToolsIncludeWrite(
      input.planInput.scopedToolSummaries,
    );
    if (
      shouldReplacePlanWithMutationTemplate(
        llmResult.plan,
        hasWrite,
        input.planInput,
      )
    ) {
      return buildDeterministicMutationPlanResult({
        userMessage: input.planInput.userMessage.trim(),
        goal: llmResult.plan.goal,
        scopedToolSummaries: input.planInput.scopedToolSummaries,
        llmFallbackReason: 'mutation_template_forced',
      });
    }
    return llmResult;
  }

  // ④ 规则 template / minimal 兜底
  const plan = buildTaskPlan(input.planInput);
  return {
    plan,
    method: plan.source,
    llmFallbackReason: 'llm_plan_failed',
  };
}
