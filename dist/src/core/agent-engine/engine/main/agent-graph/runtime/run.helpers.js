"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentGraphRunHelpers = exports.resolveFallbackReply = exports.loadScopedHostTools = exports.sanitizeFinalOutput = exports.publishMutationGateBlockedDraft = exports.resolveAssistantOutputFromArtifact = exports.graphFinalOutputFromArtifact = exports.tryParseJsonObject = exports.normalizeJsonLike = exports.updateRun = exports.bindRunContextHelpers = exports.createIsIntentMatched = exports.createBuildTurnRespondState = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const host_bridge_1 = require("../../../../../host-bridge");
const host_tool_resolve_debug_util_1 = require("../../../../../host-bridge/host-tool-resolve-debug.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const agent_run_audit_util_1 = require("../../run/agent-run-audit.util");
const message_blocks_util_1 = require("../../../message/message-blocks.util");
const graph_tool_observations_util_1 = require("../../../graph-tool-observations.util");
const turn_respond_util_1 = require("../../../turn/turn-respond.util");
const skill_intent_alignment_util_1 = require("../../../turn/skill-intent-alignment.util");
const turn_execution_contract_util_1 = require("../../../turn/turn-execution-contract.util");
function createBuildTurnRespondState() {
    return (state, steps, request) => (Object.assign(Object.assign({}, state), { steps, pendingRespond: (0, turn_respond_util_1.pendingRespondFromTurn)(request), scopedTools: [], scopedLangChainTools: [], scopedToolBundle: null, scopedAllowedToolIds: [] }));
}
exports.createBuildTurnRespondState = createBuildTurnRespondState;
function createIsIntentMatched(_requestedSkillCtx) {
    return (state) => {
        var _a, _b, _c;
        const contract = state.turnExecutionContract;
        if (contract) {
            if ((0, skill_intent_alignment_util_1.shouldEnforceRequestedSkillFromContract)({
                scopedToolsSource: contract.plan.scopedToolsSource,
            })) {
                return true;
            }
            if (contract.plan.enabled &&
                (0, turn_execution_contract_util_1.turnRouteFromContract)(contract) !== 'direct_answer') {
                return true;
            }
        }
        if (((_c = (_b = (_a = state.taskPlan) === null || _a === void 0 ? void 0 : _a.steps) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0) > 0) {
            return true;
        }
        if ((0, graph_tool_observations_util_1.allToolObservations)(state).length > 0) {
            return true;
        }
        for (let i = state.steps.length - 1; i >= 0; i -= 1) {
            const step = state.steps[i];
            if (step.type !== 'intent') {
                continue;
            }
            const output = step.output;
            if (output == null || typeof output !== 'object' || Array.isArray(output)) {
                continue;
            }
            const row = output;
            if (row.intentClear === false) {
                continue;
            }
            const matched = row.matchedCategoryIds;
            if (Array.isArray(matched) && matched.length > 0) {
                return true;
            }
        }
        return false;
    };
}
exports.createIsIntentMatched = createIsIntentMatched;
function bindRunContextHelpers(helpers, ctx) {
    return Object.assign(Object.assign({}, helpers), { isIntentMatched: createIsIntentMatched(ctx.requestedSkillCtx) });
}
exports.bindRunContextHelpers = bindRunContextHelpers;
const RUN_STEP_WRITE_COALESCE_MS = 2000;
const runStepWriteCoalescers = new Map();
function shouldSkipRunStepWrite(runId, currentStep, status) {
    if (status !== client_1.AgentRunStatus.running) {
        return false;
    }
    const prev = runStepWriteCoalescers.get(runId);
    if (!prev) {
        return false;
    }
    return (prev.lastStatus === status &&
        prev.lastStep === currentStep &&
        Date.now() - prev.lastWriteAt < RUN_STEP_WRITE_COALESCE_MS);
}
async function updateRun(deps, runId, steps, status) {
    const persistedSteps = (0, agent_run_audit_util_1.stepsForRunPersistence)(steps);
    const currentStep = (0, agent_run_steps_util_1.maxRunStepNumber)(persistedSteps);
    if (shouldSkipRunStepWrite(runId, currentStep, status)) {
        return;
    }
    await deps.prisma.agentRun.update({
        where: { id: runId },
        data: {
            steps: persistedSteps,
            currentStep,
            status,
        },
    });
    if (status === client_1.AgentRunStatus.running) {
        runStepWriteCoalescers.set(runId, {
            lastWriteAt: Date.now(),
            lastStep: currentStep,
            lastStatus: status,
        });
        return;
    }
    runStepWriteCoalescers.delete(runId);
}
exports.updateRun = updateRun;
function normalizeJsonLike(value) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }
    return String(value);
}
exports.normalizeJsonLike = normalizeJsonLike;
function tryParseJsonObject(value) {
    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed;
        }
        return null;
    }
    catch (_a) {
        return null;
    }
}
exports.tryParseJsonObject = tryParseJsonObject;
function graphFinalOutputFromArtifact(deps, sessionId, runId, continuePlan, previousFinalOutput) {
    var _a;
    if (continuePlan) {
        return previousFinalOutput;
    }
    return ((_a = deps.assistantArtifact.peekSerialized(sessionId, runId)) !== null && _a !== void 0 ? _a : previousFinalOutput);
}
exports.graphFinalOutputFromArtifact = graphFinalOutputFromArtifact;
function resolveAssistantOutputFromArtifact(deps, sessionId, runId, fallbackSerialized) {
    return deps.assistantArtifact.formatOutput(sessionId, runId, fallbackSerialized);
}
exports.resolveAssistantOutputFromArtifact = resolveAssistantOutputFromArtifact;
function publishMutationGateBlockedDraft(deps, sessionId, runId, turnId, message) {
    var _a;
    const trimmed = message.trim();
    if (!trimmed) {
        return;
    }
    const artifactTurnId = (_a = deps.assistantArtifact.peekTurnId(sessionId, runId)) !== null && _a !== void 0 ? _a : turnId;
    const blocks = deps.sse.publishAssistantBlocks(sessionId, runId, [(0, message_blocks_util_1.textBlock)(trimmed, 'markdown')], { turnId: artifactTurnId, phase: 'draft' });
    if (blocks.length === 0) {
        deps.sse.commitAssistantArtifact(sessionId, runId, [(0, message_blocks_util_1.textBlock)(trimmed, 'markdown')], 'draft');
    }
}
exports.publishMutationGateBlockedDraft = publishMutationGateBlockedDraft;
function sanitizeFinalOutput(value) {
    return (0, message_blocks_util_1.sanitizeStoredFinalOutput)(value);
}
exports.sanitizeFinalOutput = sanitizeFinalOutput;
async function loadScopedHostTools(deps, input, pageContext, skillId) {
    var _a;
    const pageScope = (_a = (0, host_bridge_1.resolveHostToolPageScope)(pageContext)) !== null && _a !== void 0 ? _a : '';
    const cached = deps.runScopeCache.getHostToolsForRun(input.runId, pageScope, skillId);
    if (cached) {
        (0, host_tool_resolve_debug_util_1.logHostToolResolve)('loadScopedHostTools', {
            runId: input.runId,
            sessionId: input.sessionId,
            agentId: input.agentId,
            skillId: skillId !== null && skillId !== void 0 ? skillId : null,
            pageScope,
            cacheLayer: 'L0_run_scope',
            cacheHit: true,
            toolCount: cached.length,
            toolNames: cached.map((tool) => tool.name),
        });
        return {
            scopedHostTools: cached,
            scopedHostLangChainTools: (0, host_bridge_1.buildHostLangChainTools)(cached).tools,
        };
    }
    const scopedHostTools = await deps.hostToolService.resolveLlmHostToolsForDecision({
        appClientId: input.appClientId,
        agentId: input.agentId,
        skillId: skillId !== null && skillId !== void 0 ? skillId : null,
        pageContext,
        runId: input.runId,
        sessionId: input.sessionId,
    });
    deps.runScopeCache.setHostToolsForRun(input.runId, pageScope, skillId, scopedHostTools);
    (0, host_tool_resolve_debug_util_1.logHostToolResolve)('loadScopedHostTools', {
        runId: input.runId,
        sessionId: input.sessionId,
        agentId: input.agentId,
        skillId: skillId !== null && skillId !== void 0 ? skillId : null,
        pageScope,
        cacheLayer: 'L0_run_scope',
        cacheHit: false,
        toolCount: scopedHostTools.length,
        toolNames: scopedHostTools.map((tool) => tool.name),
    });
    return {
        scopedHostTools,
        scopedHostLangChainTools: (0, host_bridge_1.buildHostLangChainTools)(scopedHostTools).tools,
    };
}
exports.loadScopedHostTools = loadScopedHostTools;
function resolveFallbackReply(config) {
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
exports.resolveFallbackReply = resolveFallbackReply;
function createAgentGraphRunHelpers(deps) {
    return {
        updateRun: (runId, steps, status) => updateRun(deps, runId, steps, status),
        normalizeJsonLike,
        graphFinalOutputFromArtifact: (sessionId, runId, continuePlan, previousFinalOutput) => graphFinalOutputFromArtifact(deps, sessionId, runId, continuePlan, previousFinalOutput),
        resolveAssistantOutputFromArtifact: (sessionId, runId, fallbackSerialized) => resolveAssistantOutputFromArtifact(deps, sessionId, runId, fallbackSerialized),
        publishMutationGateBlockedDraft: (sessionId, runId, turnId, message) => publishMutationGateBlockedDraft(deps, sessionId, runId, turnId, message),
        loadScopedHostTools: (input, pageContext, skillId) => loadScopedHostTools(deps, input, pageContext, skillId),
        sanitizeFinalOutput,
        tryParseJsonObject,
        resolveFallbackReply,
        buildTurnRespondState: createBuildTurnRespondState(),
        isIntentMatched: createIsIntentMatched(null),
    };
}
exports.createAgentGraphRunHelpers = createAgentGraphRunHelpers;
//# sourceMappingURL=run.helpers.js.map