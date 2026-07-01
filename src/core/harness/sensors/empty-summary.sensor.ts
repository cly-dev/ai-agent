import type { HarnessSensorResult } from '../harness.types';

export type EmptySummarySensorPayload = {
  summaryText?: string | null;
  mode?: string | null;
};

export const emptySummarySensor = {
  name: 'empty-summary',
  run(
    _ctx: { nodeId: string; action: string },
    payload: unknown,
  ): HarnessSensorResult {
    const data = (payload ?? {}) as EmptySummarySensorPayload;
    const mode = data.mode ?? 'final';
    if (mode === 'draft') {
      return { name: 'empty-summary', verdict: 'pass' };
    }
    const summaryText = data.summaryText?.trim() ?? '';
    if (summaryText.length > 0) {
      return { name: 'empty-summary', verdict: 'pass' };
    }
    return {
      name: 'empty-summary',
      verdict: 'fail',
      code: 'SUMMARY_EMPTY',
      message: 'summaryText is empty after summarize',
    };
  },
};
