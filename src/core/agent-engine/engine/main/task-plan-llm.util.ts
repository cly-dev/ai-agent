import { z } from 'zod';
import type { LlmService } from '../../../llm/llm.service';
import type { LlmChatMessage } from '../../../llm/llm.types';
import type { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import { PROMPT_KEYS } from '../../../prompt/prompt-template.keys';
import {
  TOOL_DECISION_ROLES,
  type ToolDecisionRole,
} from '../../../tool-engine/tool-decision-role.enum';
import type {
  ResolveTaskPlanInput,
  ResolveTaskPlanResult,
  TaskDeliverable,
  TaskPlanStep,
} from './task-plan.types';
import {
  alignDeliverableWithScopedTools,
  buildPlanSnapshot,
  buildTaskPlan,
  llmPlanMissingRequiredWriteStep,
  parseSkillPlanConfig,
  shouldUseDeterministicMutationReplyPlan,
} from './task-plan.util';

const LLM_PLAN_STEP_PHASES = ['gather', 'analyze', 'answer', 'mutate'] as const;
const LLM_PLAN_STEP_KINDS = ['tool', 'summarize', 'reason'] as const;
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
  kind: z.enum(LLM_PLAN_STEP_KINDS),
  toolRole: z.string().nullable().optional(),
  objective: z.string().min(1).max(2000),
  stopWhen: z.enum(LLM_PLAN_STOP_WHEN).nullable().optional(),
});

export const llmTaskPlanSchema = z.object({
  deliverable: z.enum(LLM_PLAN_DELIVERABLES),
  goal: z.string().min(1).max(500),
  steps: z.array(llmTaskPlanStepSchema).min(1).max(8),
});

export type LlmTaskPlanOutput = z.infer<typeof llmTaskPlanSchema>;

export function isPlanLlmEnabled(): boolean {
  return process.env.PLAN_LLM !== '0';
}

export function readPlanSkillPromptExcerptChars(): number {
  const raw = process.env.PLAN_SKILL_PROMPT_EXCERPT_CHARS?.trim();
  const value = raw ? Number.parseInt(raw, 10) : 1200;
  return Number.isFinite(value) && value > 0 ? value : 1200;
}

function isConfiguredToolRole(value: string): value is ToolDecisionRole {
  return (TOOL_DECISION_ROLES as readonly string[]).includes(value);
}

function normalizeLlmPlanSteps(
  raw: LlmTaskPlanOutput,
  scopedRoles: Set<ToolDecisionRole>,
): TaskPlanStep[] | null {
  const steps: TaskPlanStep[] = [];
  for (const row of raw.steps) {
    const id = row.id.trim();
    const objective = row.objective.trim();
    if (!id || !objective) {
      return null;
    }
    let toolRole: ToolDecisionRole | undefined;
    if (row.kind === 'tool') {
      const roleRaw = row.toolRole?.trim();
      if (!roleRaw || !isConfiguredToolRole(roleRaw) || roleRaw === 'unknown') {
        return null;
      }
      if (!scopedRoles.has(roleRaw)) {
        return null;
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
  return steps.length > 0 ? steps : null;
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
  return JSON.stringify(payload, null, 2);
}

function tryParseJsonObject(value: string): Record<string, unknown> | null {
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
  if (!isPlanLlmEnabled()) {
    return null;
  }

  const scopedRoles = new Set(
    input.planInput.scopedToolSummaries.map((tool) => tool.role),
  );
  const llmRaw = await invokeLlmTaskPlan(input);
  if (!llmRaw) {
    return null;
  }

  const steps = normalizeLlmPlanSteps(llmRaw, scopedRoles);
  if (!steps) {
    return null;
  }

  const userMessage = input.planInput.userMessage.trim();
  const plan = buildPlanSnapshot({
    source: 'llm',
    userMessage,
    goal: llmRaw.goal.trim(),
    deliverable: alignDeliverableWithScopedTools(
      llmRaw.deliverable as TaskDeliverable,
      input.planInput.scopedToolSummaries,
    ),
    steps,
    constraints: [],
  });

  return { plan, method: 'llm' };
}

/**
 * Plan 解析优先级：
 * 1. skill.config.workflow（显式步序）
 * 2. 回复类 Skill（read-detail + write）→ 规则模板 read→write→summarize
 * 3. Plan LLM（须含 write 步，否则丢弃）
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

  // ② 回复类 Skill（read-detail + write）：固定 read → write → summarize 模板
  if (shouldUseDeterministicMutationReplyPlan(input.planInput)) {
    const plan = buildTaskPlan(input.planInput);
    return {
      plan,
      method: plan.source === 'workflow' ? 'workflow' : 'template',
    };
  }

  // ③ Plan LLM（`PLAN_LLM=0` 时跳过）；缺 write 步则视为无效
  const llmResult = await tryBuildTaskPlanViaLlm(input);
  if (
    llmResult &&
    !llmPlanMissingRequiredWriteStep(llmResult.plan.steps, input.planInput)
  ) {
    return llmResult;
  }

  // ④ 规则 template / minimal 兜底，并记录 LLM 未采用原因
  const plan = buildTaskPlan(input.planInput);
  return {
    plan,
    method: plan.source,
    llmFallbackReason:
      llmResult && llmPlanMissingRequiredWriteStep(llmResult.plan.steps, input.planInput)
        ? 'llm_plan_missing_write_step'
        : isPlanLlmEnabled()
          ? 'llm_plan_failed'
          : 'llm_plan_disabled',
  };
}
