import type { LlmChatMessage } from '../llm.types';
import type { PromptBlock, PromptBlockKind, PromptBlockPayload } from './prompt-budget.types';
import {
  BLOCK_MAX_DEGRADE,
  BLOCK_PRIORITY,
  SESSION_GOA_TAG_SECTION,
} from './prompt-budget.constants';
import {
  detectSessionGoaSection,
} from './goa-degrade.util';
import {
  resolveObservationBlockPayload,
} from './observation-degrade.util';
import {
  isCompositeSummarizeUserMessage,
  parseCompositeUserMessage,
} from './prompt-block-composite-parser.util';

let blockIdCounter = 0;

function nextBlockId(kind: PromptBlockKind, messageIndex: number): string {
  blockIdCounter += 1;
  return `${kind}:${messageIndex}:${blockIdCounter}`;
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
  return content.slice(start + open.length, end).trim();
}

function createBlock(input: {
  kind: PromptBlockKind;
  role: LlmChatMessage['role'];
  payload: PromptBlockPayload;
  sourceMessageIndex: number;
  toolCallId?: string;
}): PromptBlock {
  return {
    id: nextBlockId(input.kind, input.sourceMessageIndex),
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

function parseObservationSplitMessage(
  message: LlmChatMessage,
  messageIndex: number,
): PromptBlock[] {
  const content = message.content;
  const preambleEnd = content.indexOf('<working_memory_observations>');
  const preamble =
    preambleEnd > 0 ? content.slice(0, preambleEnd).trim() : undefined;
  const workingRaw = extractTaggedContent(content, 'working_memory_observations');
  const currentRaw = extractTaggedContent(content, 'current_run_observations');
  const blocks: PromptBlock[] = [];
  if (workingRaw != null) {
    const payload = resolveObservationBlockPayload(workingRaw);
    blocks.push(
      createBlock({
        kind: 'working_memory_observations',
        role: message.role,
        payload:
          payload.type === 'observations'
            ? { ...payload, preamble }
            : payload,
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }
  if (currentRaw != null) {
    blocks.push(
      createBlock({
        kind: 'current_run_observations',
        role: message.role,
        payload: resolveObservationBlockPayload(currentRaw),
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }
  if (blocks.length === 0) {
    blocks.push(
      createBlock({
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

function classifySystemMessage(
  content: string,
  message: LlmChatMessage,
  messageIndex: number,
): PromptBlock {
  const tagKindPairs: Array<[string, PromptBlockKind]> = [
    ['agent_prompt', 'agent_prompt'],
    ['response_style', 'response_style'],
    ['message_blocks_spec', 'message_blocks_spec'],
    ['user_memory', 'user_memory'],
    ['page_context', 'page_context'],
    ['session_history_summary', 'session_history_summary'],
    ['tool_decision', 'tool_decision'],
    ['plan_step_override', 'plan_step_override'],
    ['plan_context', 'plan_context'],
    ['current_objective', 'plan_context'],
  ];

  for (const [tag, kind] of tagKindPairs) {
    if (content.includes(`<${tag}>`)) {
      return createBlock({
        kind,
        role: message.role,
        payload: { type: 'text', text: content },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      });
    }
  }

  if (
    content.includes('<session_history>') &&
    !content.includes('<session_history_summary>')
  ) {
    return createBlock({
      kind: 'session_history_guide',
      role: message.role,
      payload: { type: 'text', text: content },
      sourceMessageIndex: messageIndex,
      toolCallId: message.toolCallId,
    });
  }

  for (const tag of Object.keys(SESSION_GOA_TAG_SECTION)) {
    if (content.includes(`<${tag}>`)) {
      const section = detectSessionGoaSection(content);
      return createBlock({
        kind: 'session_goa',
        role: message.role,
        payload: { type: 'session_goa', section, text: content },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      });
    }
  }

  return createBlock({
    kind: 'other',
    role: message.role,
    payload: { type: 'text', text: content },
    sourceMessageIndex: messageIndex,
    toolCallId: message.toolCallId,
  });
}

function parseSingleMessage(
  message: LlmChatMessage,
  messageIndex: number,
): PromptBlock[] {
  const content = message.content;

  if (
    (message.role === 'user' || message.role === 'assistant') &&
    isCompositeSummarizeUserMessage(content)
  ) {
    return parseCompositeUserMessage(message, messageIndex);
  }

  if (
    content.includes('<working_memory_observations>') ||
    content.includes('<current_run_observations>')
  ) {
    return parseObservationSplitMessage(message, messageIndex);
  }

  if (message.role === 'tool') {
    if (content.includes('<tool_schema>')) {
      const inner = extractTaggedContent(content, 'tool_schema') ?? content;
      return [
        createBlock({
          kind: 'tool_schema',
          role: message.role,
          payload: { type: 'tool_schema', json: inner },
          sourceMessageIndex: messageIndex,
          toolCallId: message.toolCallId,
        }),
      ];
    }
    if (content.includes('<host_tool_schema>')) {
      const inner = extractTaggedContent(content, 'host_tool_schema') ?? content;
      return [
        createBlock({
          kind: 'host_tool_schema',
          role: message.role,
          payload: { type: 'tool_schema', json: inner },
          sourceMessageIndex: messageIndex,
          toolCallId: message.toolCallId,
        }),
      ];
    }
  }

  if (message.role === 'system') {
    return [classifySystemMessage(content, message, messageIndex)];
  }

  if (content.includes('<current_user_request>')) {
    return [
      createBlock({
        kind: 'current_user_request',
        role: message.role,
        payload: { type: 'text', text: content },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    ];
  }

  if (content.startsWith('[tool_result:')) {
    return [
      createBlock({
        kind: 'tool_result_legacy',
        role: message.role,
        payload: { type: 'text', text: content },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    ];
  }

  if (message.role === 'user' || message.role === 'assistant') {
    return [
      createBlock({
        kind: 'session_history_turns',
        role: message.role,
        payload: { type: 'text', text: content },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    ];
  }

  return [
    createBlock({
      kind: 'other',
      role: message.role,
      payload: { type: 'text', text: content },
      sourceMessageIndex: messageIndex,
      toolCallId: message.toolCallId,
    }),
  ];
}

export function parsePromptBlocks(messages: LlmChatMessage[]): PromptBlock[] {
  blockIdCounter = 0;
  return messages.flatMap((message, index) => parseSingleMessage(message, index));
}

export function resetPromptBlockIdCounterForTests(): void {
  blockIdCounter = 0;
}
