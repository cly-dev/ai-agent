"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRunEventPublisher = void 0;
const common_1 = require("@nestjs/common");
const run_event_publisher_1 = require("../../core/session-run/run-event.publisher");
const chat_events_service_1 = require("./chat-events.service");
let ChatRunEventPublisher = class ChatRunEventPublisher extends run_event_publisher_1.RunEventPublisher {
    constructor(chatEvents) {
        super();
        this.chatEvents = chatEvents;
    }
    purgeReplayForSession(sessionId) {
        this.chatEvents.purgeReplayForSession(sessionId);
    }
    purgeWriteConfirmationGate(sessionId, runId) {
        this.chatEvents.purgeWriteConfirmationGate(sessionId, runId);
    }
    emitRunAborted(sessionId, input) {
        this.chatEvents.emitRunAborted(sessionId, input);
    }
    emitAgentRunError(sessionId, input) {
        this.chatEvents.emit(sessionId, {
            event: 'error',
            payload: input,
        });
    }
    emitAgentRunComplete(sessionId, input) {
        this.chatEvents.emit(sessionId, {
            event: 'complete',
            payload: Object.assign({ source: 'agent-run' }, input),
        });
    }
    emitConfirmationRequired(sessionId, input) {
        this.chatEvents.emit(sessionId, {
            event: 'message',
            payload: {
                source: 'agent-run',
                action: 'confirmation_required',
                runId: input.runId,
                turnId: input.turnId,
                message: input.message,
                generation: input.generation,
                draftRetryCount: input.draftRetryCount,
                draftRetryMax: input.draftRetryMax,
                canRetry: input.canRetry,
                writeDraft: input.writeDraft,
                writeDrafts: input.writeDrafts,
                editPolicy: input.editPolicy,
                editPolicies: input.editPolicies,
            },
        });
    }
    emitWriteConfirmationCancelled(sessionId, input) {
        this.chatEvents.emit(sessionId, {
            event: 'message',
            payload: {
                source: 'agent-run',
                action: 'write_confirmation_cancelled',
                runId: input.runId,
                turnId: input.turnId,
                message: input.message,
                generation: input.generation,
            },
        });
    }
    emitThink(sessionId, payload) {
        this.chatEvents.emit(sessionId, {
            event: 'think',
            payload,
        });
    }
    emitAgentRunMessage(sessionId, payload) {
        this.chatEvents.emit(sessionId, {
            event: 'message',
            payload,
        });
    }
    emitHostAction(sessionId, payload) {
        this.chatEvents.emit(sessionId, {
            event: 'host_action',
            payload,
        });
    }
};
ChatRunEventPublisher = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_events_service_1.ChatEventsService])
], ChatRunEventPublisher);
exports.ChatRunEventPublisher = ChatRunEventPublisher;
//# sourceMappingURL=chat-run-event.publisher.js.map