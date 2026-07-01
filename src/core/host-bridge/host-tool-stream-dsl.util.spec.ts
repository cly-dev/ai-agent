import { dispatchHostActionSse } from './host-action-dispatch.util';
import { dispatchHostActionInstant } from './host-action-instant-dispatch.util';
import { buildHostActionPayload } from './host-action.util';
import type { HostActionSsePayload } from './host-action.types';
import {
  HOST_TOOL_STREAM_PROTOCOL_VERSION,
  isHostActionBatchPayload,
  isHostActionStreamPayload,
} from './host-tool-stream.types';
import { HostToolStreamSession } from './host-tool-stream-session.util';
import {
  buildHostToolStreamId,
  resolvePlanReasonHostFillTools,
  resolvePlanReasonHostStreamDelivery,
} from './host-tool-stream-target.util';
import { shouldReplayHostAction } from './host-tool-stream-replay.util';
import {
  buildHostToolStreamObservation,
  isHostToolStreamAlreadyDispatched,
} from './host-tool-stream-observation.util';
import type { HostActionEventPublisher } from './host-action-dispatch.util';

function captureHostActionPublisher(): {
  frames: HostActionSsePayload[];
  publish: HostActionEventPublisher;
} {
  const frames: HostActionSsePayload[] = [];
  return {
    frames,
    publish: (_sessionId, envelope) => {
      frames.push(envelope.payload);
    },
  };
}

function streamFrames(frames: HostActionSsePayload[]) {
  return frames.filter(isHostActionStreamPayload);
}

function dslOps(frames: HostActionSsePayload[]): string[] {
  return streamFrames(frames).map((frame) => frame.dsl?.op ?? '(full)');
}

describe('HostToolStreamSession', () => {
  const baseConfig = {
    sessionId: 'chat-session-1',
    pageContext: { page: 'demo', entity: { id: '42' } },
    runId: 10,
    turnId: 20,
    planStepId: 'host-step-1',
    generation: 3,
  };

  it('dispatchInstant emits instant profile with tool.flush per tool', () => {
    const { frames, publish } = captureHostActionPublisher();
    const session = new HostToolStreamSession({ ...baseConfig, publish });
    const streamId = 'hs-10-20-step';

    const full = session.dispatchInstant({
      streamId,
      hostTools: [
        { name: 'save_draft', args: { text: 'hello' } },
        { name: 'notify', args: { channel: 'toast' } },
      ],
      reason: 'plan_host_tool',
    });

    expect(session.isClosed).toBe(true);
    expect(dslOps(frames)).toEqual([
      'session.begin',
      'tool.begin',
      'tool.flush',
      'tool.commit',
      'tool.begin',
      'tool.flush',
      'tool.commit',
      'session.end',
      '(full)',
    ]);

    const flushOps = streamFrames(frames)
      .map((f) => f.dsl)
      .filter((dsl) => dsl?.op === 'tool.flush');
    expect(flushOps).toHaveLength(2);
    expect(flushOps[0]).toMatchObject({
      callId: `${streamId}:0`,
      name: 'save_draft',
      args: { text: 'hello' },
    });

    expect(isHostActionStreamPayload(full)).toBe(true);
    if (isHostActionStreamPayload(full)) {
      expect(full.stream.mode).toBe('full');
      expect(full.v).toBe(HOST_TOOL_STREAM_PROTOCOL_VERSION);
      expect(full.hostTools).toHaveLength(2);
      expect(full.generation).toBe(3);
      expect(full.reason).toBe('plan_host_tool');
    }
  });

  it('uses monotonic seq across instant profile frames', () => {
    const { frames, publish } = captureHostActionPublisher();
    const session = new HostToolStreamSession({ ...baseConfig, publish });

    session.dispatchInstant({
      streamId: 'hs-1-1-a',
      hostTools: [{ name: 'fill', args: { text: 'x' } }],
    });

    const seqs = streamFrames(frames).map((f) => f.stream.seq);
    expect(seqs).toEqual([1, 2, 3, 4, 5, 6]);
    for (let i = 1; i < seqs.length; i += 1) {
      expect(seqs[i]).toBeGreaterThan(seqs[i - 1]!);
    }
  });

  it('fill_stream profile emits arg.append then mode full', () => {
    const { frames, publish } = captureHostActionPublisher();
    const session = new HostToolStreamSession({
      ...baseConfig,
      publish,
      reason: 'page_action_host_fill',
    });
    const streamId = 'pa-99-fill';

    session.begin({
      streamId,
      tools: [{ name: 'fill_draft', streamablePath: 'text' }],
      reason: 'page_action_host_fill',
    });
    session.appendFillChunk('Hel');
    session.appendFillChunk('lo');
    const result = session.finalize({
      hostTools: [{ name: 'fill_draft', args: { text: 'Hello' } }],
    });

    expect(result.appendCount).toBe(2);
    expect(dslOps(frames)).toEqual([
      'session.begin',
      'tool.begin',
      'arg.append',
      'arg.append',
      'tool.commit',
      'session.end',
      '(full)',
    ]);

    const appendChunks = streamFrames(frames)
      .map((f) => f.dsl)
      .filter((dsl) => dsl?.op === 'arg.append')
      .map((dsl) => (dsl as { chunk: string }).chunk);
    expect(appendChunks).toEqual(['Hel', 'lo']);
    expect(result.fullPayload.hostTools).toEqual([
      { name: 'fill_draft', args: { text: 'Hello' } },
    ]);
  });

  it('throws when dispatchInstant called on closed session', () => {
    const { publish } = captureHostActionPublisher();
    const session = new HostToolStreamSession({ ...baseConfig, publish });
    session.dispatchInstant({
      streamId: 'hs-1-1-a',
      hostTools: [{ name: 'a', args: {} }],
    });
    expect(() =>
      session.dispatchInstant({
        streamId: 'hs-1-1-b',
        hostTools: [{ name: 'b', args: {} }],
      }),
    ).toThrow(/already closed/);
  });
});

describe('dispatchHostActionInstant', () => {
  it('returns null and emits nothing for empty hostTools', () => {
    const { frames, publish } = captureHostActionPublisher();
    const result = dispatchHostActionInstant(publish, 's1', {
      runId: 1,
      turnId: 2,
      hostTools: [],
    });
    expect(result).toBeNull();
    expect(frames).toHaveLength(0);
  });

  it('builds default streamId from planStepId', () => {
    const { frames, publish } = captureHostActionPublisher();
    dispatchHostActionInstant(publish, 's1', {
      runId: 5,
      turnId: 6,
      planStepId: 'host-step-7',
      hostTools: [{ name: 'run_action', args: { ok: true } }],
      reason: 'agent_mutation_success',
    });

    const begin = streamFrames(frames).find((f) => f.dsl?.op === 'session.begin');
    expect(begin?.dsl).toMatchObject({
      streamId: buildHostToolStreamId({
        runId: 5,
        turnId: 6,
        stepId: 'host-step-7',
      }),
    });
  });
});

describe('buildHostActionPayload', () => {
  it('returns v1 mode full snapshot envelope', () => {
    const payload = buildHostActionPayload({
      pageContext: { page: 'demo' },
      runId: 1,
      turnId: 2,
      hostTools: [{ name: 'fill', args: { text: 'done' } }],
      planStepId: 'p1',
      reason: 'plan_host_tool',
    });

    expect(isHostActionBatchPayload(payload)).toBe(false);
    expect(isHostActionStreamPayload(payload)).toBe(true);
    if (isHostActionStreamPayload(payload)) {
      expect(payload.v).toBe(1);
      expect(payload.stream.mode).toBe('full');
      expect(payload.hostTools).toEqual([{ name: 'fill', args: { text: 'done' } }]);
    }
  });
});

describe('dispatchHostActionSse', () => {
  it('skips v0 batch with empty hostTools', () => {
    const { frames, publish } = captureHostActionPublisher();
    dispatchHostActionSse(publish, 's1', {
      action: 'host_action',
      hostTools: [],
    });
    expect(frames).toHaveLength(0);
  });

  it('skips v1 full with empty hostTools', () => {
    const { frames, publish } = captureHostActionPublisher();
    dispatchHostActionSse(publish, 's1', {
      action: 'host_action',
      v: 1,
      stream: { mode: 'full', seq: 1 },
      hostTools: [],
    });
    expect(frames).toHaveLength(0);
  });
});

describe('shouldReplayHostAction', () => {
  it('allows replay for v0 batch and v1 full only', () => {
    expect(
      shouldReplayHostAction({
        action: 'host_action',
        hostTools: [{ name: 'a', args: {} }],
      }),
    ).toBe(true);
    expect(
      shouldReplayHostAction({
        action: 'host_action',
        v: 1,
        stream: { mode: 'full', seq: 3 },
        hostTools: [{ name: 'a', args: {} }],
      }),
    ).toBe(true);
    expect(
      shouldReplayHostAction({
        action: 'host_action',
        v: 1,
        stream: { mode: 'delta', seq: 2 },
        dsl: {
          op: 'arg.append',
          streamId: 'x',
          callId: 'x:0',
          path: 'text',
          chunk: 'a',
        },
      }),
    ).toBe(false);
  });
});

describe('resolvePlanReasonHostStreamDelivery', () => {
  const fillTools = [{ name: 'fill', streamablePath: 'text' }];
  const base = {
    fillTools,
    runId: 1,
    turnId: 2,
    canPublishRun: true,
    reasonStepId: 'reason-step-9',
  };

  beforeEach(() => {
    delete process.env.HOST_TOOL_STREAM;
  });

  it('requires hostStepId for stream mode', () => {
    expect(
      resolvePlanReasonHostStreamDelivery({
        ...base,
        hostStepId: null,
      }).mode,
    ).toBe('observation');
  });

  it('anchors stream on hostStepId', () => {
    const delivery = resolvePlanReasonHostStreamDelivery({
      ...base,
      hostStepId: 'host-step-3',
    });
    expect(delivery.mode).toBe('stream');
    if (delivery.mode === 'stream') {
      expect(delivery.target.hostStepId).toBe('host-step-3');
      expect(delivery.target.streamId).toBe('hs-1-2-host-step-3');
      expect(delivery.target.reasonStepId).toBe('reason-step-9');
    }
  });

  it('falls back to observation when stream disabled', () => {
    process.env.HOST_TOOL_STREAM = '0';
    expect(
      resolvePlanReasonHostStreamDelivery({
        ...base,
        hostStepId: 'host-step-3',
      }).mode,
    ).toBe('observation');
  });
});

describe('isHostToolStreamAlreadyDispatched', () => {
  it('matches hostStepId on stream observation', () => {
    const observations = [
      buildHostToolStreamObservation({
        outcome: 'dispatched',
        hostStepId: 'host-9',
        streamId: 'hs-1-2-host-9',
        hostTools: [{ name: 'fill', args: { text: 'x' } }],
        streamablePath: 'text',
      }),
    ];
    expect(isHostToolStreamAlreadyDispatched(observations, 'host-9')).toBe(true);
    expect(isHostToolStreamAlreadyDispatched(observations, 'other')).toBe(
      false,
    );
  });

  it('ignores failed stream observations', () => {
    const observations = [
      buildHostToolStreamObservation({
        outcome: 'failed',
        hostStepId: 'host-9',
        streamId: 'hs-1-2-host-9',
        hostTools: [],
        streamablePath: 'text',
      }),
    ];
    expect(isHostToolStreamAlreadyDispatched(observations, 'host-9')).toBe(
      false,
    );
  });
});

describe('resolvePlanReasonHostFillTools', () => {
  it('resolves streamable string field from argsSchema', () => {
    const tools = resolvePlanReasonHostFillTools({
      hostTools: [
        {
          id: 1,
          name: 'fill_draft',
          description: 'fill',
          argsSchema: {
            type: 'object',
            properties: { text: { type: 'string' } },
          },
        },
        {
          id: 2,
          name: 'click_save',
          description: 'save',
          argsSchema: {
            type: 'object',
            properties: { id: { type: 'number' } },
          },
        },
      ],
      allowedToolNames: new Set(['fill_draft', 'click_save']),
    });
    expect(tools).toEqual([{ name: 'fill_draft', streamablePath: 'text' }]);
  });
});
