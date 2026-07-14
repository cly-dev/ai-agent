"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatGoaForHistoryCompression = exports.formatGoaContextHint = exports.mergeSessionObservationEntries = exports.formatSessionGoaCoverageForPrompt = exports.formatRecentEpisodesForPrompt = exports.formatObservationInventoryForPrompt = exports.formatEntitiesForPrompt = exports.formatArtifactsForPrompt = exports.formatActiveTaskForPrompt = exports.buildSessionGoaStorageLimits = exports.buildFullSessionGoaPromptMessages = exports.flattenObservationLog = exports.collectArtifactRefsForPrompt = exports.appendArtifactsFifo = exports.appendEpisodeFifo = exports.mergeTurnEpisodes = exports.mergeSessionEntities = exports.resolvePersistedActiveTask = exports.appendObservationEntries = exports.buildObservationEntriesFromContext = exports.buildActiveTaskFromAgentRun = exports.buildTurnEpisodeFromAgentRun = exports.buildArtifactsFromAgentRun = exports.artifactIdFor = void 0;
const observation_format_util_1 = require("../../agent-engine/engine/observation-format.util");
const integration_site_util_1 = require("../../../common/integration-site.util");
const workflow_goa_projection_util_1 = require("../../workflow/workflow-goa-projection.util");
const session_memory_constants_1 = require("../shared/session-memory.constants");
function truncateText(value, maxChars) {
    const trimmed = value.trim();
    if (trimmed.length <= maxChars) {
        return trimmed;
    }
    return `${trimmed.slice(0, maxChars)}…`;
}
function summarizeUnknownOutput(output) {
    if (output === null || output === undefined) {
        return '';
    }
    if (typeof output === 'string') {
        return truncateText(output, session_memory_constants_1.ARTIFACT_SUMMARY_MAX_CHARS);
    }
    try {
        return truncateText(JSON.stringify(output), session_memory_constants_1.ARTIFACT_SUMMARY_MAX_CHARS);
    }
    catch (_a) {
        return truncateText(String(output), session_memory_constants_1.ARTIFACT_SUMMARY_MAX_CHARS);
    }
}
function artifactIdFor(turnId, runId, stepId, kind) {
    const safe = stepId.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 48);
    return `art-${turnId}-${runId}-${safe || 'step'}-${kind}`;
}
exports.artifactIdFor = artifactIdFor;
function resolveGatherStepId(plan, gatherStep, usedStepIds) {
    var _a, _b;
    if (!plan) {
        return (_a = gatherStep.name) !== null && _a !== void 0 ? _a : 'gather';
    }
    const match = plan.steps.find((step) => step.phase === 'gather' &&
        !usedStepIds.has(step.id) &&
        (gatherStep.name
            ? step.toolRole === gatherStep.name || step.objective.includes(gatherStep.name)
            : true));
    if (match) {
        usedStepIds.add(match.id);
        return match.id;
    }
    const fallback = plan.steps.find((step) => step.phase === 'gather' && !usedStepIds.has(step.id));
    if (fallback) {
        usedStepIds.add(fallback.id);
        return fallback.id;
    }
    return (_b = gatherStep.name) !== null && _b !== void 0 ? _b : 'gather';
}
function resolveToolObservationStepId(plan, toolName, usedStepIds) {
    if (!plan) {
        return toolName;
    }
    const match = plan.steps.find((step) => step.kind === 'tool' &&
        !usedStepIds.has(step.id) &&
        (step.toolRole === toolName || step.objective.includes(toolName)));
    if (match) {
        usedStepIds.add(match.id);
        return match.id;
    }
    const fallback = plan.steps.find((step) => step.kind === 'tool' && !usedStepIds.has(step.id));
    if (fallback) {
        usedStepIds.add(fallback.id);
        return fallback.id;
    }
    return toolName;
}
function resolveEpisodeStatus(ctx) {
    if (ctx.runStatus === 'failed') {
        return 'failed';
    }
    if (ctx.intentKind === 'smalltalk') {
        return 'smalltalk';
    }
    if (ctx.storedTaskPlan || ctx.newToolObservations.length > 0) {
        return 'task';
    }
    return 'smalltalk';
}
function resolveEpisodeGoal(ctx) {
    var _a, _b, _c, _d;
    const fromPlan = ((_b = (_a = ctx.storedTaskPlan) === null || _a === void 0 ? void 0 : _a.goal) === null || _b === void 0 ? void 0 : _b.trim()) ||
        ((_d = (_c = ctx.storedTaskPlan) === null || _c === void 0 ? void 0 : _c.originalUserRequest) === null || _d === void 0 ? void 0 : _d.trim());
    if (fromPlan) {
        return truncateText(fromPlan, session_memory_constants_1.EPISODE_GOAL_MAX_CHARS);
    }
    return truncateText(ctx.userInput, session_memory_constants_1.EPISODE_GOAL_MAX_CHARS);
}
function extractGatherMetrics(step) {
    if (step.type !== 'gather' || step.output == null || typeof step.output !== 'object') {
        return undefined;
    }
    const row = step.output;
    const metrics = {};
    if (typeof row.total === 'number') {
        metrics.total = row.total;
    }
    if (typeof row.fetchedCount === 'number') {
        metrics.fetchedCount = row.fetchedCount;
    }
    if (typeof row.pageCount === 'number') {
        metrics.pages = row.pageCount;
    }
    return Object.keys(metrics).length > 0 ? metrics : undefined;
}
function summarizeGatherStep(step) {
    var _a;
    if (step.output == null || typeof step.output !== 'object') {
        return step.name ? `gather ${step.name}` : 'gather complete';
    }
    const row = step.output;
    const parts = [];
    if (typeof row.fetchedCount === 'number') {
        parts.push(`fetched=${row.fetchedCount}`);
    }
    if (typeof row.total === 'number') {
        parts.push(`total=${row.total}`);
    }
    if (typeof row.pageCount === 'number') {
        parts.push(`pages=${row.pageCount}`);
    }
    const tool = (_a = step.name) !== null && _a !== void 0 ? _a : 'list';
    return truncateText(parts.length > 0 ? `[${tool}] ${parts.join('; ')}` : `[${tool}] gather complete`, session_memory_constants_1.ARTIFACT_SUMMARY_MAX_CHARS);
}
function buildArtifactsFromAgentRun(ctx) {
    var _a, _b;
    const now = new Date().toISOString();
    const artifacts = [];
    const gatherSteps = ((_a = ctx.runSteps) !== null && _a !== void 0 ? _a : []).filter((step) => step.type === 'gather');
    const usedStepIds = new Set();
    for (const step of gatherSteps) {
        const toolName = (_b = step.name) !== null && _b !== void 0 ? _b : 'gather';
        const stepId = resolveGatherStepId(ctx.storedTaskPlan, step, usedStepIds);
        artifacts.push({
            id: artifactIdFor(ctx.turnId, ctx.runId, stepId, 'gather'),
            turnId: ctx.turnId,
            runId: ctx.runId,
            stepId,
            kind: 'gather',
            toolName,
            summary: summarizeGatherStep(step),
            meta: extractGatherMetrics(step),
            createdAt: now,
        });
    }
    const gatherToolNames = new Set(gatherSteps.map((step) => step.name).filter(Boolean));
    for (const observation of ctx.newToolObservations) {
        if (gatherToolNames.has(observation.name)) {
            continue;
        }
        const summary = summarizeUnknownOutput(observation.output);
        if (!summary) {
            continue;
        }
        const stepId = resolveToolObservationStepId(ctx.storedTaskPlan, observation.name, usedStepIds);
        artifacts.push({
            id: artifactIdFor(ctx.turnId, ctx.runId, stepId, 'tool_result'),
            turnId: ctx.turnId,
            runId: ctx.runId,
            stepId,
            kind: 'tool_result',
            toolName: observation.name,
            summary: truncateText(`[${observation.name}] ${summary}`, session_memory_constants_1.ARTIFACT_SUMMARY_MAX_CHARS),
            createdAt: now,
        });
    }
    return artifacts;
}
exports.buildArtifactsFromAgentRun = buildArtifactsFromAgentRun;
function buildTurnEpisodeFromAgentRun(ctx, artifacts) {
    var _a;
    const gatherMetrics = ((_a = ctx.runSteps) !== null && _a !== void 0 ? _a : [])
        .filter((step) => step.type === 'gather')
        .map((step) => extractGatherMetrics(step))
        .find((metrics) => metrics != null);
    return {
        turnId: ctx.turnId,
        runId: ctx.runId,
        goal: resolveEpisodeGoal(ctx),
        outcome: truncateText(ctx.finalOutput, session_memory_constants_1.EPISODE_OUTCOME_MAX_CHARS),
        status: resolveEpisodeStatus(ctx),
        toolsUsed: [
            ...new Set(ctx.newToolObservations.map((row) => row.name).filter(Boolean)),
        ],
        metrics: gatherMetrics,
        artifactRefs: artifacts.map((artifact) => artifact.id),
        createdAt: new Date().toISOString(),
    };
}
exports.buildTurnEpisodeFromAgentRun = buildTurnEpisodeFromAgentRun;
function resolveArtifactRefForPlanStep(planStep, artifacts, usedArtifactIds, turnId, runId) {
    const byStepId = artifacts.find((artifact) => artifact.stepId === planStep.id && !usedArtifactIds.has(artifact.id));
    if (byStepId) {
        usedArtifactIds.add(byStepId.id);
        return byStepId.id;
    }
    const expectedKind = planStep.phase === 'gather'
        ? 'gather'
        : planStep.kind === 'tool'
            ? 'tool_result'
            : undefined;
    if (!expectedKind) {
        return undefined;
    }
    const expectedId = artifactIdFor(turnId, runId, planStep.id, expectedKind);
    const byId = artifacts.find((artifact) => artifact.id === expectedId && !usedArtifactIds.has(artifact.id));
    if (byId) {
        usedArtifactIds.add(byId.id);
        return byId.id;
    }
    return undefined;
}
function summarizeStepFromRun(planStep, ctx, artifacts) {
    var _a, _b, _c;
    if (planStep.kind === 'summarize' || planStep.phase === 'answer') {
        return truncateText(ctx.finalOutput, 200);
    }
    const gather = ((_a = ctx.runSteps) !== null && _a !== void 0 ? _a : []).find((step) => step.type === 'gather' && step.name);
    if (gather) {
        return summarizeGatherStep(gather);
    }
    const artifact = artifacts.find((row) => row.stepId === planStep.id);
    return (_b = artifact === null || artifact === void 0 ? void 0 : artifact.summary) !== null && _b !== void 0 ? _b : (_c = artifacts.find((row) => row.toolName)) === null || _c === void 0 ? void 0 : _c.summary;
}
function resolveActiveTaskStatus(input) {
    if (input.awaitingWriteConfirmation) {
        return 'awaiting_confirmation';
    }
    if (input.runStatus === 'failed') {
        return 'failed';
    }
    const allDone = input.plan.steps.every((step) => input.plan.completedStepIds.includes(step.id));
    return allDone ? 'completed' : 'in_progress';
}
function buildActiveTaskFromAgentRun(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const plan = input.ctx.storedTaskPlan;
    if (!plan || plan.steps.length === 0) {
        return null;
    }
    const completed = new Set(plan.completedStepIds);
    const pending = new Set(plan.pendingStepIds);
    const usedArtifactIds = new Set();
    const workflowRun = (_c = (_a = input.ctx.workflowRun) !== null && _a !== void 0 ? _a : (_b = input.prev) === null || _b === void 0 ? void 0 : _b.workflowRun) !== null && _c !== void 0 ? _c : null;
    const stepProgress = workflowRun != null
        ? (0, workflow_goa_projection_util_1.buildStepProgressFromWorkflowRun)({ workflowRun, plan })
        : plan.steps.map((planStep) => {
            let status = 'pending';
            if (completed.has(planStep.id)) {
                status = 'done';
            }
            else if (pending.has(planStep.id)) {
                status =
                    plan.currentStepId === planStep.id ? 'running' : 'pending';
            }
            else if (plan.currentStepId === planStep.id) {
                status = 'running';
            }
            const artifactRef = resolveArtifactRefForPlanStep(planStep, input.artifacts, usedArtifactIds, input.ctx.turnId, input.ctx.runId);
            return {
                stepId: planStep.id,
                phase: planStep.phase,
                kind: planStep.kind,
                status,
                summary: status === 'done' || status === 'running'
                    ? summarizeStepFromRun(planStep, input.ctx, input.artifacts)
                    : undefined,
                artifactRef,
            };
        });
    const observationLog = appendObservationEntries((_e = (_d = input.prev) === null || _d === void 0 ? void 0 : _d.observationLog) !== null && _e !== void 0 ? _e : [], buildObservationEntriesFromContext(input.ctx));
    return Object.assign(Object.assign({ taskId: (_g = (_f = input.prev) === null || _f === void 0 ? void 0 : _f.taskId) !== null && _g !== void 0 ? _g : `task-${input.ctx.turnId}-${input.ctx.runId}`, status: workflowRun != null
            ? (0, workflow_goa_projection_util_1.resolveActiveTaskStatusFromWorkflow)({
                workflowRun,
                plan,
                runStatus: input.ctx.runStatus,
                awaitingWriteConfirmation: input.ctx.awaitingWriteConfirmation,
            })
            : resolveActiveTaskStatus({
                plan,
                runStatus: input.ctx.runStatus,
                awaitingWriteConfirmation: input.ctx.awaitingWriteConfirmation,
            }), plan,
        stepProgress,
        observationLog }, (workflowRun != null ? { workflowRun } : {})), { startedTurnId: (_j = (_h = input.prev) === null || _h === void 0 ? void 0 : _h.startedTurnId) !== null && _j !== void 0 ? _j : input.ctx.turnId, lastTurnId: input.ctx.turnId, lastRunId: input.ctx.runId, updatedAt: new Date().toISOString() });
}
exports.buildActiveTaskFromAgentRun = buildActiveTaskFromAgentRun;
function buildObservationEntriesFromContext(ctx) {
    const now = new Date().toISOString();
    return ctx.newToolObservations.map((row) => (Object.assign({ runId: ctx.runId, turnId: ctx.turnId, name: row.name, output: row.output, createdAt: now }, ((0, observation_format_util_1.compactArgsForObservation)(row.args)
        ? { args: (0, observation_format_util_1.compactArgsForObservation)(row.args) }
        : {}))));
}
exports.buildObservationEntriesFromContext = buildObservationEntriesFromContext;
function observationEntryKey(row) {
    try {
        return `${row.runId}:${row.turnId}:${row.name}:${JSON.stringify(row.output)}`;
    }
    catch (_a) {
        return `${row.runId}:${row.turnId}:${row.name}:${String(row.output)}`;
    }
}
function appendObservationEntries(existing, incoming) {
    if (incoming.length === 0) {
        return existing;
    }
    const keys = new Set(existing.map((row) => observationEntryKey(row)));
    const merged = [...existing];
    for (const row of incoming) {
        const key = observationEntryKey(row);
        if (keys.has(key)) {
            continue;
        }
        keys.add(key);
        merged.push(row);
    }
    const max = (0, session_memory_constants_1.getSessionMemoryMaxObservationSnapshots)() * 50;
    return merged.slice(-max);
}
exports.appendObservationEntries = appendObservationEntries;
function resolvePersistedActiveTask(input) {
    if (input.ctx.abandonActiveTask) {
        return null;
    }
    if (input.built) {
        return input.built;
    }
    const prev = input.base.activeTask;
    if (!prev) {
        return null;
    }
    if (input.ctx.intentKind === 'smalltalk') {
        return null;
    }
    if (input.ctx.runStatus === 'failed') {
        if (prev.status === 'in_progress' ||
            prev.status === 'awaiting_confirmation') {
            return Object.assign(Object.assign({}, prev), { status: 'failed', updatedAt: new Date().toISOString() });
        }
        return prev;
    }
    if (prev.status === 'in_progress' ||
        prev.status === 'awaiting_confirmation') {
        return prev;
    }
    return null;
}
exports.resolvePersistedActiveTask = resolvePersistedActiveTask;
function mergeSessionEntities(prev, userInput) {
    var _a;
    const entities = Object.assign({}, prev);
    const shopId = (0, integration_site_util_1.resolveXShopIdFromUserMessage)(userInput);
    if (shopId && String((_a = entities.xShopId) !== null && _a !== void 0 ? _a : '').trim() === '') {
        entities.xShopId = shopId;
    }
    return entities;
}
exports.mergeSessionEntities = mergeSessionEntities;
function mergeTurnEpisodes(existing, incoming) {
    var _a;
    return Object.assign(Object.assign({}, incoming), { goal: existing.goal || incoming.goal, outcome: incoming.outcome || existing.outcome, status: incoming.status === 'failed'
            ? 'failed'
            : existing.status === 'task' || incoming.status === 'task'
                ? 'task'
                : incoming.status, toolsUsed: [
            ...new Set([...existing.toolsUsed, ...incoming.toolsUsed]),
        ], artifactRefs: [
            ...new Set([...existing.artifactRefs, ...incoming.artifactRefs]),
        ], metrics: (_a = incoming.metrics) !== null && _a !== void 0 ? _a : existing.metrics, runId: incoming.runId });
}
exports.mergeTurnEpisodes = mergeTurnEpisodes;
function appendEpisodeFifo(existing, episode) {
    const max = (0, session_memory_constants_1.getSessionMemoryMaxEpisodes)();
    const prior = existing.find((row) => row.turnId === episode.turnId);
    const withoutDup = existing.filter((row) => row.turnId !== episode.turnId);
    const merged = prior ? mergeTurnEpisodes(prior, episode) : episode;
    return [...withoutDup, merged].slice(-max);
}
exports.appendEpisodeFifo = appendEpisodeFifo;
function appendArtifactsFifo(existing, incoming) {
    const max = (0, session_memory_constants_1.getSessionMemoryMaxArtifacts)();
    const incomingIds = new Set(incoming.map((row) => row.id));
    const kept = existing.filter((row) => !incomingIds.has(row.id));
    return [...kept, ...incoming].slice(-max);
}
exports.appendArtifactsFifo = appendArtifactsFifo;
function collectArtifactRefsForPrompt(input) {
    var _a, _b;
    const refs = new Set();
    const episodeSlice = input.maxEpisodes
        ? input.episodes.slice(-input.maxEpisodes)
        : input.episodes;
    for (const episode of episodeSlice) {
        for (const ref of episode.artifactRefs) {
            refs.add(ref);
        }
    }
    for (const step of (_b = (_a = input.activeTask) === null || _a === void 0 ? void 0 : _a.stepProgress) !== null && _b !== void 0 ? _b : []) {
        if (step.artifactRef) {
            refs.add(step.artifactRef);
        }
    }
    return [...refs];
}
exports.collectArtifactRefsForPrompt = collectArtifactRefsForPrompt;
function flattenObservationLog(log) {
    return log.map((row) => ({ name: row.name, output: row.output }));
}
exports.flattenObservationLog = flattenObservationLog;
var session_goa_full_projection_util_1 = require("./session-goa-full-projection.util");
Object.defineProperty(exports, "buildFullSessionGoaPromptMessages", { enumerable: true, get: function () { return session_goa_full_projection_util_1.buildFullSessionGoaPromptMessages; } });
Object.defineProperty(exports, "buildSessionGoaStorageLimits", { enumerable: true, get: function () { return session_goa_full_projection_util_1.buildSessionGoaStorageLimits; } });
Object.defineProperty(exports, "formatActiveTaskForPrompt", { enumerable: true, get: function () { return session_goa_full_projection_util_1.formatActiveTaskForPrompt; } });
Object.defineProperty(exports, "formatArtifactsForPrompt", { enumerable: true, get: function () { return session_goa_full_projection_util_1.formatArtifactsForPrompt; } });
Object.defineProperty(exports, "formatEntitiesForPrompt", { enumerable: true, get: function () { return session_goa_full_projection_util_1.formatEntitiesForPrompt; } });
Object.defineProperty(exports, "formatObservationInventoryForPrompt", { enumerable: true, get: function () { return session_goa_full_projection_util_1.formatObservationInventoryForPrompt; } });
Object.defineProperty(exports, "formatRecentEpisodesForPrompt", { enumerable: true, get: function () { return session_goa_full_projection_util_1.formatRecentEpisodesForPrompt; } });
Object.defineProperty(exports, "formatSessionGoaCoverageForPrompt", { enumerable: true, get: function () { return session_goa_full_projection_util_1.formatSessionGoaCoverageForPrompt; } });
Object.defineProperty(exports, "mergeSessionObservationEntries", { enumerable: true, get: function () { return session_goa_full_projection_util_1.mergeSessionObservationEntries; } });
function formatGoaContextHint(episodes, activeTask) {
    const parts = [];
    const last = episodes[episodes.length - 1];
    if (last) {
        parts.push(`lastEpisode=[t${last.turnId}] goal=${last.goal}; outcome=${last.outcome}`);
    }
    if (activeTask) {
        parts.push(`activeTask=${activeTask.status}; goal=${activeTask.plan.goal}; pending=${activeTask.stepProgress
            .filter((step) => step.status === 'pending' || step.status === 'running')
            .map((step) => step.stepId)
            .join(',')}`);
    }
    return parts.join('; ');
}
exports.formatGoaContextHint = formatGoaContextHint;
function formatGoaForHistoryCompression(payload) {
    var _a, _b;
    const parts = [];
    const episodeLines = ((_a = payload.recentEpisodes) !== null && _a !== void 0 ? _a : [])
        .slice(-3)
        .map((ep) => `[t${ep.turnId}] ${ep.status} goal=${ep.goal} outcome=${ep.outcome}`);
    if (episodeLines.length > 0) {
        parts.push(`Recent episodes:\n${episodeLines.join('\n')}`);
    }
    if (payload.activeTask) {
        parts.push(`Active task: ${payload.activeTask.status} goal=${payload.activeTask.plan.goal}`);
    }
    const shopId = (_b = payload.entities) === null || _b === void 0 ? void 0 : _b.xShopId;
    if (shopId != null && String(shopId).trim()) {
        parts.push(`Session entity xShopId=${String(shopId)}`);
    }
    return parts.join('\n\n');
}
exports.formatGoaForHistoryCompression = formatGoaForHistoryCompression;
//# sourceMappingURL=session-goa-projection.util.js.map