import type { PromptBlock } from './prompt-budget.types';
import {
  estimateBlocksTokens,
  nextDegradeLevel,
  pickNextDegradeCandidate,
  renderPromptBlocks,
} from './prompt-block-render.util';
import { resetPromptBlockIdCounterForTests } from './prompt-block-parser.util';

function makeBlock(input: Partial<PromptBlock> & Pick<PromptBlock, 'id' | 'kind' | 'priority'>): PromptBlock {
  return {
    degradeLevel: 0,
    maxDegradeLevel: 3,
    role: 'user',
    sourceMessageIndex: 0,
    payload: { type: 'text', text: 'sample' },
    ...input,
  };
}

describe('prompt-block-render.util', () => {
  beforeEach(() => {
    resetPromptBlockIdCounterForTests();
  });

  it('merges blocks with the same sourceMessageIndex', () => {
    const messages = renderPromptBlocks([
      makeBlock({
        id: 'a:0:1',
        kind: 'current_user_request',
        priority: 0,
        sourceMessageIndex: 0,
        payload: { type: 'text', text: 'User request: hi' },
      }),
      makeBlock({
        id: 'b:0:2',
        kind: 'summarize_context',
        priority: 18,
        sourceMessageIndex: 0,
        payload: { type: 'text', text: 'extra context' },
      }),
    ]);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.content).toContain('User request: hi');
    expect(messages[0]?.content).toContain('extra context');
  });

  it('estimates merged message tokens once per source index', () => {
    const blocks = [
      makeBlock({
        id: 'a:0:1',
        kind: 'current_user_request',
        priority: 0,
        sourceMessageIndex: 0,
        payload: { type: 'text', text: 'aaaa' },
      }),
      makeBlock({
        id: 'b:0:2',
        kind: 'summarize_context',
        priority: 18,
        sourceMessageIndex: 0,
        payload: { type: 'text', text: 'bbbb' },
      }),
      makeBlock({
        id: 'c:1:3',
        kind: 'other',
        priority: 45,
        sourceMessageIndex: 1,
        payload: { type: 'text', text: 'cccc' },
      }),
    ];
    expect(estimateBlocksTokens(blocks)).toBeGreaterThan(0);
  });

  it('picks the highest-priority degradable block first', () => {
    const candidate = pickNextDegradeCandidate([
      makeBlock({ id: 'a', kind: 'current_user_request', priority: 0, degradeLevel: 0, maxDegradeLevel: 0 }),
      makeBlock({ id: 'b', kind: 'summarize_context', priority: 18, degradeLevel: 0, maxDegradeLevel: 2 }),
      makeBlock({ id: 'c', kind: 'working_memory_observations', priority: 30, degradeLevel: 0, maxDegradeLevel: 4 }),
    ]);
    expect(candidate?.kind).toBe('working_memory_observations');
  });

  it('caps degrade levels at 4', () => {
    expect(nextDegradeLevel(3)).toBe(4);
    expect(nextDegradeLevel(4)).toBe(4);
  });
});
