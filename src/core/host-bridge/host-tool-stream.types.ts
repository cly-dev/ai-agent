/**
 * Host Tool 流式 DSL 协议类型（规范 v1）。
 * 规范文档：docs/host-tool-stream-dsl-frontend.md
 *
 * 实现状态：类型已定稿；服务端 dispatch 与 SDK 消费待落地。
 */

export const HOST_TOOL_STREAM_PROTOCOL_VERSION = 1 as const;

/** 与 message SSE 对齐的流控模式。 */
export type HostToolStreamMode =
  | 'begin'
  | 'delta'
  | 'commit'
  | 'end'
  | 'full';

export type HostToolStreamControl = {
  mode: HostToolStreamMode;
  /** 单轮 host 流内单调递增，用于去重与排序。 */
  seq: number;
};

// --- DSL ops（`dsl.op` 判别）---

export type HostToolDslSessionBegin = {
  op: 'session.begin';
  streamId: string;
  scope?: string;
  entity?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  reason?: string;
  planStepId?: string;
  runId?: number;
  turnId?: number;
};

export type HostToolDslSessionEnd = {
  op: 'session.end';
  streamId: string;
};

export type HostToolDslToolBegin = {
  op: 'tool.begin';
  streamId: string;
  /** 单 session 内唯一，建议 `${streamId}:${index}`。 */
  callId: string;
  index: number;
  name: string;
};

export type HostToolDslArgSet = {
  op: 'arg.set';
  streamId: string;
  callId: string;
  /** JSON Pointer 风格路径，如 `text`、`payload.body`。 */
  path: string;
  value: unknown;
};

export type HostToolDslArgAppend = {
  op: 'arg.append';
  streamId: string;
  callId: string;
  path: string;
  chunk: string;
};

export type HostToolDslToolCommit = {
  op: 'tool.commit';
  streamId: string;
  callId: string;
};

export type HostToolDslToolFlush = {
  op: 'tool.flush';
  streamId: string;
  callId: string;
  name: string;
  args: Record<string, unknown>;
};

export type HostToolDslOp =
  | HostToolDslSessionBegin
  | HostToolDslSessionEnd
  | HostToolDslToolBegin
  | HostToolDslArgSet
  | HostToolDslArgAppend
  | HostToolDslToolCommit
  | HostToolDslToolFlush;

// --- SSE payload ---

export type HostActionHostToolInvocation = {
  name: string;
  args: Record<string, unknown>;
};

/** 批量快照（v0 兼容；流式轮次末尾权威帧）。 */
export type HostActionBatchPayload = {
  action: 'host_action';
  scope?: string;
  entity?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  hostTools: HostActionHostToolInvocation[];
  planStepId?: string;
  reason?: string;
  runId?: number;
  turnId?: number;
};

/** 流式 DSL 帧（v1）。 */
export type HostActionStreamPayload = {
  action: 'host_action';
  v?: typeof HOST_TOOL_STREAM_PROTOCOL_VERSION;
  stream: HostToolStreamControl;
  dsl?: HostToolDslOp;
  /** mode=full 时携带；与 DSL 累积结果必须一致。 */
  scope?: string;
  entity?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  hostTools?: HostActionHostToolInvocation[];
  planStepId?: string;
  reason?: string;
  runId?: number;
  turnId?: number;
};

export type HostActionSsePayload = HostActionBatchPayload | HostActionStreamPayload;

export function isHostActionStreamPayload(
  payload: HostActionSsePayload,
): payload is HostActionStreamPayload {
  return (
    'stream' in payload &&
    payload.stream != null &&
    typeof payload.stream.mode === 'string'
  );
}

export function isHostActionBatchPayload(
  payload: HostActionSsePayload,
): payload is HostActionBatchPayload {
  return !isHostActionStreamPayload(payload);
}

// --- Host Tool 元数据（B 端 / C 端 register）---

export type HostToolStreamPolicy = 'instant' | 'stream' | 'auto';

export type HostToolStreamConfig = {
  /** 默认 false；true 时服务端按 policy 发 DSL 流。 */
  enabled?: boolean;
  policy?: HostToolStreamPolicy;
  /** 可 `arg.append` 的路径列表，如 `['text', 'content']`。 */
  streamablePaths?: string[];
  /** policy=auto 时，字符串长度 ≥ 阈值走 stream。默认 48。 */
  autoStreamMinChars?: number;
  /** Phase 1 伪流式切块大小（字符）。默认 16。 */
  chunkSize?: number;
  /**
   * append 时是否调用 handler。默认 false：仅更新累积器，commit/full 再执行。
   */
  invokeOnAppend?: boolean;
};
