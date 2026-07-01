import { resolveLlmWriteChannelFromRaw } from './parse-llm-write-channel.util';

describe('resolveLlmWriteChannelFromRaw', () => {
  it('uses explicit writeChannel when provided', () => {
    expect(
      resolveLlmWriteChannelFromRaw({
        route: 'orchestrated_task',
        writeChannel: 'http',
      }),
    ).toBe('http');
  });

  it('maps legacy hostMutationIntent on orchestrated to http', () => {
    expect(
      resolveLlmWriteChannelFromRaw({
        route: 'orchestrated_task',
        hostMutationIntent: true,
      }),
    ).toBe('http');
  });

  it('maps on_page_task without writeChannel to host', () => {
    expect(
      resolveLlmWriteChannelFromRaw({
        route: 'on_page_task',
        writeChannel: 'none',
      }),
    ).toBe('host');
  });

  it('returns none for read-only orchestrated', () => {
    expect(
      resolveLlmWriteChannelFromRaw({
        route: 'orchestrated_task',
        writeChannel: 'none',
      }),
    ).toBe('none');
  });
});
