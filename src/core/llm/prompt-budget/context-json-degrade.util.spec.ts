import { truncateJsonStringFields } from './context-json-degrade.util';
import { applyDegradeToBlock } from './apply-block-degrade.util';
import { parsePromptBlocks, resetPromptBlockIdCounterForTests } from './prompt-block-parser.util';
import { resetDecisionUserBlockIdCounterForTests } from './prompt-block-decision-user-parser.util';
import { fitPromptToBudget } from './fit-prompt-to-budget.util';

describe('context-json-degrade', () => {
  it('truncates long strings but keeps arrays in JSON', () => {
    const input = {
      title: 'Brake Pad',
      contentText: 'x'.repeat(5000),
      categories: [
        { id: '1', title: 'Brake Pad' },
        { id: '2', title: 'Brake Caliper' },
      ],
    };
    const out = truncateJsonStringFields(input, 500) as Record<string, unknown>;
    expect(out.categories).toEqual(input.categories);
    expect(String(out.contentText).length).toBeLessThan(600);
    expect(out.contentText).toContain('[excerpt len=5000]');
  });
});

describe('decision invoke_context fit', () => {
  beforeEach(() => {
    resetPromptBlockIdCounterForTests();
    resetDecisionUserBlockIdCounterForTests();
  });

  it('parses decision user into invoke_context block', () => {
    const blocks = parsePromptBlocks(
      [
        {
          role: 'user',
          content: [
            'User request: tag article',
            '<page_context>{"page":"edit"}</page_context>',
            '<context>{"title":"t","contentText":"' + 'a'.repeat(8000) + '","categories":[{"id":"1","title":"Brake Pad"}]}</context>',
          ].join('\n'),
        },
      ],
      { callKind: 'decision' },
    );
    expect(blocks.some((b) => b.kind === 'invoke_context')).toBe(true);
    expect(blocks.some((b) => b.kind === 'current_user_request')).toBe(true);
    expect(blocks.some((b) => b.kind === 'summarize_context')).toBe(false);
  });

  it('keeps categories when invoke_context is degraded under tight budget', () => {
    const categories = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      title: `Part-${i}`,
    }));
    const messages = [
      {
        role: 'system' as const,
        content: 'Rules for tagging.',
      },
      {
        role: 'user' as const,
        content: [
          'User request: apply tags',
          '<context>' +
            JSON.stringify({
              title: 'Brake',
              contentText: 'z'.repeat(20_000),
              categories,
            }) +
            '</context>',
        ].join('\n'),
      },
    ];

    const result = fitPromptToBudget(messages, 1_500, { callKind: 'decision' });
    const fitted = result.messages.map((m) => m.content).join('\n');
    expect(fitted).toContain('"categories"');
    expect(fitted).toContain('"id":"0"');
    expect(fitted).toContain('"title":"Part-0"');
    expect(fitted).toContain('[excerpt len=20000]');
  });

  it('applyDegradeToBlock invoke_context preserves catalog array', () => {
    const block = parsePromptBlocks(
      [
        {
          role: 'user',
          content:
            '<context>{"contentText":"' +
            'b'.repeat(6000) +
            '","categories":[{"id":"99","title":"Rotor"}]}</context>',
        },
      ],
      { callKind: 'decision' },
    ).find((b) => b.kind === 'invoke_context')!;

    const degraded = applyDegradeToBlock(block, 2);
    expect(degraded.payload.type).toBe('text');
    if (degraded.payload.type === 'text') {
      expect(degraded.payload.text).toContain('"categories"');
      expect(degraded.payload.text).toContain('"id":"99"');
      expect(degraded.payload.text).toContain('Rotor');
    }
  });
});
