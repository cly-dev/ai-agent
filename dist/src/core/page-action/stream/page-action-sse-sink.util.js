"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPageActionSseResponse = exports.replayBufferedEvents = exports.createNullPageActionSseSink = exports.startPageActionSseHeartbeat = exports.createExpressPageActionSseSink = exports.formatPageActionSseChunk = exports.PAGE_ACTION_SSE_HEARTBEAT_MS = void 0;
exports.PAGE_ACTION_SSE_HEARTBEAT_MS = 15000;
function formatPageActionSseChunk(event, data) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
exports.formatPageActionSseChunk = formatPageActionSseChunk;
function isResponseWritable(res) {
    return !res.writableEnded && !res.destroyed;
}
function createExpressPageActionSseSink(res) {
    return {
        get writableEnded() {
            return res.writableEnded || res.destroyed;
        },
        emit(event, data) {
            if (!isResponseWritable(res)) {
                return;
            }
            try {
                res.write(formatPageActionSseChunk(event, data));
            }
            catch (_a) {
            }
        },
        end() {
            if (!res.writableEnded) {
                try {
                    res.end();
                }
                catch (_a) {
                }
            }
        },
    };
}
exports.createExpressPageActionSseSink = createExpressPageActionSseSink;
function startPageActionSseHeartbeat(res, intervalMs = exports.PAGE_ACTION_SSE_HEARTBEAT_MS) {
    const timer = setInterval(() => {
        if (!isResponseWritable(res)) {
            clearInterval(timer);
            return;
        }
        try {
            res.write(`: ping ${Date.now()}\n\n`);
        }
        catch (_a) {
            clearInterval(timer);
        }
    }, intervalMs);
    const stop = () => {
        clearInterval(timer);
    };
    res.on('close', stop);
    res.on('finish', stop);
    return stop;
}
exports.startPageActionSseHeartbeat = startPageActionSseHeartbeat;
function createNullPageActionSseSink() {
    return {
        writableEnded: false,
        emit() { },
        end() { },
    };
}
exports.createNullPageActionSseSink = createNullPageActionSseSink;
function replayBufferedEvents(sink, events) {
    for (const row of events) {
        if (sink.writableEnded) {
            return;
        }
        sink.emit(row.event, row.data);
    }
}
exports.replayBufferedEvents = replayBufferedEvents;
function initPageActionSseResponse(res) {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    const socket = res.socket;
    if (socket) {
        socket.setTimeout(0);
        socket.setKeepAlive(true);
    }
    if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
    }
}
exports.initPageActionSseResponse = initPageActionSseResponse;
//# sourceMappingURL=page-action-sse-sink.util.js.map