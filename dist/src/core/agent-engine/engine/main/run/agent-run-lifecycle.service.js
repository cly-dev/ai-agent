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
exports.AgentRunLifecycleService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../../../../generated/prisma/client");
const prisma_service_1 = require("../../../../../prisma/prisma.service");
const session_goa_service_1 = require("../../../../memory/goa/session-goa.service");
const session_history_compression_service_1 = require("../../../../memory/context/session-history-compression.service");
const run_metrics_util_1 = require("../../run-metrics.util");
const message_blocks_util_1 = require("../../message/message-blocks.util");
const agent_run_sse_emitter_1 = require("./agent-run-sse.emitter");
const run_assistant_artifact_store_1 = require("./run-assistant-artifact.store");
const run_assistant_message_persist_service_1 = require("./run-assistant-message-persist.service");
const runtime_cache_invalidator_service_1 = require("../../../../runtime-cache/runtime-cache-invalidator.service");
const agent_run_steps_util_1 = require("./agent-run-steps.util");
const agent_run_audit_util_1 = require("./agent-run-audit.util");
const session_goa_run_snapshot_util_1 = require("../../../../memory/goa/session-goa-run-snapshot.util");
const session_graph_resume_util_1 = require("../session/session-graph-resume.util");
function newToolObservationsFromGraph(graphState) {
    return graphState.toolObservations.map((row) => {
        var _a;
        return (Object.assign({ name: row.name, output: row.output }, (((_a = row.llmPayload) === null || _a === void 0 ? void 0 : _a.args) ? { args: row.llmPayload.args } : {})));
    });
}
function buildMemoryUpdateContext(input) {
    return Object.assign({ turnId: input.turnId, runId: input.runId, userInput: input.userInput, finalOutput: input.finalOutput, newToolObservations: newToolObservationsFromGraph(input.graphState), runSteps: (0, agent_run_audit_util_1.filterUserVisibleRunSteps)(input.graphState.steps).map((step) => ({
            type: step.type,
            name: step.name,
            output: step.output,
        })), storedTaskPlan: input.graphState.taskPlan
            ? (0, session_graph_resume_util_1.toStoredTaskPlan)(input.graphState.taskPlan)
            : null, runStatus: input.runStatus, intentKind: input.graphState.intentKind, phase: input.graphState.awaitingWriteConfirmation ? 'task_only' : 'full', awaitingWriteConfirmation: input.graphState.awaitingWriteConfirmation, abandonActiveTask: input.graphState.planAborted === true }, (input.graphState.workflowRun
        ? { workflowRun: input.graphState.workflowRun }
        : {}));
}
let AgentRunLifecycleService = class AgentRunLifecycleService {
    constructor(prisma, goaService, sessionHistoryCompression, sse, assistantArtifact, messagePersist, runtimeCacheInvalidator) {
        this.prisma = prisma;
        this.goaService = goaService;
        this.sessionHistoryCompression = sessionHistoryCompression;
        this.sse = sse;
        this.assistantArtifact = assistantArtifact;
        this.messagePersist = messagePersist;
        this.runtimeCacheInvalidator = runtimeCacheInvalidator;
    }
    parseStepsFromRun(steps) {
        if (!Array.isArray(steps)) {
            return [];
        }
        return steps;
    }
    async updateRun(runId, steps, status) {
        const persistedSteps = (0, agent_run_audit_util_1.stepsForRunPersistence)(steps);
        await this.prisma.agentRun.update({
            where: { id: runId },
            data: {
                steps: persistedSteps,
                currentStep: (0, agent_run_steps_util_1.maxRunStepNumber)(persistedSteps),
                status,
            },
        });
    }
    buildRunFinishMetricsData(runMetrics, finishReason) {
        var _a;
        const snapshot = (0, run_metrics_util_1.snapshotRunMetrics)(runMetrics);
        return {
            finishedAt: new Date(),
            durationMs: snapshot.durationMs,
            llmDurationMs: snapshot.llmDurationMs,
            toolDurationMs: snapshot.toolDurationMs,
            model: (_a = snapshot.model) !== null && _a !== void 0 ? _a : null,
            promptTokens: snapshot.promptTokens,
            completionTokens: snapshot.completionTokens,
            totalTokens: snapshot.totalTokens,
            llmCallCount: snapshot.llmCallCount,
            toolCallCount: snapshot.toolCallCount,
            toolsUsed: snapshot.toolsUsed,
            finishReason,
        };
    }
    async finalizeRunAndTurnInTx(tx, input) {
        var _a;
        const metricsData = this.buildRunFinishMetricsData(input.runMetrics, input.finishReason);
        await tx.agentRun.update({
            where: { id: input.runId },
            data: Object.assign(Object.assign(Object.assign({}, (input.persistTurnAssistant
                ? { output: input.finalOutput || null }
                : {})), { status: input.status, error: (_a = input.error) !== null && _a !== void 0 ? _a : null, steps: input.steps
                    ? input.steps
                    : undefined, currentStep: input.currentStep, goaSnapshot: input.goaSnapshot
                    ? input.goaSnapshot
                    : undefined }), metricsData),
        });
        await tx.messageTurn.update({
            where: { id: input.turnId },
            data: Object.assign(Object.assign({ status: input.status }, (input.persistTurnAssistant
                ? { finalOutput: input.finalOutput || null }
                : {})), metricsData),
        });
    }
    async finalizeRunAndTurn(input) {
        var _a;
        const finishReason = input.finishReason;
        const persistTurnAssistant = (_a = input.persistTurnAssistant) !== null && _a !== void 0 ? _a : input.finalOutput.trim().length > 0;
        await this.prisma.$transaction((tx) => this.finalizeRunAndTurnInTx(tx, Object.assign(Object.assign({}, input), { finishReason,
            persistTurnAssistant })));
    }
    sanitizeFinalOutput(finalOutput) {
        return (0, message_blocks_util_1.sanitizeStoredFinalOutput)(finalOutput);
    }
    resolveFinalOutputFromArtifact(sessionId, runId) {
        const fromArtifact = this.assistantArtifact.peekSerialized(sessionId, runId);
        return this.sanitizeFinalOutput(fromArtifact !== null && fromArtifact !== void 0 ? fromArtifact : '');
    }
    finalOutputPlainText(finalOutput) {
        const blocks = (0, message_blocks_util_1.tryParseStoredMessageBlocks)(finalOutput);
        if (blocks === null || blocks === void 0 ? void 0 : blocks.length) {
            return (0, message_blocks_util_1.messageBlocksToPlainText)(blocks);
        }
        return finalOutput;
    }
    async awaitPostRunMemoryTasks(sessionId, ctx) {
        try {
            await this.goaService.refreshFromAgentRun(sessionId, ctx);
            await this.sessionHistoryCompression.maybeCompressAfterTurn(sessionId);
        }
        catch (_a) {
        }
    }
    schedulePostRunMemoryTasks(sessionId, ctx) {
        void this.awaitPostRunMemoryTasks(sessionId, ctx);
    }
    buildFailureMemoryContext(input) {
        var _a, _b;
        const toolObservations = [];
        let intentKind = 'task';
        for (const step of input.steps) {
            if (step.type === 'intent' && step.output != null && typeof step.output === 'object') {
                const row = step.output;
                if (row.intentKind === 'task' || row.intentKind === 'smalltalk' || row.intentKind === 'unclear') {
                    intentKind = row.intentKind;
                }
            }
            if (step.type !== 'tool') {
                continue;
            }
            const output = (_b = (_a = step.meta) === null || _a === void 0 ? void 0 : _a.observationOutput) !== null && _b !== void 0 ? _b : (step.output != null && typeof step.output === 'object' && !Array.isArray(step.output)
                ? step.output.observation
                : step.output);
            if (typeof step.name === 'string' && step.name.trim()) {
                toolObservations.push({ name: step.name.trim(), output });
            }
        }
        return {
            turnId: input.turnId,
            runId: input.runId,
            userInput: input.userInput,
            finalOutput: input.finalOutput,
            newToolObservations: toolObservations,
            runSteps: input.steps.map((step) => ({
                type: step.type,
                name: step.name,
                output: step.output,
            })),
            runStatus: 'failed',
            intentKind,
        };
    }
    resolveFallbackReply(config) {
        if (!config || typeof config !== 'object' || Array.isArray(config)) {
            return null;
        }
        const row = config;
        const fallback = row.fallbackReply;
        if (typeof fallback !== 'string') {
            return null;
        }
        return fallback.trim().length > 0 ? fallback.trim() : null;
    }
    async finishAgentRun(input) {
        const finalOutput = this.resolveFinalOutputFromArtifact(input.sessionId, input.runId);
        const persistTurnAssistant = this.assistantArtifact.isPersistableAssistantArtifact(input.sessionId, input.runId);
        const finishReason = (0, run_metrics_util_1.resolveFinishReason)({
            status: input.status,
            steps: input.steps,
            finishedEarly: input.finishedEarly === true,
            error: input.error,
        });
        this.sse.emitRunMessageBlocksIfNeeded(input.sessionId, input.runId, input.turnId);
        let persistedMessage = null;
        let replacedTurnOutput = false;
        await this.prisma.$transaction(async (tx) => {
            await this.finalizeRunAndTurnInTx(tx, {
                turnId: input.turnId,
                runId: input.runId,
                runMetrics: input.runMetrics,
                finalOutput,
                persistTurnAssistant,
                status: input.status,
                finishReason,
                error: input.error,
                scopedToolCount: input.scopedToolCount,
                steps: input.steps,
                currentStep: (0, agent_run_steps_util_1.maxRunStepNumber)(input.steps),
                goaSnapshot: input.goaSnapshot,
            });
            const persisted = await this.messagePersist.persistFromArtifactInTx(tx, {
                userId: input.userId,
                sessionId: input.sessionId,
                runId: input.runId,
                turnId: input.turnId,
            });
            persistedMessage = persisted.message;
            replacedTurnOutput = persisted.replacedTurnOutput;
        });
        if (persistedMessage) {
            await this.messagePersist.syncPersistedMessage(input.sessionId, persistedMessage, { replacedTurnOutput });
        }
        if (input.memoryContext) {
            await this.awaitPostRunMemoryTasks(input.sessionId, input.memoryContext);
        }
        return {
            runId: input.runId,
            turnId: input.turnId,
            output: finalOutput,
            status: input.status,
        };
    }
    async completeAgentRunFromGraph(input) {
        let status = input.graphState.status;
        const steps = (0, agent_run_audit_util_1.filterUserVisibleRunSteps)([...input.graphState.steps]);
        const goaSnapshot = (0, session_goa_run_snapshot_util_1.buildAgentRunGoaSnapshot)({
            graphState: input.graphState,
            runFailed: input.graphState.status === client_1.AgentRunStatus.failed,
        });
        if (!input.graphState.awaitingWriteConfirmation &&
            status !== client_1.AgentRunStatus.success) {
            const fallback = this.resolveFallbackReply(input.agent.config);
            if (!fallback) {
                throw new common_1.BadRequestException('agent run exceeded max steps');
            }
            this.sse.publishAssistantBlocks(input.sessionId, input.runId, [
                (0, message_blocks_util_1.textBlock)(fallback),
            ]);
            status = client_1.AgentRunStatus.success;
        }
        const result = await this.finishAgentRun({
            userId: input.userId,
            sessionId: input.sessionId,
            turnId: input.turnId,
            runId: input.runId,
            status,
            steps,
            scopedToolCount: input.graphState.scopedTools.length,
            runMetrics: input.runMetrics,
            finishedEarly: input.graphState.finished && input.graphState.iteration === 0,
            goaSnapshot,
        });
        await this.awaitPostRunMemoryTasks(input.sessionId, buildMemoryUpdateContext({
            turnId: input.turnId,
            runId: input.runId,
            userInput: input.latestUserMessage,
            finalOutput: this.finalOutputPlainText(result.output),
            runStatus: status === client_1.AgentRunStatus.failed ? 'failed' : 'success',
            graphState: input.graphState,
        }));
        this.runtimeCacheInvalidator.clearRunScope(input.runId);
        return result;
    }
};
AgentRunLifecycleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        session_goa_service_1.SessionGoaService,
        session_history_compression_service_1.SessionHistoryCompressionService,
        agent_run_sse_emitter_1.AgentRunSseEmitter,
        run_assistant_artifact_store_1.RunAssistantArtifactStore,
        run_assistant_message_persist_service_1.RunAssistantMessagePersistService,
        runtime_cache_invalidator_service_1.RuntimeCacheInvalidator])
], AgentRunLifecycleService);
exports.AgentRunLifecycleService = AgentRunLifecycleService;
//# sourceMappingURL=agent-run-lifecycle.service.js.map