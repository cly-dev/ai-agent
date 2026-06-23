import { z } from 'zod';
import type { LlmService } from '../../../llm/llm.service';
import type { LlmChatMessage } from '../../../llm/llm.types';
import type { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import { PROMPT_KEYS } from '../../../prompt/prompt-template.keys';
import type { TurnRespondMissingField } from './turn-respond.types';
import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import { formatPageContextPromptBlock } from '../../../host-bridge/page-context.prompt.util';

const readinessSlotSchema = z.object({
  ready: z.boolean(),
  missingFields: z
    .array(
      z.object({
        name: z.string().min(1),
        hint: z.string().min(1),
      }),
    )
    .optional()
    .default([]),
});

export type ReadinessSlotLlmResult = z.infer<typeof readinessSlotSchema>;

export async function evaluateReadinessSlotsWithLlm(input: {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  userMessage: string;
  planGoal?: string | null;
  currentObjective?: string | null;
  requiredFields: string[];
  sessionObservationSummary?: string | null;
  pageContext?: AgentChatPageContext | null;
}): Promise<ReadinessSlotLlmResult> {
  const systemPrompt = await input.promptRegistry.render(
    PROMPT_KEYS.AGENT_READINESS_SLOT_CHECK,
    input.scope,
  );
  const pageContextBlock = formatPageContextPromptBlock(input.pageContext);
  const messages: LlmChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        `User message: ${input.userMessage}`,
        pageContextBlock,
        input.planGoal ? `Plan goal: ${input.planGoal}` : null,
        input.currentObjective
          ? `Current objective: ${input.currentObjective}`
          : null,
        `Required business fields: ${JSON.stringify(input.requiredFields)}`,
        input.sessionObservationSummary
          ? `Session observation summary:\n${input.sessionObservationSummary}`
          : 'Session observation summary: (none)',
      ]
        .filter((line): line is string => line != null && line.length > 0)
        .join('\n'),
    },
  ];
  const result = await input.llmService.chat({
    messages,
    tools: [],
    temperature: 0,
    maxTokens: 512,
  });
  const parsed = extractJsonObject(result.content);
  const validated = readinessSlotSchema.safeParse(parsed);
  if (!validated.success) {
    return { ready: true, missingFields: [] };
  }
  return validated.data;
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as unknown;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function normalizeMissingFieldsFromLlm(
  rows: TurnRespondMissingField[] | undefined,
): TurnRespondMissingField[] {
  if (!rows?.length) {
    return [];
  }
  const deduped = new Map<string, TurnRespondMissingField>();
  for (const row of rows) {
    const name = row.name.trim();
    const hint = row.hint.trim();
    if (!name || !hint) {
      continue;
    }
    deduped.set(name, { name, hint });
  }
  return [...deduped.values()];
}
