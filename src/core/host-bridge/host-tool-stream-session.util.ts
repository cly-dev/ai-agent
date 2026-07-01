import {
  dispatchHostActionSse,
  type HostActionEventPublisher,
} from './host-action-dispatch.util';
import { resolveHostActionMetadata } from './host-action.resolve.util';
import type {
  HostActionHostToolInvocation,
  HostActionSsePayload,
  HostToolDslOp,
} from './host-tool-stream.types';
import { HOST_TOOL_STREAM_PROTOCOL_VERSION } from './host-tool-stream.types';
import type { AgentChatPageContext } from './page-context.types';
import { resolveHostToolPageScope } from './page-context-anchor.util';
import { HOST_TOOL_STREAM_REASON } from './host-tool-stream-target.util';

export type HostToolStreamFinalizeResult = {
  streamId: string;
  hostTools: HostActionHostToolInvocation[];
  appendCount: number;
  fullPayload: HostActionSsePayload;
};

type ActiveCall = {
  callId: string;
  index: number;
  name: string;
  streamablePath: string;
};

/** Host Tool DSL v1 会话：集中发 begin / append / commit / full 帧。 */
export class HostToolStreamSession {
  private seq = 0;
  private streamId: string | null = null;
  private calls: ActiveCall[] = [];
  private appendEmittedCount = 0;
  private closed = false;

  constructor(
    private readonly config: {
      publish: HostActionEventPublisher;
      sessionId: string;
      pageContext: AgentChatPageContext;
      runId: number;
      turnId: number;
      planStepId?: string | null;
      hostStepId?: string | null;
      reason?: string;
      generation?: number;
    },
  ) {}

  get activeStreamId(): string | null {
    return this.streamId;
  }

  get isClosed(): boolean {
    return this.closed;
  }

  get hasBegun(): boolean {
    return this.streamId != null;
  }

  private hostStepIdField(): string | undefined {
    const id =
      this.config.hostStepId?.trim() || this.config.planStepId?.trim();
    return id ? id : undefined;
  }

  private hostStepIdPayload(): {
    hostStepId: string;
    planStepId: string;
  } | undefined {
    const id = this.hostStepIdField();
    if (!id) {
      return undefined;
    }
    return { hostStepId: id, planStepId: id };
  }

  begin(input: {
    streamId: string;
    tools: Array<{ name: string; streamablePath: string }>;
    reason?: string;
  }): void {
    if (this.closed) {
      return;
    }
    const reason = input.reason ?? this.config.reason ?? HOST_TOOL_STREAM_REASON;
    this.streamId = input.streamId;
    this.emitFrame(
      'begin',
      {
        op: 'session.begin',
        streamId: input.streamId,
        scope: this.scope(),
        entity: this.entity(),
        ...(this.metadata() ? { metadata: this.metadata() } : {}),
        reason,
        ...(this.hostStepIdPayload() ?? {}),
        runId: this.config.runId,
        turnId: this.config.turnId,
      },
      reason,
    );

    this.calls = input.tools.map((tool, index) => {
      const callId = `${input.streamId}:${index}`;
      this.emitFrame(
        'delta',
        {
          op: 'tool.begin',
          streamId: input.streamId,
          callId,
          index,
          name: tool.name,
        },
        reason,
      );
      return {
        callId,
        index,
        name: tool.name,
        streamablePath: tool.streamablePath,
      };
    });
  }

  get appendCount(): number {
    return this.appendEmittedCount;
  }

  get hasActiveStream(): boolean {
    return this.streamId != null && !this.closed;
  }

  /** 向每个 tool call 按其 streamablePath 追加同一段 sanitize 后的文本。 */
  appendFillChunk(chunk: string): void {
    if (!this.streamId || this.closed || !chunk) {
      return;
    }
    const reason = this.config.reason ?? HOST_TOOL_STREAM_REASON;
    for (const call of this.calls) {
      this.emitFrame(
        'delta',
        {
          op: 'arg.append',
          streamId: this.streamId,
          callId: call.callId,
          path: call.streamablePath,
          chunk,
        },
        reason,
      );
    }
    this.appendEmittedCount += 1;
  }

  finalize(input: {
    hostTools: HostActionHostToolInvocation[];
    reason?: string;
  }): HostToolStreamFinalizeResult {
    const streamId = this.streamId!;
    const reason =
      input.reason ?? this.config.reason ?? HOST_TOOL_STREAM_REASON;
    for (const call of this.calls) {
      this.emitFrame(
        'commit',
        {
          op: 'tool.commit',
          streamId,
          callId: call.callId,
        },
        reason,
      );
    }
    this.emitFrame(
      'end',
      {
        op: 'session.end',
        streamId,
      },
      reason,
    );

    const fullPayload = this.buildAndEmitFullPayload(
      input.hostTools,
      input.reason,
    );
    this.closed = true;
    return {
      streamId,
      hostTools: input.hostTools,
      appendCount: this.appendEmittedCount,
      fullPayload,
    };
  }

  /**
   * 动作类 instant dispatch：完整 DSL 帧序（无 arg.append）。
   * tool.begin → tool.flush → tool.commit × N → session.end → mode=full。
   */
  dispatchInstant(input: {
    streamId: string;
    hostTools: HostActionHostToolInvocation[];
    reason?: string;
  }): HostActionSsePayload {
    if (this.closed) {
      throw new Error('HostToolStreamSession already closed');
    }
    if (input.hostTools.length === 0) {
      this.closed = true;
      throw new Error('dispatchInstant requires at least one host tool');
    }

    const streamId = input.streamId;
    const reason = input.reason ?? this.config.reason ?? HOST_TOOL_STREAM_REASON;
    this.streamId = streamId;

    this.emitFrame(
      'begin',
      {
        op: 'session.begin',
        streamId,
        scope: this.scope(),
        entity: this.entity(),
        ...(this.metadata() ? { metadata: this.metadata() } : {}),
        reason,
        ...(this.hostStepIdPayload() ?? {}),
        runId: this.config.runId,
        turnId: this.config.turnId,
      },
      reason,
    );

    for (const [index, tool] of input.hostTools.entries()) {
      const callId = `${streamId}:${index}`;
      this.emitFrame(
        'delta',
        {
          op: 'tool.begin',
          streamId,
          callId,
          index,
          name: tool.name,
        },
        reason,
      );
      this.emitFrame(
        'delta',
        {
          op: 'tool.flush',
          streamId,
          callId,
          name: tool.name,
          args: tool.args,
        },
        reason,
      );
      this.emitFrame(
        'commit',
        {
          op: 'tool.commit',
          streamId,
          callId,
        },
        reason,
      );
    }

    this.emitFrame(
      'end',
      {
        op: 'session.end',
        streamId,
      },
      reason,
    );

    const fullPayload = this.buildAndEmitFullPayload(input.hostTools, reason);
    this.closed = true;
    this.streamId = null;
    this.calls = [];
    return fullPayload;
  }

  abort(options?: { emitSessionEnd?: boolean }): void {
    if (
      options?.emitSessionEnd &&
      this.streamId &&
      !this.closed
    ) {
      this.emitFrame('end', {
        op: 'session.end',
        streamId: this.streamId,
      });
    }
    this.closed = true;
    this.streamId = null;
    this.calls = [];
  }

  private scope(): string | undefined {
    return resolveHostToolPageScope(this.config.pageContext) ?? undefined;
  }

  private entity(): Record<string, unknown> | undefined {
    return this.config.pageContext.entity
      ? ({ ...this.config.pageContext.entity } as Record<string, unknown>)
      : undefined;
  }

  private metadata(): Record<string, unknown> | undefined {
    return resolveHostActionMetadata(this.config.pageContext);
  }

  private buildAndEmitFullPayload(
    hostTools: HostActionHostToolInvocation[],
    reason?: string,
  ): HostActionSsePayload {
    this.seq += 1;
    const fullPayload: HostActionSsePayload = {
      action: 'host_action',
      v: HOST_TOOL_STREAM_PROTOCOL_VERSION,
      stream: { mode: 'full', seq: this.seq },
      scope: this.scope(),
      entity: this.entity(),
      ...(this.metadata() ? { metadata: this.metadata() } : {}),
      hostTools,
      ...(this.hostStepIdPayload() ?? {}),
      reason: reason ?? this.config.reason ?? HOST_TOOL_STREAM_REASON,
      runId: this.config.runId,
      turnId: this.config.turnId,
      ...(this.config.generation != null
        ? { generation: this.config.generation }
        : {}),
    };
    dispatchHostActionSse(
      this.config.publish,
      this.config.sessionId,
      fullPayload,
    );
    return fullPayload;
  }

  private emitFrame(
    mode: 'begin' | 'delta' | 'commit' | 'end',
    dsl: HostToolDslOp,
    reasonOverride?: string,
  ): void {
    this.seq += 1;
    dispatchHostActionSse(this.config.publish, this.config.sessionId, {
      action: 'host_action',
      v: HOST_TOOL_STREAM_PROTOCOL_VERSION,
      stream: { mode, seq: this.seq },
      dsl,
      scope: this.scope(),
      entity: this.entity(),
      ...(this.metadata() ? { metadata: this.metadata() } : {}),
      ...(this.hostStepIdPayload() ?? {}),
      reason:
        reasonOverride ?? this.config.reason ?? HOST_TOOL_STREAM_REASON,
      runId: this.config.runId,
      turnId: this.config.turnId,
      ...(this.config.generation != null
        ? { generation: this.config.generation }
        : {}),
    });
  }
}
