import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '@nestjs/common';
import { isFileDebugLogEnabled } from '../security/file-debug-log.util';
import { isFalsyEnv, isProductionRuntime, isTruthyEnv } from '../security/runtime-env.util';

const logger = new Logger('PageActionFill');

function readTriStateEnv(name: string): boolean | undefined {
  const value = process.env[name]?.trim().toLowerCase();
  if (isFalsyEnv(value)) {
    return false;
  }
  if (isTruthyEnv(value)) {
    return true;
  }
  return undefined;
}

/** 非生产默认开启控制台；生产需 `PAGE_ACTION_FILL_DEBUG=1`。失败路径始终打 warn。 */
export function isPageActionFillDebugEnabled(): boolean {
  const explicit = readTriStateEnv('PAGE_ACTION_FILL_DEBUG');
  if (explicit !== undefined) {
    return explicit;
  }
  return !isProductionRuntime();
}

export function truncateForPageActionLog(text: string, max = 240): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max)}…(${normalized.length} chars)`;
}

export type PageActionFillStreamProbe = {
  actionRunId: number;
  actionKey: string;
  streamId: string;
  deltaEvents: number;
  deltaChars: number;
  emptyDeltaEvents: number;
  routedMessageChars: number;
  firstDeltaPreview: string | null;
  lastDeltaPreview: string | null;
  sawDoneDelta: boolean;
};

export function createPageActionFillStreamProbe(input: {
  actionRunId: number;
  actionKey: string;
  streamId: string;
}): PageActionFillStreamProbe {
  return {
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    streamId: input.streamId,
    deltaEvents: 0,
    deltaChars: 0,
    emptyDeltaEvents: 0,
    routedMessageChars: 0,
    firstDeltaPreview: null,
    lastDeltaPreview: null,
    sawDoneDelta: false,
  };
}

export function recordPageActionFillStreamDelta(
  probe: PageActionFillStreamProbe,
  contentDelta: string,
  done: boolean,
): void {
  probe.deltaEvents += 1;
  if (done) {
    probe.sawDoneDelta = true;
  }
  if (!contentDelta) {
    probe.emptyDeltaEvents += 1;
    return;
  }
  probe.deltaChars += contentDelta.length;
  const preview = truncateForPageActionLog(contentDelta, 120);
  if (!probe.firstDeltaPreview) {
    probe.firstDeltaPreview = preview;
  }
  probe.lastDeltaPreview = preview;
}

export function recordPageActionFillRoutedMessage(
  probe: PageActionFillStreamProbe,
  messageDelta: string,
): void {
  if (!messageDelta) {
    return;
  }
  probe.routedMessageChars += messageDelta.length;
}

export type PageActionFillDebugRecord = {
  phase: 'stream_end' | 'empty_fill' | 'error' | 'dispatched';
  writtenAt: string;
  actionRunId: number;
  actionKey: string;
  streamId: string;
  model: string | null;
  probe: PageActionFillStreamProbe;
  metrics: Record<string, unknown>;
  rawPreview?: string;
  streamResultPreview?: string;
  fillTextPreview?: string;
  hint?: string;
};

function baseFields(probe: PageActionFillStreamProbe): string {
  return `runId=${probe.actionRunId} actionKey=${probe.actionKey} streamId=${probe.streamId}`;
}

function writePageActionFillDebugFile(record: PageActionFillDebugRecord): string | null {
  if (!isFileDebugLogEnabled()) {
    return null;
  }
  try {
    const dir = path.join(process.cwd(), 'logs', 'page-action', 'fill');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(
      dir,
      `run-${record.actionRunId}-${record.phase}-${Date.now()}.json`,
    );
    fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
    return file;
  } catch {
    return null;
  }
}

function emitPageActionFillDebug(
  level: 'log' | 'warn',
  message: string,
  record?: PageActionFillDebugRecord,
): void {
  const file = record ? writePageActionFillDebugFile(record) : null;
  const line = file ? `${message} → logs/${path.relative(process.cwd(), file)}` : message;
  if (level === 'warn') {
    logger.warn(line);
    return;
  }
  if (!isPageActionFillDebugEnabled()) {
    return;
  }
  logger.log(line);
}

export function logPageActionFillStart(probe: PageActionFillStreamProbe): void {
  if (!isPageActionFillDebugEnabled()) {
    return;
  }
  logger.log(`streamChat.start ${baseFields(probe)}`);
}

export function logPageActionFillStreamEnd(input: {
  probe: PageActionFillStreamProbe;
  model: string | null;
  sessionFillTextLen: number;
  streamResultContentLen: number;
  appendCount: number;
  rawAccumulatedLen: number;
  rawPreview?: string;
  streamResultPreview?: string;
  streamMeta?: { emittedDeltaCount: number; fellBackToInvoke: boolean };
}): void {
  const { probe } = input;
  const meta = input.streamMeta
    ? ` llmEmittedDeltaCount=${input.streamMeta.emittedDeltaCount} fellBackToInvoke=${input.streamMeta.fellBackToInvoke}`
    : '';
  const line =
    `streamChat.end ${baseFields(probe)} model=${input.model ?? 'unknown'}` +
    ` deltaEvents=${probe.deltaEvents} emptyDeltaEvents=${probe.emptyDeltaEvents}` +
    ` deltaChars=${probe.deltaChars} routedMessageChars=${probe.routedMessageChars}` +
    ` appendCount=${input.appendCount} rawAccumulatedLen=${input.rawAccumulatedLen}` +
    ` sessionFillTextLen=${input.sessionFillTextLen}` +
    ` streamResultContentLen=${input.streamResultContentLen}${meta}` +
    (probe.firstDeltaPreview
      ? ` firstDelta="${probe.firstDeltaPreview}"`
      : ' firstDelta=<none>');

  const record: PageActionFillDebugRecord = {
    phase: 'stream_end',
    writtenAt: new Date().toISOString(),
    actionRunId: probe.actionRunId,
    actionKey: probe.actionKey,
    streamId: probe.streamId,
    model: input.model,
    probe: { ...probe },
    metrics: {
      sessionFillTextLen: input.sessionFillTextLen,
      streamResultContentLen: input.streamResultContentLen,
      appendCount: input.appendCount,
      rawAccumulatedLen: input.rawAccumulatedLen,
      streamMeta: input.streamMeta ?? null,
    },
    rawPreview: input.rawPreview,
    streamResultPreview: input.streamResultPreview,
  };

  if (
    input.sessionFillTextLen === 0 &&
    input.streamResultContentLen === 0 &&
    probe.deltaEvents === 0
  ) {
    record.hint = 'no LLM text in deltas or streamResult';
    emitPageActionFillDebug('warn', `${line} → ${record.hint}`, record);
    return;
  }
  if (input.sessionFillTextLen === 0 && input.streamResultContentLen > 0) {
    record.hint =
      'content channel present but sanitize/routing left empty (likely <think>-only content; reasoning_content is on a separate channel and never enters fill)';
    emitPageActionFillDebug('warn', `${line} → ${record.hint}`, record);
    return;
  }
  emitPageActionFillDebug('log', line, record);
}

export function logPageActionFillFallback(input: {
  probe: PageActionFillStreamProbe;
  source: 'streamResult.content' | 'routed_message';
  beforeLen: number;
  afterLen: number;
  preview?: string;
}): void {
  const record: PageActionFillDebugRecord = {
    phase: 'stream_end',
    writtenAt: new Date().toISOString(),
    actionRunId: input.probe.actionRunId,
    actionKey: input.probe.actionKey,
    streamId: input.probe.streamId,
    model: null,
    probe: { ...input.probe },
    metrics: {
      source: input.source,
      beforeLen: input.beforeLen,
      afterLen: input.afterLen,
    },
    fillTextPreview: input.preview,
    hint: 'fillText recovered via fallback path',
  };
  emitPageActionFillDebug(
    'warn',
    `fillText.fallback ${baseFields(input.probe)} source=${input.source} beforeLen=${input.beforeLen} afterLen=${input.afterLen}`,
    record,
  );
}

export function logPageActionFillEmpty(input: {
  probe: PageActionFillStreamProbe;
  model: string | null;
  rawAccumulatedLen?: number;
  rawPreview?: string;
  sanitizedFillLen: number;
  streamResultContentLen: number;
  streamResultPreview?: string;
  appendCount: number;
}): void {
  const record: PageActionFillDebugRecord = {
    phase: 'empty_fill',
    writtenAt: new Date().toISOString(),
    actionRunId: input.probe.actionRunId,
    actionKey: input.probe.actionKey,
    streamId: input.probe.streamId,
    model: input.model,
    probe: { ...input.probe },
    metrics: {
      rawAccumulatedLen: input.rawAccumulatedLen ?? 0,
      sanitizedFillLen: input.sanitizedFillLen,
      streamResultContentLen: input.streamResultContentLen,
      appendCount: input.appendCount,
    },
    rawPreview: input.rawPreview,
    streamResultPreview: input.streamResultPreview,
    hint:
      'model returned text but fill path empty after think/message routing + sanitize; content channel was <think>-only or scaffolding-only (reasoning_content never enters fill); check model thinking config',
  };
  emitPageActionFillDebug(
    'warn',
    `empty_fill_after_llm ${baseFields(input.probe)} model=${input.model ?? 'unknown'}` +
      ` rawAccumulatedLen=${input.rawAccumulatedLen ?? 0} sanitizedFillLen=${input.sanitizedFillLen}` +
      ` streamResultContentLen=${input.streamResultContentLen} appendCount=${input.appendCount}`,
    record,
  );
}

export function logPageActionFillError(
  probe: PageActionFillStreamProbe,
  error: unknown,
): void {
  const message = error instanceof Error ? error.message : String(error);
  const record: PageActionFillDebugRecord = {
    phase: 'error',
    writtenAt: new Date().toISOString(),
    actionRunId: probe.actionRunId,
    actionKey: probe.actionKey,
    streamId: probe.streamId,
    model: null,
    probe: { ...probe },
    metrics: { message },
  };
  emitPageActionFillDebug(
    'warn',
    `streamChat.error ${baseFields(probe)} message=${message}`,
    record,
  );
}

export function logPageActionFillDispatched(input: {
  probe: PageActionFillStreamProbe;
  fillTextLen: number;
  appendCount: number;
  fillTextPreview?: string;
}): void {
  const record: PageActionFillDebugRecord = {
    phase: 'dispatched',
    writtenAt: new Date().toISOString(),
    actionRunId: input.probe.actionRunId,
    actionKey: input.probe.actionKey,
    streamId: input.probe.streamId,
    model: null,
    probe: { ...input.probe },
    metrics: {
      fillTextLen: input.fillTextLen,
      appendCount: input.appendCount,
    },
    fillTextPreview: input.fillTextPreview,
  };
  emitPageActionFillDebug(
    'log',
    `dispatched ${baseFields(input.probe)} fillTextLen=${input.fillTextLen} appendCount=${input.appendCount}`,
    record,
  );
}
