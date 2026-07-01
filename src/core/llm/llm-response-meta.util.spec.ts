import { extractLlmTokenUsageFromResponseMeta } from './llm-response-meta.util';

describe('llm-response-meta.util', () => {
  it('extracts prompt and completion tokens from token_usage', () => {
    expect(
      extractLlmTokenUsageFromResponseMeta({
        token_usage: { prompt_tokens: 11, completion_tokens: 4 },
      }),
    ).toEqual({ promptTokens: 11, completionTokens: 4 });
  });

  it('returns null when usage metadata is absent', () => {
    expect(extractLlmTokenUsageFromResponseMeta(undefined)).toBeNull();
    expect(extractLlmTokenUsageFromResponseMeta({})).toBeNull();
  });
});
