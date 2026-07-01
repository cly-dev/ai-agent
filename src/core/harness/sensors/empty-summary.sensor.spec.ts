import { emptySummarySensor } from './empty-summary.sensor';

describe('empty-summary.sensor', () => {
  const ctx = { nodeId: 'summarize', action: 'summarize' };

  it('passes when summaryText is non-empty for final mode', () => {
    expect(
      emptySummarySensor.run(ctx, {
        summaryText: 'Done.',
        mode: 'final',
      }),
    ).toEqual({ name: 'empty-summary', verdict: 'pass' });
  });

  it('passes for draft mode even when summaryText is empty', () => {
    expect(
      emptySummarySensor.run(ctx, {
        summaryText: '',
        mode: 'draft',
      }),
    ).toEqual({ name: 'empty-summary', verdict: 'pass' });
  });

  it('fails with SUMMARY_EMPTY when final mode has empty summaryText', () => {
    expect(
      emptySummarySensor.run(ctx, {
        summaryText: '   ',
        mode: 'final',
      }),
    ).toEqual({
      name: 'empty-summary',
      verdict: 'fail',
      code: 'SUMMARY_EMPTY',
      message: 'summaryText is empty after summarize',
    });
  });
});
