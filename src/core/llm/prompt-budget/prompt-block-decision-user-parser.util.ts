import type { LlmChatMessage } from '../llm.types';
import type { PromptBlock, PromptBlockKind } from './prompt-budget.types';
import {
  BLOCK_MAX_DEGRADE,
  BLOCK_PRIORITY,
} from './prompt-budget.constants';

let decisionBlockIdCounter = 0;

function nextBlockId(kind: PromptBlockKind, messageIndex: number): string {
  decisionBlockIdCounter += 1;
  return `${kind}:${messageIndex}:d${decisionBlockIdCounter}`;
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

function createBlock(input: {
  kind: PromptBlockKind;
  role: LlmChatMessage['role'];
  payload: PromptBlock['payload'];
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

function extractUserRequestLine(content: string): string | null {
  const tagged = extractTaggedContent(content, 'current_user_request');
  if (tagged) {
    return tagged;
  }
  const firstLine = content.split('\n')[0]?.trim() ?? '';
  if (firstLine.startsWith('User request:')) {
    return firstLine;
  }
  return null;
}

function stripTaggedRegion(content: string, tag: string): string {
  const tagged = extractTaggedContent(content, tag);
  if (!tagged) {
    return content;
  }
  return content.replace(tagged, '').trim();
}

/**
 * decision 产参 user：拆出 request / page_context / invoke_context，
 * 避免整段 session_history_turns 从头 excerpt 丢掉尾部 catalog 数组。
 */
export function shouldParseAsDecisionInvokeUserMessage(
  message: LlmChatMessage,
  callKind?: import('./prompt-budget.types').PromptBudgetCallKind,
): boolean {
  if (callKind !== 'decision') {
    return false;
  }
  if (message.role !== 'user' && message.role !== 'assistant') {
    return false;
  }
  return message.content.includes('<context>');
}

export function parseDecisionInvokeUserMessage(
  message: LlmChatMessage,
  messageIndex: number,
): PromptBlock[] {
  decisionBlockIdCounter = 0;
  const content = message.content;
  const blocks: PromptBlock[] = [];

  const userRequest = extractUserRequestLine(content);
  if (userRequest) {
    blocks.push(
      createBlock({
        kind: 'current_user_request',
        role: message.role,
        payload: { type: 'text', text: userRequest },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  const pageContext = extractTaggedContent(content, 'page_context');
  if (pageContext) {
    blocks.push(
      createBlock({
        kind: 'page_context',
        role: message.role,
        payload: { type: 'text', text: pageContext },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  const contextInner = extractTaggedInner(content, 'context');
  if (contextInner != null) {
    blocks.push(
      createBlock({
        kind: 'invoke_context',
        role: message.role,
        payload: {
          type: 'text',
          text: `<context>\n${contextInner}\n</context>`,
        },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  let remainder = content;
  if (userRequest) {
    remainder = remainder.replace(userRequest, '').trim();
  }
  if (pageContext) {
    remainder = remainder.replace(pageContext, '').trim();
  }
  remainder = stripTaggedRegion(remainder, 'context');

  if (remainder.length > 0) {
    blocks.push(
      createBlock({
        kind: 'session_history_turns',
        role: message.role,
        payload: { type: 'text', text: remainder },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  if (blocks.length === 0) {
    blocks.push(
      createBlock({
        kind: 'session_history_turns',
        role: message.role,
        payload: { type: 'text', text: content },
        sourceMessageIndex: messageIndex,
        toolCallId: message.toolCallId,
      }),
    );
  }

  return blocks;
}

export function resetDecisionUserBlockIdCounterForTests(): void {
  decisionBlockIdCounter = 0;
}
