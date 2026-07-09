"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunExecutionScope = void 0;
class RunExecutionScope {
    constructor(coordinator, input) {
        this.coordinator = coordinator;
        this.sessionId = input.sessionId;
        this.userId = input.userId;
        this.generation = input.generation;
        this.token = input.token;
        this.supersedeReason = input.supersedeReason;
    }
    get abortSignal() {
        return this.token.abortSignal;
    }
    assertActive(runId = 0) {
        this.coordinator.assertExecutionActive(this.sessionId, this.asHandle(), runId);
    }
    startRun(runId, turnId) {
        this.coordinator.beginRun(this.sessionId, {
            runId,
            turnId,
            userId: this.userId,
            generation: this.generation,
            token: this.token,
        });
    }
    endRun(runId) {
        this.coordinator.endRun(this.sessionId, runId);
    }
    isPublishable() {
        return this.coordinator.isGenerationPublishable(this.sessionId, this.generation);
    }
    asHandle() {
        return {
            generation: this.generation,
            token: this.token,
            supersedeReason: this.supersedeReason,
        };
    }
}
exports.RunExecutionScope = RunExecutionScope;
//# sourceMappingURL=run-execution.scope.js.map