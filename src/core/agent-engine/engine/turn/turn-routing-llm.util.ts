import { z } from 'zod';
import type { LlmService } from '../../../llm/llm.service';
import type { LlmChatMessage } from '../../../llm/llm.types';
import type { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import { PROMPT_KEYS } from '../../../prompt/prompt-template.keys';
import { tryParseJsonObject } from '../main/plan/task-plan-llm.util';
import {
  buildTurnRouteFallbackDecision,
  buildTurnRouteLlmUserPayload,
} from './turn-routing.util';
import type { TurnRouteLlmInput, TurnRoutingDecision } from './turn-routing.types';

const turnRouteSchema = z.object({
  route: z.enum(['direct_answer', 'on_page_task', 'orchestrated_task']),
  reason: z.string().min(1).max(500),
  suggestedSkillId: z.number().int().positive().nullable(),
  pageContextApplies: z.boolean(),
  pageContextTaskKind: z.enum(['analyze', 'answer', 'mutation', 'none']),
});

async function invokeTurnRouteLlm(input: {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  routeInput: TurnRouteLlmInput;
}): Promise<z.infer<typeof turnRouteSchema> | null> {
  const systemPrompt = await input.promptRegistry.render(
    PROMPT_KEYS.AGENT_TURN_ROUTE,
    input.scope,
  );
  const messages: LlmChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: buildTurnRouteLlmUserPayload(input.routeInput),
    },
  ];
  try {
    const { model } = await input.llmService.createLangChainChatModelForMessages(
      messages,
    );
    const structuredModel = model.withStructuredOutput(turnRouteSchema);
    return (await structuredModel.invoke(messages)) as z.infer<
      typeof turnRouteSchema
    >;
  } catch {
    const result = await input.llmService.chat({ messages, tools: [] });
    const parsed = tryParseJsonObject(result.content);
    if (!parsed) {
      return null;
    }
    const safe = turnRouteSchema.safeParse(parsed);
    return safe.success ? safe.data : null;
  }
}

export async function resolveTurnRoute(input: {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  routeInput: TurnRouteLlmInput;
}): Promise<TurnRoutingDecision> {
  const llmRaw = await invokeTurnRouteLlm(input);
  if (!llmRaw) {
    return buildTurnRouteFallbackDecision({
      reason: 'turn_route_llm_failed',
    });
  }
  const availableSkillIds = new Set(
    input.routeInput.availableSkills.map((skill) => skill.id),
  );
  const onPageSuggestedSkillId = ((): number | null => {
    if (llmRaw.route !== 'on_page_task') {
      return null;
    }
    const requested = input.routeInput.requestedSkill;
    if (requested && availableSkillIds.has(requested.id)) {
      return requested.id;
    }
    const candidate = input.routeInput.pageHostSkillCandidate;
    if (candidate && availableSkillIds.has(candidate.id)) {
      return candidate.id;
    }
    return null;
  })();
  const suggestedSkillId =
    llmRaw.suggestedSkillId != null &&
    availableSkillIds.has(llmRaw.suggestedSkillId)
      ? llmRaw.suggestedSkillId
      : onPageSuggestedSkillId;
  return {
    route: llmRaw.route,
    method: 'llm',
    reason: llmRaw.reason.trim(),
    suggestedSkillId,
    pageContextApplies: llmRaw.pageContextApplies,
    pageContextTaskKind: llmRaw.pageContextApplies
      ? llmRaw.pageContextTaskKind
      : 'none',
  };
}
