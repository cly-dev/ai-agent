import {
  applySummarizeFillText,
  buildPageWorkflowOutputRef,
  mergePageWorkflowLlmMetrics,
} from './page-workflow-node.util';
import { shouldEmitPageSummarizeLifecycle } from './page-workflow-summarize.util';

describe('page-workflow-node.util', () => {
  it('buildPageWorkflowOutputRef uses action and nodeId', () => {
    expect(buildPageWorkflowOutputRef('fetch_data', 'load_review')).toBe(
      'obs:fetch_data:load_review',
    );
  });

  it('mergePageWorkflowLlmMetrics accumulates token counts', () => {
    const metrics = {
      model: null as string | null,
      promptTokens: null as number | null,
      completionTokens: null as number | null,
    };
    mergePageWorkflowLlmMetrics(metrics, {
      model: 'gpt-test',
      promptTokens: 10,
      completionTokens: 5,
    });
    mergePageWorkflowLlmMetrics(metrics, {
      model: null,
      promptTokens: 3,
      completionTokens: 2,
    });
    expect(metrics).toEqual({
      model: 'gpt-test',
      promptTokens: 13,
      completionTokens: 7,
    });
  });

  it('applySummarizeFillText keeps existing fillText and ignores draft', () => {
    expect(
      applySummarizeFillText({
        fillText: 'host fill',
        summaryText: 'summary',
        mode: 'final',
      }),
    ).toBe('host fill');
    expect(
      applySummarizeFillText({
        fillText: '',
        summaryText: 'summary only',
        mode: 'draft',
      }),
    ).toBe('');
    expect(
      applySummarizeFillText({
        fillText: '',
        summaryText: 'summary only',
        mode: 'final',
      }),
    ).toBe('summary only');
  });
});

describe('shouldEmitPageSummarizeLifecycle', () => {
  it('emits only for user-facing summarize with no prior fillText', () => {
    expect(
      shouldEmitPageSummarizeLifecycle({
        mode: 'final',
        existingFillText: '',
        summaryText: 'Hello',
        responseWritable: true,
      }),
    ).toBe(true);
    expect(
      shouldEmitPageSummarizeLifecycle({
        mode: 'draft',
        existingFillText: '',
        summaryText: 'Hello',
        responseWritable: true,
      }),
    ).toBe(false);
    expect(
      shouldEmitPageSummarizeLifecycle({
        mode: 'final',
        existingFillText: 'already filled',
        summaryText: 'Hello',
        responseWritable: true,
      }),
    ).toBe(false);
    expect(
      shouldEmitPageSummarizeLifecycle({
        mode: 'final',
        existingFillText: '',
        summaryText: 'Hello',
        responseWritable: false,
      }),
    ).toBe(false);
  });
});
