"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPageActionFillDispatched = exports.logPageActionFillError = exports.logPageActionFillEmpty = exports.logPageActionFillFallback = exports.logPageActionFillStreamEnd = exports.logPageActionFillStart = exports.recordPageActionFillRoutedMessage = exports.recordPageActionFillStreamDelta = exports.createPageActionFillStreamProbe = exports.truncateForPageActionLog = exports.isPageActionFillDebugEnabled = void 0;
const fs = require("node:fs");
const path = require("node:path");
const common_1 = require("@nestjs/common");
const file_debug_log_util_1 = require("../security/file-debug-log.util");
const runtime_env_util_1 = require("../security/runtime-env.util");
const logger = new common_1.Logger('PageActionFill');
function readTriStateEnv(name) {
    var _a;
    const value = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    if ((0, runtime_env_util_1.isFalsyEnv)(value)) {
        return false;
    }
    if ((0, runtime_env_util_1.isTruthyEnv)(value)) {
        return true;
    }
    return undefined;
}
function isPageActionFillDebugEnabled() {
    const explicit = readTriStateEnv('PAGE_ACTION_FILL_DEBUG');
    if (explicit !== undefined) {
        return explicit;
    }
    return !(0, runtime_env_util_1.isProductionRuntime)();
}
exports.isPageActionFillDebugEnabled = isPageActionFillDebugEnabled;
function truncateForPageActionLog(text, max = 240) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= max) {
        return normalized;
    }
    return `${normalized.slice(0, max)}…(${normalized.length} chars)`;
}
exports.truncateForPageActionLog = truncateForPageActionLog;
function createPageActionFillStreamProbe(input) {
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
exports.createPageActionFillStreamProbe = createPageActionFillStreamProbe;
function recordPageActionFillStreamDelta(probe, contentDelta, done) {
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
exports.recordPageActionFillStreamDelta = recordPageActionFillStreamDelta;
function recordPageActionFillRoutedMessage(probe, messageDelta) {
    if (!messageDelta) {
        return;
    }
    probe.routedMessageChars += messageDelta.length;
}
exports.recordPageActionFillRoutedMessage = recordPageActionFillRoutedMessage;
function baseFields(probe) {
    return `runId=${probe.actionRunId} actionKey=${probe.actionKey} streamId=${probe.streamId}`;
}
function writePageActionFillDebugFile(record) {
    if (!(0, file_debug_log_util_1.isFileDebugLogEnabled)()) {
        return null;
    }
    try {
        const dir = path.join(process.cwd(), 'logs', 'page-action', 'fill');
        fs.mkdirSync(dir, { recursive: true });
        const file = path.join(dir, `run-${record.actionRunId}-${record.phase}-${Date.now()}.json`);
        fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
        return file;
    }
    catch (_a) {
        return null;
    }
}
function emitPageActionFillDebug(level, message, record) {
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
function logPageActionFillStart(probe) {
    if (!isPageActionFillDebugEnabled()) {
        return;
    }
    logger.log(`streamChat.start ${baseFields(probe)}`);
}
exports.logPageActionFillStart = logPageActionFillStart;
function logPageActionFillStreamEnd(input) {
    var _a, _b;
    const { probe } = input;
    const meta = input.streamMeta
        ? ` llmEmittedDeltaCount=${input.streamMeta.emittedDeltaCount} fellBackToInvoke=${input.streamMeta.fellBackToInvoke}`
        : '';
    const line = `streamChat.end ${baseFields(probe)} model=${(_a = input.model) !== null && _a !== void 0 ? _a : 'unknown'}` +
        ` deltaEvents=${probe.deltaEvents} emptyDeltaEvents=${probe.emptyDeltaEvents}` +
        ` deltaChars=${probe.deltaChars} routedMessageChars=${probe.routedMessageChars}` +
        ` appendCount=${input.appendCount} rawAccumulatedLen=${input.rawAccumulatedLen}` +
        ` sessionFillTextLen=${input.sessionFillTextLen}` +
        ` streamResultContentLen=${input.streamResultContentLen}${meta}` +
        (probe.firstDeltaPreview
            ? ` firstDelta="${probe.firstDeltaPreview}"`
            : ' firstDelta=<none>');
    const record = {
        phase: 'stream_end',
        writtenAt: new Date().toISOString(),
        actionRunId: probe.actionRunId,
        actionKey: probe.actionKey,
        streamId: probe.streamId,
        model: input.model,
        probe: Object.assign({}, probe),
        metrics: {
            sessionFillTextLen: input.sessionFillTextLen,
            streamResultContentLen: input.streamResultContentLen,
            appendCount: input.appendCount,
            rawAccumulatedLen: input.rawAccumulatedLen,
            streamMeta: (_b = input.streamMeta) !== null && _b !== void 0 ? _b : null,
        },
        rawPreview: input.rawPreview,
        streamResultPreview: input.streamResultPreview,
    };
    if (input.sessionFillTextLen === 0 &&
        input.streamResultContentLen === 0 &&
        probe.deltaEvents === 0) {
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
exports.logPageActionFillStreamEnd = logPageActionFillStreamEnd;
function logPageActionFillFallback(input) {
    const record = {
        phase: 'stream_end',
        writtenAt: new Date().toISOString(),
        actionRunId: input.probe.actionRunId,
        actionKey: input.probe.actionKey,
        streamId: input.probe.streamId,
        model: null,
        probe: Object.assign({}, input.probe),
        metrics: {
            source: input.source,
            beforeLen: input.beforeLen,
            afterLen: input.afterLen,
        },
        fillTextPreview: input.preview,
        hint: 'fillText recovered via fallback path',
    };
    emitPageActionFillDebug('warn', `fillText.fallback ${baseFields(input.probe)} source=${input.source} beforeLen=${input.beforeLen} afterLen=${input.afterLen}`, record);
}
exports.logPageActionFillFallback = logPageActionFillFallback;
function logPageActionFillEmpty(input) {
    var _a, _b, _c;
    const record = {
        phase: 'empty_fill',
        writtenAt: new Date().toISOString(),
        actionRunId: input.probe.actionRunId,
        actionKey: input.probe.actionKey,
        streamId: input.probe.streamId,
        model: input.model,
        probe: Object.assign({}, input.probe),
        metrics: {
            rawAccumulatedLen: (_a = input.rawAccumulatedLen) !== null && _a !== void 0 ? _a : 0,
            sanitizedFillLen: input.sanitizedFillLen,
            streamResultContentLen: input.streamResultContentLen,
            appendCount: input.appendCount,
        },
        rawPreview: input.rawPreview,
        streamResultPreview: input.streamResultPreview,
        hint: 'model returned text but fill path empty after think/message routing + sanitize; content channel was <think>-only or scaffolding-only (reasoning_content never enters fill); check model thinking config',
    };
    emitPageActionFillDebug('warn', `empty_fill_after_llm ${baseFields(input.probe)} model=${(_b = input.model) !== null && _b !== void 0 ? _b : 'unknown'}` +
        ` rawAccumulatedLen=${(_c = input.rawAccumulatedLen) !== null && _c !== void 0 ? _c : 0} sanitizedFillLen=${input.sanitizedFillLen}` +
        ` streamResultContentLen=${input.streamResultContentLen} appendCount=${input.appendCount}`, record);
}
exports.logPageActionFillEmpty = logPageActionFillEmpty;
function logPageActionFillError(probe, error) {
    const message = error instanceof Error ? error.message : String(error);
    const record = {
        phase: 'error',
        writtenAt: new Date().toISOString(),
        actionRunId: probe.actionRunId,
        actionKey: probe.actionKey,
        streamId: probe.streamId,
        model: null,
        probe: Object.assign({}, probe),
        metrics: { message },
    };
    emitPageActionFillDebug('warn', `streamChat.error ${baseFields(probe)} message=${message}`, record);
}
exports.logPageActionFillError = logPageActionFillError;
function logPageActionFillDispatched(input) {
    const record = {
        phase: 'dispatched',
        writtenAt: new Date().toISOString(),
        actionRunId: input.probe.actionRunId,
        actionKey: input.probe.actionKey,
        streamId: input.probe.streamId,
        model: null,
        probe: Object.assign({}, input.probe),
        metrics: {
            fillTextLen: input.fillTextLen,
            appendCount: input.appendCount,
        },
        fillTextPreview: input.fillTextPreview,
    };
    emitPageActionFillDebug('log', `dispatched ${baseFields(input.probe)} fillTextLen=${input.fillTextLen} appendCount=${input.appendCount}`, record);
}
exports.logPageActionFillDispatched = logPageActionFillDispatched;
//# sourceMappingURL=page-action-fill-debug.util.js.map