import type { LlmChatMessage } from '../llm.types';
import {
  parsePromptBlocks,
  resetPromptBlockIdCounterForTests,
} from './prompt-block-parser.util';

describe('parsePromptBlocks', () => {
  beforeEach(() => {
    resetPromptBlockIdCounterForTests();
  });

  it('uses observation split for decision-style assistant messages', () => {
    const messages: LlmChatMessage[] = [
      {
        role: 'assistant',
        content: [
          'Use the observations below to decide the next tool.',
          '<working_memory_observations>',
          JSON.stringify([
            {
              tool: 'search',
              success: true,
              records: [{ id: 'wm-1' }],
              summary: { matchedCount: 1 },
            },
          ]),
          '</working_memory_observations>',
          '<current_run_observations>',
          JSON.stringify([
            {
              tool: 'search',
              success: true,
              records: [{ id: 'cr-1' }],
              summary: { matchedCount: 1 },
            },
          ]),
          '</current_run_observations>',
        ].join('\n'),
      },
    ];

    const blocks = parsePromptBlocks(messages);
    const working = blocks.find((b) => b.kind === 'working_memory_observations');
    const current = blocks.find((b) => b.kind === 'current_run_observations');

    expect(working?.payload.type).toBe('observations');
    if (working?.payload.type === 'observations') {
      expect(working.payload.preamble).toContain('decide the next tool');
    }
    expect(current?.payload.type).toBe('observations');
  });

  it('classifies session_history guide separately from summary', () => {
    const messages: LlmChatMessage[] = [
      {
        role: 'system',
        content: '<session_history>\nTurn 1: hello\n</session_history>',
      },
      {
        role: 'system',
        content: '<session_history_summary>\nUser asked about revenue\n</session_history_summary>',
      },
    ];

    const blocks = parsePromptBlocks(messages);
    expect(blocks.map((b) => b.kind)).toEqual([
      'session_history_guide',
      'session_history_summary',
    ]);
  });

  it('parses tool role messages with tool_schema tag', () => {
    const messages: LlmChatMessage[] = [
      {
        role: 'tool',
        content: '<tool_schema>\n{"name":"write"}\n</tool_schema>',
        toolCallId: 'call-1',
      },
    ];

    const blocks = parsePromptBlocks(messages);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      kind: 'tool_schema',
      role: 'tool',
      toolCallId: 'call-1',
    });
  });

  it('routes summarize user messages through composite parser when callKind is summarize', () => {
    const messages: LlmChatMessage[] = [
      {
        role: 'user',
        content: 'User request: Summarize this\nTool result: plain text payload',
      },
    ];

    const blocks = parsePromptBlocks(messages, { callKind: 'summarize' });
    expect(blocks.some((b) => b.kind === 'current_user_request')).toBe(true);
    expect(blocks.some((b) => b.kind === 'current_run_observations')).toBe(true);
  });

  it('does not composite PageAction-style user messages under decision callKind', () => {
    const messages: LlmChatMessage[] = [
      {
        role: 'system',
        content: 'You are a tagging assistant.',
      },
      {
        role: 'user',
        content: [
          'User request: apply tags',
          '<page_context>{"page":"blog-article-edit"}</page_context>',
          '<context>{"title":"Brake Pad","categories":[{"id":"1","title":"Brake Pad"}]}</context>',
        ].join('\n'),
      },
    ];

    const blocks = parsePromptBlocks(messages, { callKind: 'decision' });
    expect(blocks.some((b) => b.kind === 'summarize_context')).toBe(false);
    expect(blocks.some((b) => b.kind === 'invoke_context')).toBe(true);
    expect(blocks.some((b) => b.kind === 'current_user_request')).toBe(true);
    expect(blocks.some((b) => b.kind === 'other')).toBe(true);
  });
});
