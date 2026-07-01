import type { LlmChatMessage } from '../llm.types';
import { fitPromptToBudget } from './fit-prompt-to-budget.util';
import { parsePromptBlocks, resetPromptBlockIdCounterForTests } from './prompt-block-parser.util';
import { parseCompositeUserMessage, resetCompositeBlockIdCounterForTests } from './prompt-block-composite-parser.util';
import { applyDegradeToBlock } from './apply-block-degrade.util';
import { resolveObservationBlockPayload } from './observation-degrade.util';

const ORIGINAL_ENV = process.env;

function repeatChar(char: string, count: number): string {
  return char.repeat(count);
}

describe('ultra-long text scenarios', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, PROMPT_BUDGET_ENABLED: '1' };
    resetPromptBlockIdCounterForTests();
    resetCompositeBlockIdCounterForTests();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('summarize: ~50k Tool result is excerpted while user request stays intact', () => {
    const toolPayload = repeatChar('T', 50_000);
    const messages: LlmChatMessage[] = [
      {
        role: 'user',
        content: `User request: Summarize the dataset\nTool result: ${toolPayload}`,
      },
    ];

    const result = fitPromptToBudget(messages, 4_000, { callKind: 'summarize' });
    const fittedContent = result.messages[0]?.content ?? '';

    expect(fittedContent).toContain('User request: Summarize the dataset');
    expect(fittedContent.length).toBeLessThan(toolPayload.length);
    expect(result.report.tokensAfter).toBeLessThan(result.report.tokensBefore);
    expect(
      result.report.degradations.some((row) => row.kind === 'current_run_observations'),
    ).toBe(true);
  });

  it('summarize: ~20k tool_schema block uses compact degrade, not summarize_context excerpt', () => {
    const schemaJson = JSON.stringify({
      type: 'object',
      properties: Object.fromEntries(
        Array.from({ length: 250 }, (_, index) => [
          `field_${index}`,
          { type: 'string', description: repeatChar('d', 80) },
        ]),
      ),
    });
    expect(schemaJson.length).toBeGreaterThan(20_000);

    const messages: LlmChatMessage[] = [
      {
        role: 'user',
        content: [
          'User request: Draft the write payload',
          `<tool_schema>\n${schemaJson}\n</tool_schema>`,
          repeatChar('W', 8_000),
        ].join('\n'),
      },
    ];

    const result = fitPromptToBudget(messages, 3_000, { callKind: 'summarize' });
    const fittedContent = result.messages[0]?.content ?? '';

    expect(fittedContent).toContain('User request: Draft the write payload');
    expect(fittedContent).toContain('<tool_schema>');
    expect(fittedContent.length).toBeLessThan(schemaJson.length + 8_000);
    expect(
      result.report.degradations.some((row) => row.kind === 'tool_schema'),
    ).toBe(true);
    expect(
      result.report.degradations.some((row) => row.kind === 'current_user_request'),
    ).toBe(false);
  });

  it('decision: ~40 records with ~2k-char fields shrink under tight budget', () => {
    const records = Array.from({ length: 40 }, (_, index) => ({
      id: index,
      body: repeatChar('x', 2_000),
    }));
    const messages: LlmChatMessage[] = [
      {
        role: 'user',
        content: '<current_user_request>\nWhat did we find?\n</current_user_request>',
      },
      {
        role: 'assistant',
        content: [
          '<working_memory_observations>',
          JSON.stringify([
            {
              tool: 'query',
              success: true,
              records,
              summary: { matchedCount: records.length },
            },
          ]),
          '</working_memory_observations>',
        ].join('\n'),
      },
      {
        role: 'system',
        content: '<agent_prompt>\n' + repeatChar('A', 10_000) + '\n</agent_prompt>',
      },
    ];

    const result = fitPromptToBudget(messages, 2_000, { callKind: 'decision' });
    const obsContent =
      result.messages.find((message) =>
        message.content.includes('working_memory_observations'),
      )?.content ?? '';

    expect(result.report.tokensAfter).toBeLessThan(result.report.tokensBefore);
    expect(obsContent.length).toBeLessThan(JSON.stringify(records).length);
    expect(result.messages.some((m) => m.content.includes('current_user_request'))).toBe(
      true,
    );
  });

  it('decision: invalid ~30k raw observation text is excerpted when degraded', () => {
    const raw = repeatChar('Z', 30_000);
    const block = parsePromptBlocks([
      {
        role: 'assistant',
        content: `<working_memory_observations>\n${raw}\n</working_memory_observations>`,
      },
    ]).find((row) => row.kind === 'working_memory_observations')!;

    expect(resolveObservationBlockPayload(raw).type).toBe('text');

    const l1 = applyDegradeToBlock(block, 1);
    expect(l1.payload.type).toBe('text');
    if (l1.payload.type === 'text') {
      expect(l1.payload.text.length).toBeLessThan(raw.length);
      expect(l1.payload.text).toContain('[excerpt len=30000]');
    }
  });

  it('summarize: mixed CJK ultra-long plan_context and Tool result both shrink', () => {
    const cjk = repeatChar('测', 12_000);
    const messages: LlmChatMessage[] = [
      {
        role: 'user',
        content: [
          'User request: 请总结',
          `<plan_context>\n${cjk}\n</plan_context>`,
          `Tool result: ${repeatChar('数', 20_000)}`,
        ].join('\n'),
      },
    ];

    const result = fitPromptToBudget(messages, 2_500, { callKind: 'summarize' });
    const fittedContent = result.messages[0]?.content ?? '';

    expect(fittedContent).toContain('User request: 请总结');
    expect(fittedContent.length).toBeLessThan(cjk.length + 20_000);
    expect(result.report.degradations.length).toBeGreaterThan(0);
  });

  it('composite parser handles ~100k summarize remainder without throwing', () => {
    const hugeContext = repeatChar('H', 100_000);
    const blocks = parseCompositeUserMessage(
      {
        role: 'user',
        content: `User request: hello\n${hugeContext}`,
      },
      0,
    );

    const contextBlock = blocks.find((row) => row.kind === 'summarize_context');
    expect(contextBlock?.payload.type).toBe('text');
    if (contextBlock?.payload.type === 'text') {
      expect(contextBlock.payload.text.length).toBe(100_000);
    }
  });
});

/** ~128k context window with output reserve — budget passed to fit is message-side tokens. */
const CONTEXT_WINDOW_BUDGET = 32_000;

function buildDecisionOverflowMessages(): LlmChatMessage[] {
  const records = Array.from({ length: 60 }, (_, index) => ({
    id: index,
    payload: repeatChar('r', 2_000),
  }));
  const historyTurns = Array.from({ length: 14 }, (_, index) => ({
    role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
    content: repeatChar('h', 3_000) + `\nTurn ${index}`,
  }));

  return [
    {
      role: 'system',
      content: '<agent_prompt>\n' + repeatChar('A', 55_000) + '\n</agent_prompt>',
    },
    {
      role: 'system',
      content:
        '<tool_decision>\n' + repeatChar('D', 35_000) + '\n</tool_decision>',
    },
    {
      role: 'user',
      content:
        '<current_user_request>\nWhat is the consolidated answer?\n</current_user_request>',
    },
    ...historyTurns,
    {
      role: 'assistant',
      content: [
        'Tool observations (prefer current_run_observations for the latest request):',
        '<working_memory_observations>',
        JSON.stringify([
          {
            tool: 'bulk_query',
            success: true,
            records,
            summary: { matchedCount: records.length },
          },
        ]),
        '</working_memory_observations>',
        '<current_run_observations>',
        JSON.stringify([
          {
            tool: 'latest_query',
            success: true,
            records: records.slice(0, 20),
            summary: { matchedCount: 20 },
          },
        ]),
        '</current_run_observations>',
      ].join('\n'),
    },
  ];
}

function buildSummarizeOverflowMessages(): LlmChatMessage[] {
  const schemaJson = JSON.stringify({
    type: 'object',
    properties: Object.fromEntries(
      Array.from({ length: 400 }, (_, index) => [
        `field_${index}`,
        { type: 'string', description: repeatChar('s', 120) },
      ]),
    ),
  });
  const workingRecords = Array.from({ length: 30 }, (_, index) => ({
    id: index,
    note: repeatChar('w', 1_500),
  }));
  const currentRecords = Array.from({ length: 25 }, (_, index) => ({
    id: index,
    note: repeatChar('c', 1_500),
  }));

  return [
    {
      role: 'user',
      content: [
        'User request: Produce the final write summary',
        `<plan_context>\n${repeatChar('P', 40_000)}\n</plan_context>`,
        `<pending_write_tool_call>\n${JSON.stringify({
          tool: 'write_record',
          arguments: { body: repeatChar('a', 5_000) },
        })}\n</pending_write_tool_call>`,
        `<tool_schema>\n${schemaJson}\n</tool_schema>`,
        'Tool observations (prefer current_run_observations for the latest request):',
        `<working_memory_observations>\n${JSON.stringify([
          {
            tool: 'search',
            success: true,
            records: workingRecords,
            summary: { matchedCount: workingRecords.length },
          },
        ])}\n</working_memory_observations>`,
        `<current_run_observations>\n${JSON.stringify([
          {
            tool: 'fetch',
            success: true,
            records: currentRecords,
            summary: { matchedCount: currentRecords.length },
          },
        ])}\n</current_run_observations>`,
        `Tool result: ${repeatChar('T', 45_000)}`,
        repeatChar('X', 15_000),
      ].join('\n'),
    },
  ];
}

function totalCharCount(messages: LlmChatMessage[]): number {
  return messages.reduce((sum, message) => sum + message.content.length, 0);
}

describe('context-window overflow (~200k+)', () => {
  jest.setTimeout(30_000);

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, PROMPT_BUDGET_ENABLED: '1' };
    resetPromptBlockIdCounterForTests();
    resetCompositeBlockIdCounterForTests();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('decision: ~250k multi-block prompt fits under a 32k-token budget without touching user request', () => {
    const messages = buildDecisionOverflowMessages();
    expect(totalCharCount(messages)).toBeGreaterThan(200_000);

    const result = fitPromptToBudget(messages, CONTEXT_WINDOW_BUDGET, {
      callKind: 'decision',
    });

    expect(result.report.tokensBefore).toBeGreaterThan(CONTEXT_WINDOW_BUDGET);
    expect(result.report.tokensAfter).toBeLessThan(result.report.tokensBefore);
    expect(result.report.degradations.length).toBeGreaterThan(0);
    expect(result.report.degradations.length).toBeLessThan(200);
    expect(
      result.messages.some((message) =>
        message.content.includes('current_user_request'),
      ),
    ).toBe(true);
    expect(
      result.report.degradations.some((row) => row.kind === 'current_user_request'),
    ).toBe(false);
    expect(result.report.tokensAfter).toBeLessThanOrEqual(result.report.budget);
  });

  it('summarize: ~200k+ composite plan-draft message preserves user request and pending write', () => {
    const messages = buildSummarizeOverflowMessages();
    expect(totalCharCount(messages)).toBeGreaterThan(200_000);

    const result = fitPromptToBudget(messages, CONTEXT_WINDOW_BUDGET, {
      callKind: 'summarize',
    });
    const fittedContent = result.messages[0]?.content ?? '';

    expect(result.report.tokensBefore).toBeGreaterThan(CONTEXT_WINDOW_BUDGET);
    expect(result.report.tokensAfter).toBeLessThan(result.report.tokensBefore);
    expect(fittedContent).toContain('User request: Produce the final write summary');
    expect(fittedContent).toContain('<pending_write_tool_call>');
    expect(fittedContent).toContain('<tool_schema>');
    expect(
      result.report.degradations.some((row) => row.kind === 'current_user_request'),
    ).toBe(false);
    expect(
      result.report.degradations.some((row) => row.kind === 'pending_write_tool_call'),
    ).toBe(false);
    expect(result.report.degradations.length).toBeLessThan(200);
  });

  it('decision overflow: degrades agent_prompt and observations before protected blocks', () => {
    const messages = buildDecisionOverflowMessages();
    const result = fitPromptToBudget(messages, CONTEXT_WINDOW_BUDGET, {
      callKind: 'decision',
    });

    const degradedKinds = new Set(result.report.degradations.map((row) => row.kind));
    expect(
      degradedKinds.has('agent_prompt') ||
        degradedKinds.has('working_memory_observations') ||
        degradedKinds.has('current_run_observations') ||
        degradedKinds.has('session_history_turns') ||
        degradedKinds.has('tool_decision'),
    ).toBe(true);
  });
});
