import type { LlmChatMessage } from '../llm.types';
import type { PromptBlock, PromptBlockKind } from './prompt-budget.types';
import {
  BLOCK_MAX_DEGRADE,
  BLOCK_PRIORITY,
} from './prompt-budget.constants';
import {
  parseObservationsJson,
  resolveObservationBlockPayload,
} from './observation-degrade.util';

let compositeBlockIdCounter = 0;

function nextCompositeBlockId(kind: PromptBlockKind, messageIndex: number): string {
  compositeBlockIdCounter += 1;
  return `${kind}:${messageIndex}:c${compositeBlockIdCounter}`;
}

function extractTaggedContent(content: string, tag: string): string | null {
  const open = `<${tag}>`;
  const close = `</${tag}>`;
  const start = content.indexOf(open);
  if (start < 0) {
    return null;
  }
  const end = content.indexOf(close, start + open.length);
  if (end < 0) {
    return null;
  }
  return content.slice(start, end + close.length);
}

function extractTaggedInner(content: string, tag: string): string | null {
  const open = `<${tag}>`;
  const close = `</${tag}>`;
  const start = content.indexOf(open);
  if (start < 0) {
    return null;
  }
  const end = content.indexOf(close, start + open.length);
  if (end < 0) {
    return null;
  }
  return content.slice(start + open.length, end).trim();
}

function createCompositeBlock(input: {
  kind: PromptBlockKind;
  role: LlmChatMessage['role'];
  payload: PromptBlock['payload'];
  sourceMessageIndex: number;
  toolCallId?: string;
}): PromptBlock {
  return {
    id: nextCompositeBlockId(input.kind, input.sourceMessageIndex),
    kind: input.kind,
    priority: BLOCK_PRIORITY[input.kind],
    degradeLevel: 0,
    maxDegradeLevel: BLOCK_MAX_DEGRADE[input.kind],
    role: input.role,
    toolCallId: input.toolCallId,
    payload: input.payload,
    sourceMessageIndex: input.sourceMessageIndex,
  };
}

function extractUserRequestSection(content: string): string | null {
  const tagged = extractTaggedContent(content, 'current_user_request');
  if (tagged) {
    return tagged;
  }
  const firstLine = content.split('\n')[0]?.trim() ?? '';
  if (!firstLine.startsWith('User request:')) {
    return null;
  }
  return firstLine;
}

function stripObservationsRegion(content: string): string {
  let working = content;
  for (const tag of ['working_memory_observations', 'current_run_observations'] as const) {
    const open = `<${tag}>`;
    const close = `</${tag}>`;
    let start = working.indexOf(open);
    while (start >= 0) {
      const end = working.indexOf(close, start + open.length);
      if (end < 0) {
        break;
      }
      working = `${working.slice(0, start)}${working.slice(end + close.length)}`;
      start = working.indexOf(open);
    }
  }
  return working
    .replace(
      /Tool observations \(prefer current_run_observations for the latest request\):\s*/gi,
      '',
    )
    .trim();
}

function stripTaggedRegion(content: string, tag: string): string {
  const tagged = extractTaggedContent(content, tag);
  if (!tagged) {
    return content;
  }
  return content.replace(tagged, '').trim();
}

function tryParseInlineToolResult(content: string): PromptBlock['payload'] | null {
  const match = content.match(/Tool result:\s*([\s\S]+)/i);
  if (!match?.[1]?.trim()) {
    return null;
  }
  const body = match[1].trim();
  const asObservations = parseObservationsJson(body);
  if (asObservations.length > 0) {
    return { type: 'observations', observations: asObservations };
  }
  try {
    const parsed = JSON.parse(body) as unknown;
    if (Array.isArray(parsed)) {
      return {
        type: 'observations',
        observations: [
          {
            tool: 'tool_result',
            success: true,
            records: parsed.filter(
              (row): row is Record<string, unknown> =>
                row != null && typeof row === 'object' && !Array.isArray(row),
            ),
            summary: { matchedCount: parsed.length },
          },
        ],
      };
    }
    if (parsed != null && typeof parsed === 'object') {
      return {
        type: 'observations',
        observations: [
          {
            tool: 'tool_result',
            success: true,
            records: [parsed as Record<string, unknown>],
            summary: { matchedCount: 1 },
          },
        ],
      };
    }
  } catch {
    // fall through
  }
  return {
    type: 'text',
    text: `Tool result: ${body}`,
  };
}

export function isCompositeSummarizeUserMessage(content: string): boolean {
  return (
    content.includes('User request:') ||
    content.includes('<plan_context>') ||
    content.includes('<tool_schema>') ||
    content.includes('<pending_write_tool_call>') ||
    /Tool result:/i.test(content) ||
    (content.includes('<working_memory_observations>') &&
      (content.includes('User request:') || content.includes('<plan_context>')))
  );
}

/** Summarize / plan-present 等：单条 user 消息内混合 request、plan、observations。 */
export function parseCompositeUserMessage(
  message: LlmChatMessage,
  messageIndex: number,
): PromptBlock[] {
  compositeBlockIdCounter = 0;
  const content = message.content;
  const blocks: PromptBlock[] = [];

  const userRequest = extractUserRequestSection(content);
  if (userRequest) {
    blocks.push(
      createCompositeBlock({
        kind: 'current_user_request',
        role: message.role,
        payload: { type: 'text', text: userRequest },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  const planContext = extractTaggedContent(content, 'plan_context');
  if (planContext) {
    blocks.push(
      createCompositeBlock({
        kind: 'plan_context',
        role: message.role,
        payload: { type: 'text', text: planContext },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  const pageContext = extractTaggedContent(content, 'page_context');
  if (pageContext) {
    blocks.push(
      createCompositeBlock({
        kind: 'page_context',
        role: message.role,
        payload: { type: 'text', text: pageContext },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  const toolSchemaInner = extractTaggedInner(content, 'tool_schema');
  if (toolSchemaInner != null) {
    blocks.push(
      createCompositeBlock({
        kind: 'tool_schema',
        role: message.role,
        payload: { type: 'tool_schema', json: toolSchemaInner },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  const hostToolSchemaInner = extractTaggedInner(content, 'host_tool_schema');
  if (hostToolSchemaInner != null) {
    blocks.push(
      createCompositeBlock({
        kind: 'host_tool_schema',
        role: message.role,
        payload: { type: 'tool_schema', json: hostToolSchemaInner },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  const pendingWrite = extractTaggedContent(content, 'pending_write_tool_call');
  if (pendingWrite) {
    blocks.push(
      createCompositeBlock({
        kind: 'pending_write_tool_call',
        role: message.role,
        payload: { type: 'text', text: pendingWrite },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  const workingRaw = extractTaggedInner(content, 'working_memory_observations');
  if (workingRaw != null) {
    blocks.push(
      createCompositeBlock({
        kind: 'working_memory_observations',
        role: message.role,
        payload: resolveObservationBlockPayload(workingRaw),
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  const currentRaw = extractTaggedInner(content, 'current_run_observations');
  if (currentRaw != null) {
    blocks.push(
      createCompositeBlock({
        kind: 'current_run_observations',
        role: message.role,
        payload: resolveObservationBlockPayload(currentRaw),
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  if (workingRaw == null && currentRaw == null) {
    const toolResultPayload = tryParseInlineToolResult(content);
    if (toolResultPayload?.type === 'observations') {
      blocks.push(
        createCompositeBlock({
          kind: 'current_run_observations',
          role: message.role,
          payload: toolResultPayload,
          sourceMessageIndex: messageIndex,
          toolCallId: message.toolCallId,
        }),
      );
    } else if (toolResultPayload?.type === 'text') {
      blocks.push(
        createCompositeBlock({
          kind: 'current_run_observations',
          role: message.role,
          payload: toolResultPayload,
          sourceMessageIndex: messageIndex,
          toolCallId: message.toolCallId,
        }),
      );
    }
  }

  let contextBody = stripObservationsRegion(content);
  if (userRequest) {
    contextBody = contextBody.replace(userRequest, '').trim();
  }
  if (planContext) {
    contextBody = contextBody.replace(planContext, '').trim();
  }
  if (pageContext) {
    contextBody = contextBody.replace(pageContext, '').trim();
  }
  for (const tag of [
    'tool_schema',
    'host_tool_schema',
    'pending_write_tool_call',
  ] as const) {
    contextBody = stripTaggedRegion(contextBody, tag);
  }
  contextBody = contextBody.replace(/Tool result:[\s\S]*$/i, '').trim();

  if (contextBody.length > 0) {
    blocks.push(
      createCompositeBlock({
        kind: 'summarize_context',
        role: message.role,
        payload: { type: 'text', text: contextBody },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  if (blocks.length === 0) {
    blocks.push(
      createCompositeBlock({
        kind: 'other',
        role: message.role,
        payload: { type: 'text', text: content },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  return blocks;
}

export function resetCompositeBlockIdCounterForTests(): void {
  compositeBlockIdCounter = 0;
}
