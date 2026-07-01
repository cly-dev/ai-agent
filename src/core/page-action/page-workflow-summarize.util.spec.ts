import type { AIMessage } from '@langchain/core/messages';
import type { Response } from 'express';
import { executePageWorkflowSummarize } from './page-workflow-summarize.util';

function mockResponse(writableEnded = false): Response {
  return { writableEnded } as Response;
}

describe('page-workflow-summarize.util', () => {
  it('invokes LLM and emits lifecycle for summarize-only path', async () => {
    const write = jest.fn();
    const end = jest.fn();
    const res = {
      writableEnded: false,
      write,
      end,
      writable: true,
    } as unknown as Response;

    const llmService = {
      createLangChainChatModelForMessages: jest.fn().mockResolvedValue({
        model: {
          invoke: jest.fn().mockResolvedValue({
            content: 'Summary answer',
            response_metadata: {
              model_name: 'test-model',
              token_usage: { prompt_tokens: 12, completion_tokens: 4 },
            },
          } satisfies Partial<AIMessage>),
        },
        messages: [{ role: 'user', content: 'go' }],
      }),
    };

    const result = await executePageWorkflowSummarize({
      llmService: llmService as never,
      messages: [{ role: 'user', content: 'go' }],
      nodeInput: { mode: 'final' },
      res,
      actionRunId: 9,
      actionKey: 'explain',
      generation: 9,
      existingFillText: '',
    });

    expect(result.summaryText).toBe('Summary answer');
    expect(result.model).toBe('test-model');
    expect(result.promptTokens).toBe(12);
    expect(result.completionTokens).toBe(4);
    expect(result.emittedLifecycle).toBe(true);
    expect(write).toHaveBeenCalled();
  });

  it('does not emit lifecycle when fillText already exists', async () => {
    const write = jest.fn();
    const res = {
      writableEnded: false,
      write,
    } as unknown as Response;
    const llmService = {
      createLangChainChatModelForMessages: jest.fn().mockResolvedValue({
        model: {
          invoke: jest.fn().mockResolvedValue({
            content: 'Supplementary',
            response_metadata: {},
          }),
        },
        messages: [],
      }),
    };

    const result = await executePageWorkflowSummarize({
      llmService: llmService as never,
      messages: [],
      nodeInput: {},
      res,
      actionRunId: 1,
      actionKey: 'fill',
      generation: 1,
      existingFillText: 'host output',
    });

    expect(result.summaryText).toBe('Supplementary');
    expect(result.emittedLifecycle).toBe(false);
    expect(write).not.toHaveBeenCalled();
  });
});
