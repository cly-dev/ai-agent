import type { LlmChatMessage } from '../llm.types';
import {
  isCompositeSummarizeUserMessage,
  parseCompositeUserMessage,
  resetCompositeBlockIdCounterForTests,
} from './prompt-block-composite-parser.util';

function userMessage(content: string): LlmChatMessage {
  return { role: 'user', content };
}

describe('parseCompositeUserMessage', () => {
  beforeEach(() => {
    resetCompositeBlockIdCounterForTests();
  });

  it('splits user request, plan context, observations, and summarize remainder', () => {
    const content = [
      'User request: What is the total revenue?',
      '<plan_context>',
      'Objective: summarize revenue',
      '</plan_context>',
      '<working_memory_observations>',
      JSON.stringify([
        {
          tool: 'query',
          success: true,
          records: [{ id: 1, amount: 100 }],
          summary: { matchedCount: 1 },
        },
      ]),
      '</working_memory_observations>',
      '<current_run_observations>',
      JSON.stringify([
        {
          tool: 'query',
          success: true,
          records: [{ id: 2, amount: 200 }],
          summary: { matchedCount: 1 },
        },
      ]),
      '</current_run_observations>',
      'Write tool(s): update_record',
    ].join('\n');

    const blocks = parseCompositeUserMessage(userMessage(content), 0);
    const kinds = blocks.map((b) => b.kind);

    expect(kinds).toEqual([
      'current_user_request',
      'plan_context',
      'working_memory_observations',
      'current_run_observations',
      'summarize_context',
    ]);
    expect(blocks[0]?.payload).toMatchObject({
      type: 'text',
      text: 'User request: What is the total revenue?',
    });
    expect(blocks[4]?.payload).toMatchObject({
      type: 'text',
      text: 'Write tool(s): update_record',
    });
  });

  it('parses inline Tool result as current_run_observations', () => {
    const content = [
      'User request: Show me orders',
      'Tool result: [{"orderId":"A1","total":42}]',
    ].join('\n');

    const blocks = parseCompositeUserMessage(userMessage(content), 1);
    const toolResultBlock = blocks.find((b) => b.kind === 'current_run_observations');

    expect(toolResultBlock?.payload.type).toBe('observations');
    if (toolResultBlock?.payload.type === 'observations') {
      expect(toolResultBlock.payload.observations[0]?.records).toEqual([
        { orderId: 'A1', total: 42 },
      ]);
    }
  });

  it('extracts tool_schema and pending_write_tool_call as dedicated blocks', () => {
    const schemaJson = JSON.stringify({
      type: 'object',
      properties: { name: { type: 'string' } },
    });
    const pendingWrite = JSON.stringify({ tool: 'write_record', arguments: { id: 1 } });
    const content = [
      'User request: Update the record',
      '<pending_write_tool_call>',
      pendingWrite,
      '</pending_write_tool_call>',
      '<tool_schema>',
      schemaJson,
      '</tool_schema>',
      'Write tool(s): write_record',
    ].join('\n');

    const blocks = parseCompositeUserMessage(userMessage(content), 0);
    const schemaBlock = blocks.find((b) => b.kind === 'tool_schema');
    const pendingBlock = blocks.find((b) => b.kind === 'pending_write_tool_call');
    const contextBlock = blocks.find((b) => b.kind === 'summarize_context');

    expect(schemaBlock?.payload).toEqual({ type: 'tool_schema', json: schemaJson });
    expect(pendingBlock?.payload).toMatchObject({ type: 'text' });
    if (pendingBlock?.payload.type === 'text') {
      expect(pendingBlock.payload.text).toContain('pending_write_tool_call');
      expect(pendingBlock.payload.text).toContain(pendingWrite);
    }
    expect(contextBlock?.payload).toMatchObject({
      type: 'text',
      text: 'Write tool(s): write_record',
    });
  });

  it('detects composite summarize messages', () => {
    expect(isCompositeSummarizeUserMessage('User request: hello')).toBe(true);
    expect(isCompositeSummarizeUserMessage('<plan_context>\nx\n</plan_context>')).toBe(
      true,
    );
    expect(isCompositeSummarizeUserMessage('Tool result: {"ok":true}')).toBe(true);
    expect(isCompositeSummarizeUserMessage('plain user question')).toBe(false);
  });
});
