"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPageActionSseResponse = exports.replayBufferedEvents = exports.createNullPageActionSseSink = exports.createExpressPageActionSseSink = exports.formatPageActionSseChunk = void 0;
function formatPageActionSseChunk(event, data) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
exports.formatPageActionSseChunk = formatPageActionSseChunk;
function createExpressPageActionSseSink(res) {
    return {
        get writableEnded() {
            return res.writableEnded;
        },
        emit(event, data) {
            if (res.writableEnded) {
                return;
            }
            res.write(formatPageActionSseChunk(event, data));
        },
        end() {
            if (!res.writableEnded) {
                res.end();
            }
        },
    };
}
exports.createExpressPageActionSseSink = createExpressPageActionSseSink;
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
    if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
    }
}
exports.initPageActionSseResponse = initPageActionSseResponse;
//# sourceMappingURL=page-action-sse-sink.util.js.map