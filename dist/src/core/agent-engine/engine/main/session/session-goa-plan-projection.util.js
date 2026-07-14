"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPlanSessionWorkingMemory = void 0;
const session_goa_full_projection_util_1 = require("../../../../memory/goa/session-goa-full-projection.util");
const task_plan_util_1 = require("../plan/task-plan.util");
function buildToolRoleByName(scopedTools) {
    const map = new Map();
    for (const tool of scopedTools) {
        map.set(tool.name, (0, task_plan_util_1.resolveScopedToolRoleForPlan)(tool));
    }
    return map;
}
function buildEpisodesForPlan(episodes) {
    return episodes.map((episode) => (Object.assign(Object.assign({ turnId: episode.turnId, runId: episode.runId, goal: episode.goal, outcome: episode.outcome, status: episode.status, toolsUsed: episode.toolsUsed, artifactRefs: episode.artifactRefs }, (episode.metrics && Object.keys(episode.metrics).length > 0
        ? { metrics: episode.metrics }
        : {})), { createdAt: episode.createdAt })));
}
function buildArtifactsForPlan(artifacts) {
    return artifacts.map((artifact) => (Object.assign(Object.assign(Object.assign(Object.assign({ id: artifact.id, turnId: artifact.turnId, kind: artifact.kind, summary: artifact.summary }, (artifact.toolName ? { toolName: artifact.toolName } : {})), (artifact.stepId ? { stepId: artifact.stepId } : {})), (artifact.meta && Object.keys(artifact.meta).length > 0
        ? { meta: artifact.meta }
        : {})), { createdAt: artifact.createdAt })));
}
function buildActiveTaskForPlan(activeTask) {
    if (!activeTask) {
        return undefined;
    }
    return {
        status: activeTask.status,
        goal: activeTask.plan.goal,
        deliverable: activeTask.plan.deliverable,
        originalUserRequest: activeTask.plan.originalUserRequest,
        pendingStepIds: activeTask.plan.pendingStepIds,
        completedStepIds: activeTask.plan.completedStepIds,
        currentStepId: activeTask.plan.currentStepId,
        stepProgress: activeTask.stepProgress.map((step) => (Object.assign(Object.assign({ stepId: step.stepId, phase: step.phase, kind: step.kind, status: step.status }, (step.summary ? { summary: step.summary } : {})), (step.artifactRef ? { artifactRef: step.artifactRef } : {})))),
    };
}
function buildSatisfiedToolRolesForPlan(input) {
    const roles = new Set();
    for (const tool of input.scopedTools) {
        const role = (0, task_plan_util_1.resolveScopedToolRoleForPlan)(tool);
        if (role !== 'unknown') {
            roles.add(role);
        }
    }
    const satisfied = [];
    for (const role of roles) {
        const step = {
            id: `memory-check-${role}`,
            phase: defaultPhaseForToolRole(role),
            kind: 'tool',
            toolRole: role,
            objective: `Reuse session data for ${role} when sufficient.`,
        };
        if ((0, task_plan_util_1.isPlanToolStepSatisfiedByObservations)({
            step,
            observations: input.runOwnedObservations,
            scopedTools: input.scopedTools,
            purpose: 'pre_tools_advance',
        })) {
            satisfied.push(role);
        }
    }
    return satisfied;
}
function defaultPhaseForToolRole(role) {
    if (role === 'write-batch' ||
        role === 'write-single' ||
        role === 'write-meta' ||
        role === 'admin') {
        return 'mutate';
    }
    if (role === 'read-stats') {
        return 'analyze';
    }
    return 'gather';
}
function buildEntitiesForPlan(entities) {
    if (!entities) {
        return undefined;
    }
    const out = {};
    for (const [key, value] of Object.entries(entities)) {
        if (value == null) {
            continue;
        }
        const text = String(value).trim();
        if (text.length > 0) {
            out[key] = text;
        }
    }
    return Object.keys(out).length > 0 ? out : undefined;
}
function isPlanWorkingMemoryEmpty(memory) {
    return (memory.episodes.length === 0 &&
        memory.artifacts.length === 0 &&
        memory.observationInventory.length === 0 &&
        memory.satisfiedToolRoles.length === 0 &&
        (!memory.entities || Object.keys(memory.entities).length === 0) &&
        memory.activeTask == null);
}
function buildPlanSessionWorkingMemory(input) {
    var _a, _b;
    if (!input.goa) {
        return null;
    }
    const episodes = (_a = input.goa.recentEpisodes) !== null && _a !== void 0 ? _a : [];
    const artifacts = (_b = input.goa.sessionArtifacts) !== null && _b !== void 0 ? _b : [];
    const ledgerEntries = (0, session_goa_full_projection_util_1.mergeSessionObservationEntries)(input.goa);
    const toolRoleByName = buildToolRoleByName(input.scopedTools);
    const memory = {
        coverage: 'full_session_goa',
        storageLimits: (0, session_goa_full_projection_util_1.buildSessionGoaStorageLimits)(),
        episodes: buildEpisodesForPlan(episodes),
        artifacts: buildArtifactsForPlan(artifacts),
        observationInventory: ledgerEntries.map((entry) => {
            const toolRole = toolRoleByName.get(entry.name);
            const rowCount = (0, session_goa_full_projection_util_1.countRowsInObservationOutput)(entry.output);
            return Object.assign(Object.assign(Object.assign({ tool: entry.name, runId: entry.runId }, (toolRole && toolRole !== 'unknown' ? { toolRole } : {})), { argsSummary: (0, session_goa_full_projection_util_1.summarizeObservationArgs)(entry.args), turnId: entry.turnId, createdAt: entry.createdAt }), (rowCount != null ? { rowCount } : {}));
        }),
        satisfiedToolRoles: buildSatisfiedToolRolesForPlan({
            scopedTools: input.scopedTools,
            runOwnedObservations: input.runOwnedObservations,
        }),
        entities: buildEntitiesForPlan(input.goa.entities),
        activeTask: buildActiveTaskForPlan(input.goa.activeTask),
    };
    return isPlanWorkingMemoryEmpty(memory) ? null : memory;
}
exports.buildPlanSessionWorkingMemory = buildPlanSessionWorkingMemory;
//# sourceMappingURL=session-goa-plan-projection.util.js.map