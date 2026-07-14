import type { LlmChatMessage } from '../llm.types';
import { fitPromptToBudget } from './fit-prompt-to-budget.util';
import { parsePromptBlocks, resetPromptBlockIdCounterForTests } from './prompt-block-parser.util';
import { applyDegradeToBlock } from './apply-block-degrade.util';
import {
  estimateBlocksTokens,
  pickNextDegradeCandidate,
  renderPromptBlocks,
} from './prompt-block-render.util';
import { applyCallKindPolicyToBlock, resolveCallKindPolicy } from './call-kind-policy.util';

const ORIGINAL_ENV = process.env;

function repeatChar(char: string, count: number): string {
  return char.repeat(count);
}

function buildOversizedDecisionMessages(): LlmChatMessage[] {
  const bigRecords = Array.from({ length: 40 }, (_, index) => ({
    id: index,
    comment: repeatChar('x', 1200),
  }));
  return [
    {
      role: 'system',
      content: '<agent_prompt>\n' + repeatChar('A', 4000) + '\n</agent_prompt>',
    },
    {
      role: 'user',
      content: '<current_user_request>\nWhat happened?\n</current_user_request>',
    },
    {
      role: 'assistant',
      content: [
        'Instruction preamble for decision.',
        '<working_memory_observations>',
        JSON.stringify([
          {
            tool: 'query',
            success: true,
            records: bigRecords,
            summary: { matchedCount: bigRecords.length },
          },
        ]),
        '</working_memory_observations>',
      ].join('\n'),
    },
  ];
}

describe('fitPromptToBudget', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, PROMPT_BUDGET_ENABLED: '1' };
    resetPromptBlockIdCounterForTests();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('skips fit when disabled or callKind requests skip', () => {
    process.env.PROMPT_BUDGET_ENABLED = '0';
    const messages: LlmChatMessage[] = [{ role: 'user', content: 'hello' }];
    const disabled = fitPromptToBudget(messages, 1000);
    expect(disabled.messages).toBe(messages);
    expect(disabled.report.skipped).toBe(true);

    process.env.PROMPT_BUDGET_ENABLED = '1';
    const skipped = fitPromptToBudget(messages, 1000, { callKind: 'compression' });
    expect(skipped.messages).toBe(messages);
    expect(skipped.report.skipped).toBe(true);
  });

  it('protects summarize current_user_request from degradation', () => {
    const messages: LlmChatMessage[] = [
      {
        role: 'user',
        content: [
          'User request: Keep this exact question',
          '<plan_context>\n' + repeatChar('P', 8000) + '\n</plan_context>',
          'Tool result: ' + repeatChar('T', 12000),
        ].join('\n'),
      },
    ];

    const result = fitPromptToBudget(messages, 500, { callKind: 'summarize' });
    const userContent = result.messages.map((m) => m.content).join('\n');

    expect(userContent).toContain('User request: Keep this exact question');
    const userBlock = parsePromptBlocks(messages, { callKind: 'summarize' }).find(
      (b) => b.kind === 'current_user_request',
    );
    const policy = resolveCallKindPolicy('summarize');
    expect(
      applyCallKindPolicyToBlock(
        'current_user_request',
        userBlock!.maxDegradeLevel,
        policy,
      ),
    ).toBe(0);
  });

  it('degrades lower-priority blocks before user request under tight budget', () => {
    const messages = buildOversizedDecisionMessages();
    const result = fitPromptToBudget(messages, 800, { callKind: 'decision' });

    expect(result.report.enabled).toBe(true);
    expect(result.report.degradations.length).toBeGreaterThan(0);
    expect(
      result.report.degradations.some((row) => row.kind === 'working_memory_observations'),
    ).toBe(true);
    expect(
      result.report.degradations.some((row) => row.kind === 'current_user_request'),
    ).toBe(false);
    expect(result.messages.some((m) => m.content.includes('current_user_request'))).toBe(
      true,
    );
  });

  it('merges same sourceMessageIndex blocks when rendering', () => {
    const messages: LlmChatMessage[] = [
      {
        role: 'user',
        content: [
          'User request: merge test',
          'Tool result: hello world',
        ].join('\n'),
      },
    ];

    const fitted = fitPromptToBudget(messages, 100_000, { callKind: 'summarize' });
    expect(fitted.messages).toHaveLength(1);
    expect(fitted.messages[0]?.role).toBe('user');
    expect(fitted.messages[0]?.content).toContain('User request: merge test');
    expect(fitted.messages[0]?.content).toContain('Tool result: hello world');
  });

  it('records sourceMessageIndex on degradation records', () => {
    const messages: LlmChatMessage[] = [
      {
        role: 'user',
        content: [
          'User request: Keep this exact question',
          '<plan_context>\n' + repeatChar('P', 8000) + '\n</plan_context>',
          'Tool result: ' + repeatChar('T', 12000),
        ].join('\n'),
      },
    ];

    const result = fitPromptToBudget(messages, 500, { callKind: 'summarize' });
    expect(result.report.degradations.length).toBeGreaterThan(0);
    expect(
      result.report.degradations.every((row) => row.sourceMessageIndex === 0),
    ).toBe(true);
  });

  it('does not spin on no-op degradations and exhausts capped blocks', () => {
    const messages: LlmChatMessage[] = [
      {
        role: 'user',
        content: '<current_user_request>\nProtected question\n</current_user_request>',
      },
      {
        role: 'assistant',
        content: [
          '<working_memory_observations>',
          JSON.stringify([
            {
              tool: 'query',
              success: true,
              records: [{ id: 1 }],
              summary: { matchedCount: 1 },
            },
          ]),
          '</working_memory_observations>',
        ].join('\n'),
      },
      {
        role: 'system',
        content: '<agent_prompt>\n' + repeatChar('A', 6000) + '\n</agent_prompt>',
      },
    ];

    const result = fitPromptToBudget(messages, 400, { callKind: 'decision' });
    expect(result.report.degradations.length).toBeLessThan(30);
    expect(result.report.degradations.length).toBeGreaterThan(0);
    expect(
      result.report.degradations.some((row) => row.kind === 'current_user_request'),
    ).toBe(false);
  });

  it('uses consistent token estimate for tokensBefore and initial fit', () => {
    const messages: LlmChatMessage[] = [
      { role: 'user', content: 'User request: hello\nTool result: world' },
    ];
    const result = fitPromptToBudget(messages, 100_000, { callKind: 'summarize' });
    expect(result.report.tokensBefore).toBe(result.report.tokensAfter);
    expect(result.report.fitted).toBe(true);
  });
});

describe('prompt budget degrade helpers', () => {
  beforeEach(() => {
    resetPromptBlockIdCounterForTests();
  });

  it('prefers higher priority (numerically larger) blocks for degradation', () => {
    const blocks = parsePromptBlocks([
      { role: 'user', content: '<current_user_request>\nq\n</current_user_request>' },
      {
        role: 'assistant',
        content:
          '<working_memory_observations>\n[]\n</working_memory_observations>',
      },
    ]);

    const candidate = pickNextDegradeCandidate(blocks);
    expect(candidate?.kind).toBe('working_memory_observations');
  });

  it('applies observation L2 long-field preview on text payloads', () => {
    const block = parsePromptBlocks(
      [
        {
          role: 'user',
          content: 'User request: x\nTool result: ' + repeatChar('z', 9000),
        },
      ],
      { callKind: 'summarize' },
    ).find((b) => b.kind === 'current_run_observations')!;

    const l1 = applyDegradeToBlock(block, 1);
    expect(l1.payload.type).toBe('text');
    if (l1.payload.type === 'text') {
      expect(l1.payload.text.length).toBeLessThan(9000);
    }
  });

  it('uses merged token estimate for same-index blocks', () => {
    const blocks = parsePromptBlocks(
      [
        {
          role: 'user',
          content: 'User request: a\nTool result: ' + repeatChar('b', 200),
        },
      ],
      { callKind: 'summarize' },
    );
    const mergedTokens = estimateBlocksTokens(blocks);
    const rendered = renderPromptBlocks(blocks);
    expect(rendered).toHaveLength(1);
    expect(mergedTokens).toBeGreaterThan(0);
  });
});
