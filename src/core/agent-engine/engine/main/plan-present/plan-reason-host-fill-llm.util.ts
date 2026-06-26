import { z } from 'zod';
import type { LlmService } from '../../../../llm/llm.service';
import type { LlmChatMessage } from '../../../../llm/llm.types';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import { PROMPT_KEYS } from '../../../../prompt/prompt-template.keys';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import {
  formatSplitToolObservationsForSummarize,
  isSplitToolObservationsOutput,
  resolvePrimaryObservationForSummarize,
} from '../../observation-format.util';
import type { ToolObservation } from '../types/agent-engine.types';
import type { PlanHostFillEntry } from './plan-host-fill.util';
import { summarizeHostToolsForReasonFillPrompt } from './plan-host-fill.util';

const planHostFillLlmSchema = z.object({
  fills: z
    .array(
      z.object({
        tool: z.string().min(1),
        arguments: z.record(z.string(), z.unknown()),
      }),
    )
    .min(1),
});

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // continue
    }
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPlanReasonHostFillUserContent(input: {
  userMessage: string;
  planContext: string | null;
  hostTools: HostToolDecisionDefinition[];
  splitObservationsText: string | null;
  serializedOutput: string;
}): string {
  return [
    `User request: ${input.userMessage}`,
    input.planContext
      ? `<plan_context>\n${input.planContext}\n</plan_context>`
      : null,
    `<host_tools>\n${summarizeHostToolsForReasonFillPrompt(input.hostTools)}\n</host_tools>`,
    input.splitObservationsText
      ? `Tool observations (prefer current_run_observations for the latest request):\n${input.splitObservationsText}`
      : `Context: ${input.serializedOutput}`,
  ]
    .filter((line): line is string => line != null && line.length > 0)
    .join('\n');
}

export async function renderPlanReasonHostFillSystemPrompt(input: {
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
}): Promise<string> {
  return input.promptRegistry.render(
    PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_REASON_HOST_FILL,
    input.scope,
  );
}

export async function invokePlanReasonHostFillMachineLayer(input: {
  llmService: LlmService;
  agentPrompts: LlmChatMessage[];
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  userContext: string;
  allowedToolNames: Set<string>;
  logWarn?: (message: string) => void;
}): Promise<PlanHostFillEntry[]> {
  const messages: LlmChatMessage[] = [...input.agentPrompts];
  messages.push({
    role: 'system',
    content: await renderPlanReasonHostFillSystemPrompt({
      promptRegistry: input.promptRegistry,
      scope: input.scope,
    }),
  });
  messages.push({
    role: 'user',
    content: input.userContext,
  });
  try {
    const result = await input.llmService.chat({ messages, tools: [] });
    const raw = (result.content ?? '').trim();
    const parsed = extractJsonObject(raw);
    const validated = planHostFillLlmSchema.safeParse(parsed);
    if (!validated.success) {
      input.logWarn?.(
        `plan reason host fill parse failed: ${validated.error.message}`,
      );
      return [];
    }
    return validated.data.fills
      .map((row) => ({
        tool: row.tool.trim(),
        arguments: row.arguments,
      }))
      .filter(
        (row) => row.tool.length > 0 && input.allowedToolNames.has(row.tool),
      );
  } catch (error) {
    input.logWarn?.(
      `plan reason host fill llm failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return [];
  }
}

export function resolveReasonHostFillObservationPayload(input: {
  mergedObservation: ToolObservation;
  toolObservations: ToolObservation[];
}): {
  splitObservationsText: string | null;
  serializedOutput: string;
} {
  const splitOutput = isSplitToolObservationsOutput(input.mergedObservation.output)
    ? input.mergedObservation.output
    : null;
  const primaryObservation = splitOutput
    ? resolvePrimaryObservationForSummarize(splitOutput)
    : null;
  const primaryOutput = primaryObservation?.output ?? input.mergedObservation.output;
  return {
    splitObservationsText: splitOutput
      ? formatSplitToolObservationsForSummarize(splitOutput)
      : null,
    serializedOutput: JSON.stringify(primaryOutput),
  };
}
