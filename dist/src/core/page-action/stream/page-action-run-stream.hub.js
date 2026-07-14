"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageActionRunStreamHub = void 0;
const common_1 = require("@nestjs/common");
const page_action_sse_sink_util_1 = require("./page-action-sse-sink.util");
let PageActionRunStreamHub = class PageActionRunStreamHub {
    constructor() {
        this.sessions = new Map();
    }
    prepareSession(runId) {
        const session = this.ensureSession(runId);
        session.closed = false;
    }
    openWriter(runId) {
        const session = this.ensureSession(runId);
        session.writerOpen = true;
        session.closed = false;
        return this.createWriterSink(session);
    }
    attachSubscriber(runId, res) {
        (0, page_action_sse_sink_util_1.initPageActionSseResponse)(res);
        const sink = (0, page_action_sse_sink_util_1.createExpressPageActionSseSink)(res);
        const session = this.ensureSession(runId);
        (0, page_action_sse_sink_util_1.replayBufferedEvents)(sink, session.buffer);
        if (session.closed) {
            sink.end();
            return;
        }
        session.subscribers.add(sink);
        res.on('close', () => {
            session.subscribers.delete(sink);
        });
    }
    closeSession(runId) {
        const session = this.sessions.get(runId);
        if (!session) {
            return;
        }
        session.writerOpen = false;
        session.closed = true;
        for (const subscriber of session.subscribers) {
            subscriber.end();
        }
        session.subscribers.clear();
    }
    hasActiveSession(runId) {
        const session = this.sessions.get(runId);
        return (session === null || session === void 0 ? void 0 : session.writerOpen) === true;
    }
    hasSession(runId) {
        const session = this.sessions.get(runId);
        return session != null && !session.closed;
    }
    ensureSession(runId) {
        let session = this.sessions.get(runId);
        if (!session) {
            session = {
                buffer: [],
                subscribers: new Set(),
                writerOpen: false,
                closed: false,
            };
            this.sessions.set(runId, session);
        }
        return session;
    }
    createWriterSink(session) {
        let ended = false;
        return {
            get writableEnded() {
                return ended || !session.writerOpen;
            },
            emit(event, data) {
                if (ended || !session.writerOpen) {
                    return;
                }
                const row = { event, data };
                session.buffer.push(row);
                for (const subscriber of session.subscribers) {
                    if (!subscriber.writableEnded) {
                        subscriber.emit(event, data);
                    }
                }
            },
            end() {
                ended = true;
            },
        };
    }
};
PageActionRunStreamHub = __decorate([
    (0, common_1.Injectable)()
], PageActionRunStreamHub);
exports.PageActionRunStreamHub = PageActionRunStreamHub;
//# sourceMappingURL=page-action-run-stream.hub.js.map