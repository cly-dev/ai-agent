import type { LlmService } from '../../../llm/llm.service';
import type { LlmChatMessage } from '../../../llm/llm.types';
import type { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import { PROMPT_KEYS } from '../../../prompt/prompt-template.keys';
import { extractLlmUserFacingText } from '../llm-output-sanitize.util';
import type { PlanComposeWriteObservationOutput } from './plan-compose-write.util';

export function buildPlanDraftSummarizeUserContent(input: {
  userMessage: string;
  planContext: string | null;
  toolSchemaJson: string;
  writeToolNames: string[];
  writeToolDescriptions: string;
  toolName: string;
  toolDescription?: string;
  fieldLabelText?: string;
  splitObservationsText: string | null;
  serializedOutput: string;
  composedWritePayload?: PlanComposeWriteObservationOutput | null;
}): string {
  const composedBlock = input.composedWritePayload
    ? `<pending_write_tool_call>\n${JSON.stringify({
        tool: input.composedWritePayload.tool,
        arguments: input.composedWritePayload.arguments,
      })}\n</pending_write_tool_call>`
    : null;
  return [
    `User request: ${input.userMessage}`,
    input.planContext
      ? `<plan_context>\n${input.planContext}\n</plan_context>`
      : null,
    composedBlock,
    `<tool_schema>\n${input.toolSchemaJson}\n</tool_schema>`,
    input.writeToolNames.length > 0
      ? `Write tool(s): ${input.writeToolNames.join(', ')}`
      : `Tool: ${input.toolName}`,
    input.writeToolDescriptions
      ? `Tool description:\n${input.writeToolDescriptions}`
      : input.toolDescription
        ? `Tool description: ${input.toolDescription}`
        : null,
    input.fieldLabelText ? `Field labels:\n${input.fieldLabelText}` : null,
    input.splitObservationsText
      ? `Tool observations (prefer current_run_observations for the latest request):\n${input.splitObservationsText}`
      : `Tool result: ${input.serializedOutput}`,
  ]
    .filter((line): line is string => line != null && line.length > 0)
    .join('\n');
}

export async function renderPlanDraftProseSupplementSystemPrompt(input: {
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
}): Promise<string> {
  return input.promptRegistry.render(
    PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_DRAFT_PROSE_SUPPLEMENT,
    input.scope,
  );
}

export async function renderPlanPresentFromComposeSystemPrompt(input: {
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
}): Promise<string> {
  return input.promptRegistry.render(
    PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_PRESENT_FROM_COMPOSE,
    input.scope,
  );
}

/** present 步：基于已 compose 的机器层 payload 生成用户可见 Markdown。 */
export async function invokePlanPresentFromCompose(input: {
  llmService: LlmService;
  agentPrompts: LlmChatMessage[];
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  userContext: string;
  logWarn?: (message: string) => void;
  onExplainDelta?: (delta: string) => void;
}): Promise<string> {
  const messages: LlmChatMessage[] = [...input.agentPrompts];
  messages.push({
    role: 'system',
    content: await renderPlanPresentFromComposeSystemPrompt({
      promptRegistry: input.promptRegistry,
      scope: input.scope,
    }),
  });
  messages.push({
    role: 'user',
    content: input.userContext,
  });
  try {
    const result = await input.llmService.streamChat(
      { messages, tools: [] },
      {
        onDelta: (delta) => {
          if (delta.contentDelta) {
            input.onExplainDelta?.(delta.contentDelta);
          }
        },
      },
    );
    return extractLlmUserFacingText(result.content ?? '').trim();
  } catch (error) {
    input.logWarn?.(
      `plan present from compose failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return '';
  }
}

/** 补轮：compose 无正文类字段时，生成拟回复正文（无 tool_calls）。 */
export async function invokePlanDraftProseSupplement(input: {
  llmService: LlmService;
  agentPrompts: LlmChatMessage[];
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  userContext: string;
  logWarn?: (message: string) => void;
}): Promise<string> {
  const messages: LlmChatMessage[] = [...input.agentPrompts];
  messages.push({
    role: 'system',
    content: await renderPlanDraftProseSupplementSystemPrompt({
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
    return extractLlmUserFacingText(result.content ?? '').trim();
  } catch (error) {
    input.logWarn?.(
      `plan draft prose supplement failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return '';
  }
}
