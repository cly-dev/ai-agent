"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RunAssistantArtifactStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunAssistantArtifactStore = void 0;
const common_1 = require("@nestjs/common");
const message_blocks_util_1 = require("../../message/message-blocks.util");
let RunAssistantArtifactStore = RunAssistantArtifactStore_1 = class RunAssistantArtifactStore {
    constructor() {
        this.logger = new common_1.Logger(RunAssistantArtifactStore_1.name);
        this.slots = new Map();
    }
    runKey(sessionId, runId) {
        return `${sessionId}:${runId}`;
    }
    reset(sessionId, runId, turnId) {
        this.slots.set(this.runKey(sessionId, runId), { turnId, artifact: null });
    }
    clear(sessionId, runId) {
        this.slots.delete(this.runKey(sessionId, runId));
    }
    commit(sessionId, runId, blocks, phase = 'final') {
        const slot = this.slots.get(this.runKey(sessionId, runId));
        if (!slot) {
            this.logger.warn(`artifact commit skipped: slot missing sessionId=${sessionId} runId=${runId}`);
            return null;
        }
        const sanitized = (0, message_blocks_util_1.sanitizeMessageBlocks)(blocks);
        if (sanitized.length === 0) {
            return null;
        }
        const artifact = {
            runId,
            turnId: slot.turnId,
            blocks: sanitized,
            serialized: (0, message_blocks_util_1.serializeMessageBlocksForStorage)(sanitized),
            phase,
        };
        slot.artifact = artifact;
        return artifact;
    }
    peek(sessionId, runId) {
        var _a, _b;
        return (_b = (_a = this.slots.get(this.runKey(sessionId, runId))) === null || _a === void 0 ? void 0 : _a.artifact) !== null && _b !== void 0 ? _b : null;
    }
    peekSerialized(sessionId, runId) {
        var _a;
        const serialized = (_a = this.peek(sessionId, runId)) === null || _a === void 0 ? void 0 : _a.serialized;
        return serialized && serialized.trim().length > 0 ? serialized : null;
    }
    peekBlocks(sessionId, runId) {
        var _a, _b;
        return (_b = (_a = this.peek(sessionId, runId)) === null || _a === void 0 ? void 0 : _a.blocks) !== null && _b !== void 0 ? _b : [];
    }
    peekTurnId(sessionId, runId) {
        var _a, _b;
        return (_b = (_a = this.slots.get(this.runKey(sessionId, runId))) === null || _a === void 0 ? void 0 : _a.turnId) !== null && _b !== void 0 ? _b : null;
    }
    isPersistableAssistantArtifact(sessionId, runId) {
        const artifact = this.peek(sessionId, runId);
        return Boolean(artifact === null || artifact === void 0 ? void 0 : artifact.serialized.trim());
    }
    appendBlocks(sessionId, runId, blocks) {
        var _a, _b;
        const extra = (0, message_blocks_util_1.sanitizeMessageBlocks)(blocks);
        if (extra.length === 0) {
            return this.peek(sessionId, runId);
        }
        const current = this.peek(sessionId, runId);
        const merged = (0, message_blocks_util_1.sanitizeMessageBlocks)([...((_a = current === null || current === void 0 ? void 0 : current.blocks) !== null && _a !== void 0 ? _a : []), ...extra]);
        if (merged.length === 0) {
            return null;
        }
        return this.commit(sessionId, runId, merged, (_b = current === null || current === void 0 ? void 0 : current.phase) !== null && _b !== void 0 ? _b : 'draft');
    }
    shouldPersistAtFinish(sessionId, runId) {
        return this.isPersistableAssistantArtifact(sessionId, runId);
    }
    formatOutput(sessionId, runId, fallbackSerialized) {
        const artifact = this.peek(sessionId, runId);
        if (artifact === null || artifact === void 0 ? void 0 : artifact.blocks.length) {
            return {
                serialized: artifact.serialized,
                stepPlain: (0, message_blocks_util_1.messageBlocksToPlainText)(artifact.blocks),
            };
        }
        const serialized = (0, message_blocks_util_1.sanitizeStoredFinalOutput)(fallbackSerialized);
        const blocks = (0, message_blocks_util_1.tryParseStoredMessageBlocks)(serialized);
        return {
            serialized,
            stepPlain: blocks && blocks.length > 0
                ? (0, message_blocks_util_1.messageBlocksToPlainText)(blocks)
                : serialized,
        };
    }
    rephase(sessionId, runId, phase) {
        const current = this.peek(sessionId, runId);
        if (!current) {
            return;
        }
        this.commit(sessionId, runId, current.blocks, phase);
    }
};
RunAssistantArtifactStore = RunAssistantArtifactStore_1 = __decorate([
    (0, common_1.Injectable)()
], RunAssistantArtifactStore);
exports.RunAssistantArtifactStore = RunAssistantArtifactStore;
//# sourceMappingURL=run-assistant-artifact.store.js.map