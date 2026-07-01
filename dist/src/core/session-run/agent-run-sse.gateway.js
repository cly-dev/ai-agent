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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRunSseGateway = void 0;
const common_1 = require("@nestjs/common");
const run_event_publisher_1 = require("./run-event.publisher");
let AgentRunSseGateway = class AgentRunSseGateway {
    constructor(coordinator, runEvents) {
        this.coordinator = coordinator;
        this.runEvents = runEvents;
    }
    getBoundRunGeneration(sessionId, runId) {
        return this.coordinator.getBoundRunGeneration(sessionId, runId);
    }
    getRunAbortSignal(sessionId, runId) {
        return this.coordinator.getRunAbortSignal(sessionId, runId);
    }
    throwIfAborted(sessionId, runId, generation) {
        this.coordinator.throwIfAborted(sessionId, runId, generation);
    }
    canPublishRun(sessionId, runId) {
        return this.coordinator.canPublishRun(sessionId, runId);
    }
    purgeWriteConfirmationGate(sessionId, runId) {
        this.runEvents.purgeWriteConfirmationGate(sessionId, runId);
    }
    canEmit(sessionId, runId) {
        if (runId == null) {
            return true;
        }
        return this.coordinator.canPublishRun(sessionId, runId);
    }
    boundGeneration(sessionId, runId) {
        var _a;
        if (runId == null) {
            return undefined;
        }
        return (_a = this.coordinator.getBoundRunGeneration(sessionId, runId)) !== null && _a !== void 0 ? _a : undefined;
    }
    emitThink(sessionId, runId, input) {
        if (!input.content || !this.canEmit(sessionId, runId)) {
            return false;
        }
        this.runEvents.emitThink(sessionId, Object.assign(Object.assign({}, input), { runId, generation: this.boundGeneration(sessionId, runId) }));
        return true;
    }
    emitAgentRunMessage(sessionId, runId, payload) {
        var _a;
        if (runId != null && !this.canEmit(sessionId, runId)) {
            return false;
        }
        this.runEvents.emitAgentRunMessage(sessionId, Object.assign(Object.assign({}, payload), { runId: runId !== null && runId !== void 0 ? runId : payload.runId, generation: (_a = payload.generation) !== null && _a !== void 0 ? _a : this.boundGeneration(sessionId, runId !== null && runId !== void 0 ? runId : payload.runId) }));
        return true;
    }
    emitHostAction(sessionId, runId, payload) {
        if (runId != null && !this.canEmit(sessionId, runId)) {
            return false;
        }
        const generation = this.boundGeneration(sessionId, runId);
        this.runEvents.emitHostAction(sessionId, Object.assign(Object.assign({}, payload), (generation != null ? { generation } : {})));
        return true;
    }
    emitConfirmationRequired(sessionId, input) {
        if (!this.coordinator.canPublishRun(sessionId, input.runId)) {
            return false;
        }
        this.runEvents.emitConfirmationRequired(sessionId, Object.assign(Object.assign({}, input), { generation: this.boundGeneration(sessionId, input.runId) }));
        return true;
    }
    emitRunComplete(sessionId, input) {
        if (!this.coordinator.canPublishRun(sessionId, input.runId)) {
            return false;
        }
        this.runEvents.emitAgentRunComplete(sessionId, Object.assign(Object.assign({}, input), { generation: this.boundGeneration(sessionId, input.runId) }));
        return true;
    }
    emitWriteConfirmationCancelled(sessionId, input) {
        const generation = this.boundGeneration(sessionId, input.runId);
        this.runEvents.emitWriteConfirmationCancelled(sessionId, Object.assign(Object.assign({}, input), { generation }));
        this.runEvents.emitAgentRunComplete(sessionId, {
            runId: input.runId,
            turnId: input.turnId,
            status: 'success',
            generation,
        });
    }
    emitRunError(sessionId, input) {
        if (!this.coordinator.isGenerationPublishable(sessionId, input.generation)) {
            return false;
        }
        this.runEvents.emitAgentRunError(sessionId, input);
        return true;
    }
    emitWriteConfirmationExpired(sessionId) {
        this.runEvents.emitAgentRunError(sessionId, {
            message: '写操作确认已过期或不存在，请重新发起请求。',
            code: 'WRITE_CONFIRMATION_EXPIRED',
            generation: this.coordinator.getGeneration(sessionId),
        });
    }
};
AgentRunSseGateway = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => require('./session-run-coordinator.service').SessionRunCoordinator))),
    __metadata("design:paramtypes", [Function, run_event_publisher_1.RunEventPublisher])
], AgentRunSseGateway);
exports.AgentRunSseGateway = AgentRunSseGateway;
//# sourceMappingURL=agent-run-sse.gateway.js.map