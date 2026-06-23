# Host Tool 流式 DSL · 前端 SDK 实现指南

> **面向**：omnix-chat / 管理 B 端宿主  
> **协议**：[host-tool-stream-dsl-frontend.md](./host-tool-stream-dsl-frontend.md)  
> **类型镜像**：`src/core/host-bridge/host-tool-stream.types.ts`（可复制到前端 `types/host-tool-stream.ts`）

---

## 1. 你要实现什么

```text
SSE event: host_action
        │
        ├─ 无 stream ──────────► v0：一次性执行 hostTools[]
        │
        └─ 有 stream.mode
              begin/delta/commit/end ──► Reducer 累积 args + 触发 preview
              full ───────────────────► 权威对齐 + 最终 runHostTool
```

**渐进式 UI 的关键**：默认 `invokeOnAppend: false` —— `arg.append` 只更新 preview，**不**调 registry handler；`tool.commit` 或 `full` 再 final apply。

---

## 2. 目录建议（前端仓库）

```text
packages/host-bridge/
├── types/host-tool-stream.ts      # 从 agent-server 镜像
├── path-args.util.ts              # arg.set / arg.append 路径写入
├── host-tool-stream.reducer.ts    # 纯函数状态机
├── host-tool-stream.gate.ts       # scope / entity 门闩
├── use-host-tool-stream.ts        # React 绑定 SSE
└── host-tool-stream.mock.ts       # 本地 mock（后端 S1 未开时用）
```

---

## 3. 路径工具（`path-args.util.ts`）

```ts
/** 点路径写入，如 `payload.body` → nested object */
export function setByDotPath(
  root: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) return root;
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i]!;
    const next = cursor[key];
    if (next == null || typeof next !== 'object' || Array.isArray(next)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[segments[segments.length - 1]!] = value;
  return root;
}

/** 点路径字符串追加；路径不存在视为 "" */
export function appendByDotPath(
  root: Record<string, unknown>,
  path: string,
  chunk: string,
): Record<string, unknown> {
  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) return root;
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i]!;
    const next = cursor[key];
    if (next == null || typeof next !== 'object' || Array.isArray(next)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  const leaf = segments[segments.length - 1]!;
  const prev = cursor[leaf];
  const base = typeof prev === 'string' ? prev : '';
  cursor[leaf] = base + chunk;
  return root;
}

export function getByDotPath(root: Record<string, unknown>, path: string): unknown {
  const segments = path.split('.').filter(Boolean);
  let current: unknown = root;
  for (const seg of segments) {
    if (current == null || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}
```

---

## 4. Reducer（`host-tool-stream.reducer.ts`）

```ts
import type {
  HostActionHostToolInvocation,
  HostActionSsePayload,
  HostActionStreamPayload,
  HostToolDslOp,
  HostToolStreamConfig,
} from './types/host-tool-stream';
import { isHostActionStreamPayload } from './types/host-tool-stream';
import { appendByDotPath, setByDotPath } from './path-args.util';

export type CallAccumulator = {
  name: string;
  index: number;
  args: Record<string, unknown>;
  committed: boolean;
  flushed: boolean;
};

export type HostToolStreamSession = {
  streamId: string;
  scope?: string;
  entity?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  reason?: string;
  planStepId?: string;
  runId?: number;
  turnId?: number;
  calls: Map<string, CallAccumulator>;
  ended: boolean;
  lastSeq: number;
};

export type HostToolStreamReducerState = {
  session: HostToolStreamSession | null;
  /** 权威快照（full 或 v0 批量） */
  authoritative: HostActionHostToolInvocation[] | null;
};

export type HostToolStreamEffect =
  | { type: 'preview'; callId: string; name: string; args: Record<string, unknown> }
  | { type: 'commit'; call: HostActionHostToolInvocation }
  | { type: 'flush'; call: HostActionHostToolInvocation }
  | { type: 'batch'; payload: HostActionHostToolInvocation[]; reason?: string }
  | { type: 'reconcile'; payload: HostActionHostToolInvocation[] }
  | { type: 'warn'; message: string };

export type HostToolStreamReducerOptions = {
  /** 按 tool name 读取 streamConfig（来自 register） */
  getStreamConfig?: (toolName: string) => HostToolStreamConfig | undefined;
  onEffect?: (effect: HostToolStreamEffect) => void;
};

export function createInitialHostToolStreamState(): HostToolStreamReducerState {
  return { session: null, authoritative: null };
}

function ensureCall(
  session: HostToolStreamSession,
  callId: string,
  seed?: Partial<CallAccumulator>,
): CallAccumulator {
  let call = session.calls.get(callId);
  if (!call) {
    call = {
      name: seed?.name ?? '',
      index: seed?.index ?? session.calls.size,
      args: {},
      committed: false,
      flushed: false,
    };
    session.calls.set(callId, call);
  }
  if (seed?.name) call.name = seed.name;
  if (seed?.index != null) call.index = seed.index;
  return call;
}

function sortedCalls(session: HostToolStreamSession): HostActionHostToolInvocation[] {
  return [...session.calls.values()]
    .sort((a, b) => a.index - b.index)
    .map((c) => ({ name: c.name, args: { ...c.args } }));
}

function shouldInvokeOnAppend(
  toolName: string,
  opts: HostToolStreamReducerOptions,
): boolean {
  return opts.getStreamConfig?.(toolName)?.invokeOnAppend === true;
}

function applyDslOp(
  session: HostToolStreamSession,
  dsl: HostToolDslOp,
  opts: HostToolStreamReducerOptions,
): void {
  switch (dsl.op) {
    case 'session.begin':
      // 新 session 覆盖（streamId 不同）
      break;
    case 'session.end':
      if (session.streamId === dsl.streamId) session.ended = true;
      break;
    case 'tool.begin': {
      if (dsl.streamId !== session.streamId) return;
      ensureCall(session, dsl.callId, { name: dsl.name, index: dsl.index });
      break;
    }
    case 'arg.set': {
      if (dsl.streamId !== session.streamId) return;
      const call = ensureCall(session, dsl.callId);
      setByDotPath(call.args, dsl.path, dsl.value);
      if (shouldInvokeOnAppend(call.name, opts)) {
        opts.onEffect?.({ type: 'preview', callId: dsl.callId, name: call.name, args: call.args });
      } else {
        opts.onEffect?.({ type: 'preview', callId: dsl.callId, name: call.name, args: call.args });
      }
      break;
    }
    case 'arg.append': {
      if (dsl.streamId !== session.streamId) return;
      const call = ensureCall(session, dsl.callId);
      appendByDotPath(call.args, dsl.path, dsl.chunk);
      opts.onEffect?.({ type: 'preview', callId: dsl.callId, name: call.name, args: call.args });
      break;
    }
    case 'tool.commit': {
      if (dsl.streamId !== session.streamId) return;
      const call = ensureCall(session, dsl.callId);
      call.committed = true;
      if (!shouldInvokeOnAppend(call.name, opts)) {
        opts.onEffect?.({
          type: 'commit',
          call: { name: call.name, args: { ...call.args } },
        });
      }
      break;
    }
    case 'tool.flush': {
      if (dsl.streamId !== session.streamId) return;
      const call = ensureCall(session, dsl.callId, {
        name: dsl.name,
        index: session.calls.size,
      });
      call.args = { ...dsl.args };
      call.flushed = true;
      opts.onEffect?.({
        type: 'flush',
        call: { name: dsl.name, args: { ...dsl.args } },
      });
      break;
    }
    default:
      break;
  }
}

function handleStreamPayload(
  state: HostToolStreamReducerState,
  payload: HostActionStreamPayload,
  opts: HostToolStreamReducerOptions,
): HostToolStreamReducerState {
  const { stream, dsl } = payload;
  const seq = stream.seq;

  if (state.session && seq <= state.session.lastSeq) {
    return state; // 去重
  }

  const next: HostToolStreamReducerState = {
    ...state,
    session: state.session ? { ...state.session } : null,
  };

  if (stream.mode === 'full') {
    const tools = payload.hostTools ?? [];
    next.authoritative = tools;
    next.session = next.session
      ? { ...next.session, lastSeq: seq }
      : null;
    opts.onEffect?.({ type: 'reconcile', payload: tools });
    return next;
  }

  if (stream.mode === 'begin' && dsl?.op === 'session.begin') {
    next.session = {
      streamId: dsl.streamId,
      scope: dsl.scope ?? payload.scope,
      entity: dsl.entity ?? payload.entity,
      metadata: dsl.metadata ?? payload.metadata,
      reason: dsl.reason ?? payload.reason,
      planStepId: dsl.planStepId ?? payload.planStepId,
      runId: dsl.runId ?? payload.runId,
      turnId: dsl.turnId ?? payload.turnId,
      calls: new Map(),
      ended: false,
      lastSeq: seq,
    };
    return next;
  }

  if (!next.session) {
    opts.onEffect?.({
      type: 'warn',
      message: `host_tool stream delta before session.begin (seq=${seq})`,
    });
    return state;
  }

  if (next.session.ended && stream.mode === 'delta') {
    opts.onEffect?.({
      type: 'warn',
      message: `host_tool stream delta after session.end (seq=${seq})`,
    });
    return state;
  }

  next.session = { ...next.session, lastSeq: seq };

  if (dsl) {
    applyDslOp(next.session, dsl, opts);
  }

  if (stream.mode === 'end' && dsl?.op === 'session.end') {
    next.session.ended = true;
  }

  return next;
}

/** 主入口：处理单帧 host_action */
export function reduceHostToolStream(
  state: HostToolStreamReducerState,
  payload: HostActionSsePayload,
  opts: HostToolStreamReducerOptions = {},
): HostToolStreamReducerState {
  if (!isHostActionStreamPayload(payload)) {
    const batch = payload.hostTools ?? [];
    opts.onEffect?.({ type: 'batch', payload: batch, reason: payload.reason });
    return { session: null, authoritative: batch };
  }

  if (payload.stream.mode === 'full') {
    return handleStreamPayload(state, payload, opts);
  }

  return handleStreamPayload(state, payload, opts);
}
```

---

## 5. 门闩 + 执行层（`host-tool-stream.gate.ts`）

```ts
import type { HostActionSsePayload } from './types/host-tool-stream';

export type PageContextGate = {
  page?: string;
  entity?: { type?: string; id?: string | number };
};

export function passesHostActionGate(
  payload: HostActionSsePayload,
  ctx: PageContextGate,
): boolean {
  if (payload.action !== 'host_action') return false;

  const scope = payload.scope?.trim();
  const page = ctx.page?.trim();
  if (scope && page && scope !== page) return false;

  const entityId = payload.entity?.id;
  const ctxId = ctx.entity?.id;
  if (entityId != null && ctxId != null && String(entityId) !== String(ctxId)) {
    return false;
  }

  // full / v0 批量必须有 hostTools
  if (
    (!('stream' in payload) || payload.stream?.mode === 'full') &&
    (!payload.hostTools || payload.hostTools.length === 0)
  ) {
    return false;
  }

  return true;
}
```

---

## 6. React Hook（`use-host-tool-stream.ts`）

```tsx
import { useCallback, useRef, useState } from 'react';
import {
  createInitialHostToolStreamState,
  reduceHostToolStream,
  type HostToolStreamEffect,
  type HostToolStreamReducerState,
} from './host-tool-stream.reducer';
import { passesHostActionGate, type PageContextGate } from './host-tool-stream.gate';
import type { HostActionSsePayload, HostToolStreamConfig } from './types/host-tool-stream';

export type UseHostToolStreamOptions = {
  pageContext: PageContextGate;
  runHostTool: (call: { name: string; args: Record<string, unknown> }) => void | Promise<void>;
  /** preview：arg.append / arg.set 累积结果 */
  onPreview?: (input: {
    callId: string;
    name: string;
    args: Record<string, unknown>;
  }) => void;
  getStreamConfig?: (toolName: string) => HostToolStreamConfig | undefined;
};

export function useHostToolStream(options: UseHostToolStreamOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [state, setState] = useState<HostToolStreamReducerState>(
    createInitialHostToolStreamState,
  );

  const handleEffect = useCallback((effect: HostToolStreamEffect) => {
    const { runHostTool, onPreview } = optionsRef.current;
    switch (effect.type) {
      case 'preview':
        onPreview?.({
          callId: effect.callId,
          name: effect.name,
          args: effect.args,
        });
        break;
      case 'commit':
      case 'flush':
        void runHostTool(effect.call);
        break;
      case 'batch':
      case 'reconcile':
        for (const call of effect.payload) {
          void runHostTool(call);
        }
        break;
      case 'warn':
        console.warn('[host_tool stream]', effect.message);
        break;
      default:
        break;
    }
  }, []);

  const ingest = useCallback((payload: HostActionSsePayload) => {
    if (!passesHostActionGate(payload, optionsRef.current.pageContext)) {
      return;
    }
    setState((prev) =>
      reduceHostToolStream(prev, payload, {
        getStreamConfig: optionsRef.current.getStreamConfig,
        onEffect: handleEffect,
      }),
    );
  }, [handleEffect]);

  return { state, ingest };
}
```

**SSE 接入**（在现有 chat stream 回调里）：

```ts
eventSource.addEventListener('host_action', (evt) => {
  const payload = JSON.parse(evt.data) as HostActionSsePayload;
  hostToolStream.ingest(payload);
});
// 兼容 event: host-action
eventSource.addEventListener('host-action', ...);
```

---

## 7. 渐进式 UI 示例：`fillReplyDraft`

```tsx
function ReviewReplyPanel() {
  const [draftPreview, setDraftPreview] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const { ingest } = useHostToolStream({
    pageContext: { page: 'review-detail', entity: { id: reviewId } },
    getStreamConfig: (name) =>
      name === 'fillReplyDraft'
        ? { enabled: true, policy: 'stream', invokeOnAppend: false }
        : undefined,
    onPreview: ({ name, args }) => {
      if (name !== 'fillReplyDraft') return;
      setIsStreaming(true);
      setDraftPreview(String(args.text ?? ''));
    },
    runHostTool: async ({ name, args }) => {
      if (name === 'fillReplyDraft') {
        setIsStreaming(false);
        form.setFieldValue('reply', args.text); // 最终写入表单
        setDraftPreview(String(args.text ?? ''));
      } else {
        await hostToolRegistry.run(name, args);
      }
    },
  });

  return (
    <TextArea
      value={draftPreview}
      readOnly={isStreaming}
      placeholder={isStreaming ? 'AI 正在填入…' : '回复内容'}
    />
  );
}
```

要点：

| 阶段 | UI |
|------|-----|
| `arg.append` | 只读 TextArea，逐字追加 `draftPreview` |
| `tool.commit` / `full` | 写入可编辑表单，取消 streaming 态 |
| v0 批量（无 stream） | 直接 `runHostTool`，无动画 |

---

## 8. 本地 Mock（后端 S1 未开）

在后端仍发 v0 批量时，可在 dev 环境把批量帧**拆成 DSL** 做 UI 联调：

```ts
/** 将 v0 hostTools 伪流式化为 DSL 帧序列 */
export function mockStreamFromBatch(
  batch: HostActionSsePayload & { hostTools: Array<{ name: string; args: Record<string, unknown> }> },
  chunkSize = 16,
): HostActionSsePayload[] {
  const streamId = `mock-${batch.runId ?? 0}-${batch.turnId ?? 0}`;
  const frames: HostActionSsePayload[] = [];
  let seq = 0;
  const push = (mode: 'begin' | 'delta' | 'commit' | 'end' | 'full', dsl?: HostActionStreamPayload['dsl'], extra?: Partial<HostActionStreamPayload>) => {
    seq += 1;
    frames.push({
      action: 'host_action',
      v: 1,
      stream: { mode, seq },
      ...(dsl ? { dsl } : {}),
      ...extra,
    });
  };

  push('begin', {
    op: 'session.begin',
    streamId,
    scope: batch.scope,
    entity: batch.entity,
    reason: batch.reason,
    runId: batch.runId,
    turnId: batch.turnId,
  });

  batch.hostTools.forEach((tool, index) => {
    const callId = `c${index}`;
    const text = tool.args.text;
    if (typeof text === 'string' && text.length > chunkSize) {
      push('delta', { op: 'tool.begin', streamId, callId, index, name: tool.name });
      for (let i = 0; i < text.length; i += chunkSize) {
        push('delta', {
          op: 'arg.append',
          streamId,
          callId,
          path: 'text',
          chunk: text.slice(i, i + chunkSize),
        });
      }
      push('commit', { op: 'tool.commit', streamId, callId });
    } else {
      push('delta', {
        op: 'tool.flush',
        streamId,
        callId,
        name: tool.name,
        args: tool.args,
      });
    }
  });

  push('end', { op: 'session.end', streamId });
  push('full', undefined, {
    scope: batch.scope,
    entity: batch.entity,
    hostTools: batch.hostTools,
    reason: batch.reason,
    runId: batch.runId,
    turnId: batch.turnId,
  });

  return frames;
}

/** Storybook：按帧 async 播放 */
export async function playMockStream(
  frames: HostActionSsePayload[],
  ingest: (p: HostActionSsePayload) => void,
  delayMs = 40,
) {
  for (const frame of frames) {
    ingest(frame);
    await new Promise((r) => setTimeout(r, delayMs));
  }
}
```

---

## 9. 与 Chat 正文流的关系

| 通道 | 用途 |
|------|------|
| `message` SSE | 聊天气泡 Markdown / blocks |
| `host_action` DSL | **页面副作用**（填表单、刷新实体、高亮行） |

Plan `reason` 步可能 **同时** 有 message draft 与 host_tool fill。**不要**把 host_tool 的 `text` 再渲染进气泡，除非产品明确要求双显；页面侧以 `host_action` 为准。

---

## 10. 实现顺序建议

1. **复制类型** + `path-args.util` + `reducer` + 单元测试（用 §4.1 示例帧序列）
2. **Mock 播放器**（§8）对接现有 v0 SSE，先把 `fillReplyDraft` UI 做顺
3. **接 SSE** `host_action` 事件 + 门闩
4. 等 agent-server `dispatchHostActionStream()`（S1 伪流式）上线后，关掉 mock 即可

---

## 11. 相关文档

| 文档 | 内容 |
|------|------|
| [host-tool-stream-dsl-frontend.md](./host-tool-stream-dsl-frontend.md) | 协议 normative |
| [host-page-context-host-action-frontend.md](./host-page-context-host-action-frontend.md) | pageContext + registry |
| [host-tool-client-register-frontend.md](./host-tool-client-register-frontend.md) | `streamConfig` 注册 |
