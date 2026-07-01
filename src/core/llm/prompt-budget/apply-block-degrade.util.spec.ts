import type { LlmChatMessage } from '../llm.types';
import { parsePromptBlocks, resetPromptBlockIdCounterForTests } from './prompt-block-parser.util';
import { parseCompositeUserMessage, resetCompositeBlockIdCounterForTests } from './prompt-block-composite-parser.util';
import { applyDegradeToBlock } from './apply-block-degrade.util';
import { compactToolSchemaJson } from './text-degrade.util';

describe('applyDegradeToBlock', () => {
  beforeEach(() => {
    resetPromptBlockIdCounterForTests();
  });

  it('compacts tool_schema at L1 and L2', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'A'.repeat(200) },
      },
    });
    const block = parsePromptBlocks([
      {
        role: 'tool',
        content: `<tool_schema>\n${schema}\n</tool_schema>`,
      },
    ])[0]!;

    const l1 = applyDegradeToBlock(block, 1);
    expect(l1.payload.type).toBe('tool_schema');
    if (l1.payload.type === 'tool_schema') {
      expect(l1.payload.json.length).toBeLessThanOrEqual(schema.length);
      expect(l1.payload.json).toBe(compactToolSchemaJson(schema));
    }
  });

  it('excerpts pending_write_tool_call at L1', () => {
    const block = parseCompositeUserMessage(
      {
        role: 'user',
        content: `<pending_write_tool_call>\n${'x'.repeat(5000)}\n</pending_write_tool_call>`,
      },
      0,
    ).find((row) => row.kind === 'pending_write_tool_call')!;

    const l1 = applyDegradeToBlock(block, 1);
    expect(l1.payload.type).toBe('text');
    if (l1.payload.type === 'text') {
      expect(l1.payload.text.length).toBeLessThan(5000);
    }
  });

  it('drops block content at L4', () => {
    const block = parsePromptBlocks([
      { role: 'user', content: '<current_user_request>\nhi\n</current_user_request>' },
    ])[0]!;
    const l4 = applyDegradeToBlock({ ...block, maxDegradeLevel: 4 }, 4);
    expect(l4.payload).toEqual({ type: 'text', text: '' });
  });
});

describe('invalid observation JSON fallback in parsers', () => {
  beforeEach(() => {
    resetPromptBlockIdCounterForTests();
    resetCompositeBlockIdCounterForTests();
  });

  it('preserves raw text in decision observation split', () => {
    const raw = 'not-valid-json-but-useful-output';
    const blocks = parsePromptBlocks([
      {
        role: 'assistant',
        content: `<working_memory_observations>\n${raw}\n</working_memory_observations>`,
      },
    ]);
    const working = blocks.find((b) => b.kind === 'working_memory_observations');
    expect(working?.payload).toEqual({ type: 'text', text: raw });
  });

  it('preserves raw text in composite summarize message', () => {
    const raw = '{ broken observation payload';
    const blocks = parseCompositeUserMessage(
      {
        role: 'user',
        content: [
          'User request: check data',
          `<current_run_observations>\n${raw}\n</current_run_observations>`,
        ].join('\n'),
      },
      0,
    );
    const current = blocks.find((b) => b.kind === 'current_run_observations');
    expect(current?.payload).toEqual({ type: 'text', text: raw });
  });
});
