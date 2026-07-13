import { resolveDraftWriteChannelFromRouteLlm } from './parse-llm-write-channel.util';

describe('resolveDraftWriteChannelFromRouteLlm', () => {
  it('maps mutation task kind to http draft', () => {
    expect(
      resolveDraftWriteChannelFromRouteLlm({
        route: 'orchestrated_task',
        pageContextTaskKind: 'mutation',
      }),
    ).toBe('http');
  });

  it('maps on_page_task to host draft', () => {
    expect(
      resolveDraftWriteChannelFromRouteLlm({
        route: 'on_page_task',
        pageContextTaskKind: 'none',
      }),
    ).toBe('host');
  });

  it('returns none for analyze on orchestrated route', () => {
    expect(
      resolveDraftWriteChannelFromRouteLlm({
        route: 'orchestrated_task',
        pageContextTaskKind: 'analyze',
      }),
    ).toBe('none');
  });

  it('returns none for answer on orchestrated route', () => {
    expect(
      resolveDraftWriteChannelFromRouteLlm({
        route: 'orchestrated_task',
        pageContextTaskKind: 'answer',
      }),
    ).toBe('none');
  });
});
