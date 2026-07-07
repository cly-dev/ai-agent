"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFullSessionGoaPromptMessages = exports.formatEntitiesForPrompt = exports.formatActiveTaskForPrompt = exports.formatObservationInventoryForPrompt = exports.formatArtifactsForPrompt = exports.formatRecentEpisodesForPrompt = exports.formatSessionGoaCoverageForPrompt = exports.mergeSessionObservationEntries = exports.summarizeObservationArgs = exports.countRowsInObservationOutput = exports.buildSessionGoaStorageLimits = void 0;
const session_goa_ledger_util_1 = require("./session-goa-ledger.util");
const workflow_goa_projection_util_1 = require("../../workflow/workflow-goa-projection.util");
const session_memory_constants_1 = require("../shared/session-memory.constants");
const observation_format_util_1 = require("../../agent-engine/engine/observation-format.util");
function buildSessionGoaStorageLimits() {
    return {
        maxEpisodes: (0, session_memory_constants_1.getSessionMemoryMaxEpisodes)(),
        maxArtifacts: (0, session_memory_constants_1.getSessionMemoryMaxArtifacts)(),
        maxObservationLedgerEntries: (0, session_memory_constants_1.getSessionMemoryMaxObservationLedgerEntries)(),
    };
}
exports.buildSessionGoaStorageLimits = buildSessionGoaStorageLimits;
function isObservationRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function countRowsInObservationOutput(output) {
    if (Array.isArray(output)) {
        return output.length;
    }
    if (!isObservationRecord(output)) {
        return undefined;
    }
    const data = output.data;
    if (Array.isArray(data)) {
        return data.length;
    }
    const total = output.total;
    if (typeof total === 'number' && Number.isFinite(total)) {
        return total;
    }
    return undefined;
}
exports.countRowsInObservationOutput = countRowsInObservationOutput;
function summarizeObservationArgs(args) {
    const compact = (0, observation_format_util_1.compactArgsForObservation)(args);
    if (!compact || Object.keys(compact).length === 0) {
        return '(no args)';
    }
    return JSON.stringify(compact);
}
exports.summarizeObservationArgs = summarizeObservationArgs;
function mergeSessionObservationEntries(goa) {
    var _a;
    const ledger = (_a = goa.sessionObservationLedger) !== null && _a !== void 0 ? _a : [];
    const active = goa.activeTask;
    const fromActive = active &&
        (active.status === 'in_progress' ||
            active.status === 'awaiting_confirmation')
        ? active.observationLog
        : [];
    const byKey = new Map();
    for (const row of ledger) {
        byKey.set((0, session_goa_ledger_util_1.sessionLedgerEntryKey)(row), row);
    }
    for (const row of fromActive) {
        byKey.set((0, session_goa_ledger_util_1.sessionLedgerEntryKey)(row), row);
    }
    return [...byKey.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
exports.mergeSessionObservationEntries = mergeSessionObservationEntries;
function formatSessionGoaCoverageForPrompt() {
    const limits = buildSessionGoaStorageLimits();
    return [
        '<session_goa_coverage>',
        'coverage=full_session_goa',
        `maxEpisodes=${limits.maxEpisodes}`,
        `maxArtifacts=${limits.maxArtifacts}`,
        `maxObservationLedgerEntries=${limits.maxObservationLedgerEntries}`,
        'All blocks below list every entry currently stored for this session (no prompt-layer sampling).',
        '</session_goa_coverage>',
    ].join('\n');
}
exports.formatSessionGoaCoverageForPrompt = formatSessionGoaCoverageForPrompt;
function formatRecentEpisodesForPrompt(episodes) {
    if (episodes.length === 0) {
        return null;
    }
    const lines = episodes.map((episode) => {
        const tools = episode.toolsUsed.length > 0 ? `tools=${episode.toolsUsed.join(',')}` : 'tools=none';
        const metrics = episode.metrics && Object.keys(episode.metrics).length > 0
            ? ` metrics=${Object.entries(episode.metrics)
                .map(([k, v]) => `${k}=${v}`)
                .join(',')}`
            : '';
        const refs = episode.artifactRefs.length > 0
            ? ` refs=${episode.artifactRefs.join(',')}`
            : '';
        return `- [t${episode.turnId}/r${episode.runId}] status=${episode.status} goal: ${episode.goal} | outcome: ${episode.outcome} | ${tools}${metrics}${refs}`;
    });
    return `<recent_episodes>\n${lines.join('\n')}\n</recent_episodes>`;
}
exports.formatRecentEpisodesForPrompt = formatRecentEpisodesForPrompt;
function formatArtifactsForPrompt(artifacts) {
    if (artifacts.length === 0) {
        return null;
    }
    const lines = artifacts.map((artifact) => {
        const meta = artifact.meta && Object.keys(artifact.meta).length > 0
            ? ` ${Object.entries(artifact.meta)
                .map(([k, v]) => `${k}=${v}`)
                .join(',')}`
            : '';
        const step = artifact.stepId ? ` step=${artifact.stepId}` : '';
        return `- ${artifact.id} (t${artifact.turnId}${step}; ${artifact.kind}${artifact.toolName ? `:${artifact.toolName}` : ''}): ${artifact.summary}${meta}`;
    });
    return `<artifact_summaries>\n${lines.join('\n')}\n</artifact_summaries>`;
}
exports.formatArtifactsForPrompt = formatArtifactsForPrompt;
function formatObservationInventoryForPrompt(entries, toolRoleByName) {
    if (entries.length === 0) {
        return null;
    }
    const lines = entries.map((entry) => {
        const toolRole = toolRoleByName === null || toolRoleByName === void 0 ? void 0 : toolRoleByName.get(entry.name);
        const rowCount = countRowsInObservationOutput(entry.output);
        const rolePart = toolRole && toolRole !== 'unknown' ? ` role=${toolRole}` : '';
        const rowsPart = rowCount != null ? ` rows=${rowCount}` : '';
        return `- [t${entry.turnId}/r${entry.runId}] tool=${entry.name}${rolePart} args=${summarizeObservationArgs(entry.args)}${rowsPart}`;
    });
    return `<observation_inventory>\n${lines.join('\n')}\n</observation_inventory>`;
}
exports.formatObservationInventoryForPrompt = formatObservationInventoryForPrompt;
function formatActiveTaskForPrompt(activeTask) {
    if (!activeTask) {
        return null;
    }
    if (activeTask.status === 'completed' ||
        activeTask.status === 'failed' ||
        activeTask.status === 'abandoned') {
        return null;
    }
    const stepLines = activeTask.stepProgress.map((step) => {
        const summary = step.summary ? ` — ${step.summary}` : '';
        const artifactRef = step.artifactRef ? ` ref=${step.artifactRef}` : '';
        return `  - [${step.status}] ${step.stepId} (${step.phase}/${step.kind})${summary}${artifactRef}`;
    });
    const workflowLines = activeTask.workflowRun != null
        ? [
            `workflow: ${(0, workflow_goa_projection_util_1.formatWorkflowRunPendingSummary)(activeTask.workflowRun)}`,
            ...activeTask.workflowRun.nodes.map((node) => `  - [${node.status}] ${node.nodeId} (${node.action})${node.outputRef ? ` ref=${node.outputRef}` : ''}`),
        ]
        : [];
    return [
        '<active_task>',
        `goal: ${activeTask.plan.goal}`,
        `originalRequest: ${activeTask.plan.originalUserRequest}`,
        `deliverable: ${activeTask.plan.deliverable}`,
        `status: ${activeTask.status}`,
        `pendingSteps: ${activeTask.plan.pendingStepIds.join(', ') || 'none'}`,
        `completedSteps: ${activeTask.plan.completedStepIds.join(', ') || 'none'}`,
        'steps:',
        ...stepLines,
        ...(workflowLines.length > 0 ? ['workflowNodes:', ...workflowLines] : []),
        '</active_task>',
    ].join('\n');
}
exports.formatActiveTaskForPrompt = formatActiveTaskForPrompt;
function formatEntitiesForPrompt(entities) {
    if (!entities) {
        return null;
    }
    const entries = Object.entries(entities)
        .filter(([, value]) => value != null && String(value).trim().length > 0)
        .map(([key, value]) => `${key}=${String(value)}`);
    if (entries.length === 0) {
        return null;
    }
    return `<session_entities>\n${entries.join('\n')}\n</session_entities>`;
}
exports.formatEntitiesForPrompt = formatEntitiesForPrompt;
function buildFullSessionGoaPromptMessages(payload, options) {
    var _a;
    const messages = [];
    const hasAnyContent = payload.recentEpisodes.length > 0 ||
        payload.sessionArtifacts.length > 0 ||
        mergeSessionObservationEntries(payload).length > 0 ||
        payload.activeTask != null ||
        Object.keys((_a = payload.entities) !== null && _a !== void 0 ? _a : {}).length > 0;
    if (!hasAnyContent) {
        return messages;
    }
    messages.push({
        role: 'system',
        content: formatSessionGoaCoverageForPrompt(),
    });
    const episodesText = formatRecentEpisodesForPrompt(payload.recentEpisodes);
    if (episodesText) {
        messages.push({ role: 'system', content: episodesText });
    }
    const artifactsText = formatArtifactsForPrompt(payload.sessionArtifacts);
    if (artifactsText) {
        messages.push({ role: 'system', content: artifactsText });
    }
    const inventoryText = formatObservationInventoryForPrompt(mergeSessionObservationEntries(payload), options === null || options === void 0 ? void 0 : options.toolRoleByName);
    if (inventoryText) {
        messages.push({ role: 'system', content: inventoryText });
    }
    const taskText = formatActiveTaskForPrompt(payload.activeTask);
    if (taskText) {
        messages.push({ role: 'system', content: taskText });
    }
    const entitiesText = formatEntitiesForPrompt(payload.entities);
    if (entitiesText) {
        messages.push({ role: 'system', content: entitiesText });
    }
    return messages;
}
exports.buildFullSessionGoaPromptMessages = buildFullSessionGoaPromptMessages;
//# sourceMappingURL=session-goa-full-projection.util.js.map