import type { ChatSseEvent } from './chat-events.service';

/** 将内部 SSE 事件序列化为前端约定的 data 字符串。 */
export function serializeChatSseData(evt: ChatSseEvent): string {
  if (evt.event === 'think') {
    const body: Record<string, unknown> = { content: evt.payload.content };
    if (evt.payload.mode) {
      body.mode = evt.payload.mode;
    }
    if (evt.payload.runId != null) {
      body.runId = evt.payload.runId;
    }
    if (evt.payload.generation != null) {
      body.generation = evt.payload.generation;
    }
    return JSON.stringify(body);
  }
  if (evt.event === 'host_action') {
    return JSON.stringify(evt.payload);
  }
  if (
    evt.event === 'message' &&
    evt.payload.source === 'agent-run' &&
    evt.payload.action === 'confirmation_required'
  ) {
    return JSON.stringify({
      action: 'confirmation_required',
      runId: evt.payload.runId,
      turnId: evt.payload.turnId,
      message: evt.payload.message,
      code: 'WRITE_CONFIRMATION_REQUIRED',
      ...(evt.payload.generation != null
        ? { generation: evt.payload.generation }
        : {}),
      ...(evt.payload.draftRetryCount != null
        ? { draftRetryCount: evt.payload.draftRetryCount }
        : {}),
      ...(evt.payload.draftRetryMax != null
        ? { draftRetryMax: evt.payload.draftRetryMax }
        : {}),
      ...(evt.payload.canRetry != null ? { canRetry: evt.payload.canRetry } : {}),
      ...(evt.payload.writeDraft != null
        ? { writeDraft: evt.payload.writeDraft }
        : {}),
      ...(Array.isArray(evt.payload.writeDrafts) &&
      evt.payload.writeDrafts.length > 0
        ? { writeDrafts: evt.payload.writeDrafts }
        : {}),
    });
  }
  if (
    evt.event === 'message' &&
    evt.payload.source === 'agent-run' &&
    evt.payload.action === 'write_confirmation_cancelled'
  ) {
    return JSON.stringify({
      action: 'write_confirmation_cancelled',
      runId: evt.payload.runId,
      turnId: evt.payload.turnId,
      message: evt.payload.message,
      code: 'WRITE_CONFIRMATION_CANCELLED',
      ...(evt.payload.generation != null
        ? { generation: evt.payload.generation }
        : {}),
    });
  }
  if (
    evt.event === 'message' &&
    evt.payload.source === 'agent-run' &&
    (evt.payload.action === 'stream' || evt.payload.action === 'patch')
  ) {
    const p = evt.payload;
    const body: Record<string, unknown> = {};
    if (Array.isArray(p.blocks) && p.blocks.length > 0) {
      body.blocks = p.blocks;
    } else if (p.output) {
      body.blocks = [
        { type: 'text', content: p.output, format: 'markdown' },
      ];
    }
    if (p.action) {
      body.action = p.action;
    }
    if (p.action === 'patch' && Array.isArray(p.patches) && p.patches.length > 0) {
      body.patches = p.patches;
    }
    if (p.runId != null) {
      body.runId = p.runId;
    }
    if (p.turnId != null) {
      body.turnId = p.turnId;
    }
    if (p.code) {
      body.code = p.code;
    }
    if (p.generation != null) {
      body.generation = p.generation;
    }
    if (p.seq != null) {
      if (p.mode === 'delta') {
        body.stream = { mode: 'delta', seq: p.seq };
      } else if (p.mode === 'full') {
        body.stream = { mode: 'full', seq: p.seq };
      } else if (p.action === 'patch') {
        body.stream = { mode: 'patch', seq: p.seq };
      }
    }
    return JSON.stringify(body);
  }
  if (evt.event === 'message' && evt.payload.source === 'message') {
    return JSON.stringify(evt.payload);
  }
  return JSON.stringify(evt.payload);
}
