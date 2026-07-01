import { runPageWorkflow } from './page-workflow.runner';
import type { WorkflowNodeDef } from '../workflow/workflow.types';

jest.mock('./page-action-host-fill.executor', () => ({
  executePageActionHostFill: jest.fn(),
}));

jest.mock('./page-workflow-fetch-data.util', () => ({
  executePageWorkflowFetchData: jest.fn(),
}));

jest.mock('./page-workflow-summarize.util', () => ({
  executePageWorkflowSummarize: jest.fn(),
  shouldEmitPageSummarizeLifecycle: jest.requireActual(
    './page-workflow-summarize.util',
  ).shouldEmitPageSummarizeLifecycle,
}));

import { executePageActionHostFill } from './page-action-host-fill.executor';
import { executePageWorkflowFetchData } from './page-workflow-fetch-data.util';
import { executePageWorkflowSummarize } from './page-workflow-summarize.util';

const summarizeNodes: WorkflowNodeDef[] = [
  {
    id: 'load',
    action: 'load_page_context',
    name: 'Load',
    objective: 'Load page',
    input: {},
  },
  {
    id: 'answer',
    action: 'summarize',
    name: 'Answer',
    objective: 'Explain page',
    input: { mode: 'final' },
  },
];

describe('page-workflow.runner', () => {
  const res = { writableEnded: false } as never;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs load_page_context then summarize and sets fillText from summary', async () => {
    jest.mocked(executePageWorkflowSummarize).mockResolvedValue({
      summaryText: 'Page summary',
      model: 'm1',
      promptTokens: 8,
      completionTokens: 2,
      emittedLifecycle: true,
    });

    const result = await runPageWorkflow({
      workflowId: 1,
      version: 1,
      nodes: summarizeNodes,
      systemPrompt: 'sys',
      messages: [{ role: 'system', content: 'sys' }],
      pageContext: { page: 'home' },
      hostTool: {} as never,
      llmService: {} as never,
      prisma: {} as never,
      toolEngine: {} as never,
      userId: 1,
      appClientId: 2,
      actionRunId: 10,
      actionKey: 'explain',
      generation: 10,
      res,
    });

    expect(result.workflowRun.status).toBe('completed');
    expect(result.fillText).toBe('Page summary');
    expect(result.errorCode).toBeUndefined();
    expect(executePageWorkflowSummarize).toHaveBeenCalledTimes(1);
    expect(result.steps.some((step) => step.name === 'answer:sensors')).toBe(
      true,
    );
  });

  it('fail-fast when summarize sensor returns SUMMARY_EMPTY', async () => {
    jest.mocked(executePageWorkflowSummarize).mockResolvedValue({
      summaryText: '',
      model: null,
      promptTokens: null,
      completionTokens: null,
      emittedLifecycle: false,
    });

    const result = await runPageWorkflow({
      workflowId: 1,
      version: 1,
      nodes: summarizeNodes,
      systemPrompt: 'sys',
      messages: [],
      pageContext: null,
      hostTool: {} as never,
      llmService: {} as never,
      prisma: {} as never,
      toolEngine: {} as never,
      userId: 1,
      appClientId: 2,
      actionRunId: 11,
      actionKey: 'explain',
      generation: 11,
      res,
    });

    expect(result.errorCode).toBe('SUMMARY_EMPTY');
    expect(result.workflowRun.status).toBe('failed');
    expect(result.fillText).toBe('');
  });

  it('runs fetch_data before generate_and_push with node output chaining', async () => {
    const nodes: WorkflowNodeDef[] = [
      {
        id: 'fetch',
        action: 'fetch_data',
        name: 'Fetch',
        objective: 'Fetch',
        input: { toolId: 7 },
      },
      {
        id: 'push',
        action: 'generate_and_push',
        name: 'Push',
        objective: 'Fill form',
        input: { hostToolId: 3 },
      },
    ];
    jest.mocked(executePageWorkflowFetchData).mockResolvedValue({
      name: 'get_item',
      output: { id: 1 },
      args: { id: 1 },
      toolId: 7,
      toolName: 'get_item',
      agentMetadata: null,
    });
    jest.mocked(executePageActionHostFill).mockResolvedValue({
      fillText: 'filled',
      dslOutcome: 'dispatched',
      model: 'm',
      promptTokens: 1,
      completionTokens: 1,
      streamId: 's',
      llmCallCount: 1,
      appendCount: 1,
      steps: [],
    });

    const result = await runPageWorkflow({
      workflowId: 2,
      version: 1,
      nodes,
      systemPrompt: 'sys',
      messages: [{ role: 'system', content: 'sys' }],
      pageContext: null,
      hostTool: {} as never,
      llmService: {} as never,
      prisma: {} as never,
      toolEngine: {} as never,
      userId: 1,
      appClientId: 2,
      actionRunId: 12,
      actionKey: 'fill',
      generation: 12,
      res,
    });

    expect(result.workflowRun.status).toBe('completed');
    expect(result.fillText).toBe('filled');
    expect(executePageWorkflowFetchData).toHaveBeenCalled();
    expect(executePageActionHostFill).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('obs:fetch_data:fetch'),
          }),
        ]),
      }),
    );
  });
});
