import { z } from 'zod';
import type { LlmService } from '../../llm/llm.service';
import type { LlmChatMessage } from '../../llm/llm.types';
import { tryParseJsonObject } from '../../agent-engine/engine/main/plan/task-plan-llm.util';
import type { DetectCluesOutput, WorkflowClueDef } from '../workflow.types';
import { normalizeDetectCluesOutput } from './detect-clues-output.util';

const detectClueItemSchema = z.object({
  key: z.string().min(1),
  matched: z.boolean(),
  confidence: z.number().min(0).max(1),
  value: z.string().nullable(),
  reason: z.string().min(1).max(500),
});

const detectCluesSchema = z.object({
  clues: z.array(detectClueItemSchema),
});

// 产品语义：状态识别（多选）。协议字段仍为 clue*，与 edges[].clue 对齐。
const DETECT_CLUES_SYSTEM = `You classify which configured business STATES apply to the given context.
The catalog lists independent states (intent/category/flags). For EVERY catalog key, output one result with:
- matched: true only if that state clearly holds
- confidence: 0..1 self-assessed confidence
- value: optional short extracted detail when useful (e.g. an id), otherwise null
- reason: short justification (do not dump the full context)
Multiple states MAY be matched at once unless the objective/hint says they are mutually exclusive.
Obey exclusivity rules in hint/descriptions when stated (e.g. spam vs business intents).
Do not invent keys outside the catalog. Prefer false when uncertain.`;

export function buildDetectCluesUserPayload(input: {
  objective: string;
  hint?: string;
  clues: WorkflowClueDef[];
  userMessage: string;
  pageContextSummary: string;
  priorOutputsSummary: string;
}): string {
  return JSON.stringify(
    {
      objective: input.objective,
      hint: input.hint ?? null,
      // stateCatalog：运营配置的多状态；JSON 键名仍服务结构化输出对齐
      stateCatalog: input.clues.map((row) => ({
        key: row.key,
        description: row.description,
      })),
      userMessage: input.userMessage,
      pageContext: input.pageContextSummary,
      priorNodeOutputs: input.priorOutputsSummary,
    },
    null,
    2,
  );
}

export async function invokeDetectCluesLlm(input: {
  llmService: LlmService;
  objective: string;
  hint?: string;
  clues: WorkflowClueDef[];
  userMessage: string;
  pageContextSummary: string;
  priorOutputsSummary: string;
}): Promise<DetectCluesOutput | null> {
  const configuredKeys = input.clues.map((row) => row.key);
  if (configuredKeys.length === 0) {
    return { clues: [], matchedClueKeys: [] };
  }

  const messages: LlmChatMessage[] = [
    { role: 'system', content: DETECT_CLUES_SYSTEM },
    {
      role: 'user',
      content: buildDetectCluesUserPayload(input),
    },
  ];

  let rawClues: z.infer<typeof detectClueItemSchema>[] = [];
  try {
    const { model, messages: fittedMessages } =
      await input.llmService.createLangChainChatModelForMessages(messages, {
        budgetHints: { callKind: 'routing' },
      });
    const structuredModel = model.withStructuredOutput(detectCluesSchema);
    const parsed = (await structuredModel.invoke(fittedMessages)) as z.infer<
      typeof detectCluesSchema
    >;
    rawClues = parsed.clues;
  } catch {
    try {
      const result = await input.llmService.chat({
        messages,
        tools: [],
        budgetHints: { callKind: 'routing' },
      });
      const parsed = tryParseJsonObject(result.content);
      if (!parsed) {
        return null;
      }
      const safe = detectCluesSchema.safeParse(parsed);
      if (!safe.success) {
        return null;
      }
      rawClues = safe.data.clues;
    } catch {
      return null;
    }
  }

  const normalized = normalizeDetectCluesOutput({
    configuredKeys,
    rawClues,
  });
  return normalized;
}
