import type { ChatSseEvent } from './chat-events.service';

/** 将内部 SSE 事件序列化为前端约定的 data 字符串。 */
export function serializeChatSseData(evt: ChatSseEvent): string {
  if (evt.event === 'think') {
    return JSON.stringify({ content: evt.payload.content });
  }
  if (evt.event === 'message' && evt.payload.source === 'agent-run') {
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
