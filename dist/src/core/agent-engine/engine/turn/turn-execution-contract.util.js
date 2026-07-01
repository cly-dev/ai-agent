"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storedPlanCompatibleWithContract = exports.resolveTurnExecutionContract = exports.buildRestrictiveTurnExecutionContract = exports.buildWriteConfirmResumeContract = exports.buildTurnExecutionContract = exports.pageContextEntityIdFromGraphState = void 0;
const page_context_usage_util_1 = require("../../../host-bridge/page-context-usage.util");
const page_context_execution_policy_util_1 = require("../../../host-bridge/page-context-execution-policy.util");
const host_tool_turn_policy_util_1 = require("./host-tool-turn-policy.util");
const skill_capability_profile_util_1 = require("./skill-capability-profile.util");
const skill_intent_alignment_util_1 = require("./skill-intent-alignment.util");
function resolveScopedToolsSource(input) {
    return input.skillSelect === 'explicit' &&
        input.skillAlignment.status === 'aligned'
        ? 'explicit_skill'
        : 'intent';
}
function pageHostMatchesRouting(routing, pageHostCandidateId) {
    if (!pageHostCandidateId) {
        return false;
    }
    const suggested = routing.suggestedSkillId;
    if (suggested != null && suggested !== pageHostCandidateId) {
        return false;
    }
    return true;
}
function emptyPageContextUsage() {
    return Object.assign(Object.assign({}, (0, page_context_usage_util_1.assessPageContextData)(null)), { applies: false });
}
function basePlanPolicy(overrides) {
    return Object.assign({ scopedToolsSource: 'intent', skillSelect: 'llm', explicitSkillId: null, pageHostSkillId: null, allowHostToolSteps: false, allowHostToolAutoDispatch: false, allowHostToolLlmDispatch: false, allowSessionResume: true, abandonActiveTaskOnFreshPlan: true, pageContextUsage: emptyPageContextUsage(), pageContextPlan: 'none' }, overrides);
}
function resolvePlanSkillSelect(input) {
    if (input.requestedSkillId != null) {
        return {
            skillSelect: 'explicit',
            explicitSkillId: input.requestedSkillId,
            pageHostSkillId: null,
        };
    }
    const onPage = input.routing.route === 'on_page_task';
    if (onPage &&
        pageHostMatchesRouting(input.routing, input.pageHostCandidateId)) {
        return {
            skillSelect: 'page_host',
            explicitSkillId: null,
            pageHostSkillId: input.pageHostCandidateId,
        };
    }
    return { skillSelect: 'llm', explicitSkillId: null, pageHostSkillId: null };
}
function pageContextEntityIdFromGraphState(state) {
    var _a, _b;
    return (0, page_context_usage_util_1.resolvePageContextEntityIdForPlanSatisfaction)({
        pageContextUsage: (_a = state.turnExecutionContract) === null || _a === void 0 ? void 0 : _a.plan.pageContextUsage,
        pageContext: (_b = state.pageContext) !== null && _b !== void 0 ? _b : null,
    });
}
exports.pageContextEntityIdFromGraphState = pageContextEntityIdFromGraphState;
function buildTurnExecutionContract(input) {
    var _a;
    const { routing } = input;
    const skillProfile = input.requestedSkill != null
        ? (0, skill_capability_profile_util_1.buildSkillCapabilityProfile)({
            skillId: input.requestedSkill.id,
            skillName: input.requestedSkill.name,
            skillToolIds: input.requestedSkill.skillToolIds,
            hostToolIds: input.requestedSkill.hostToolIds,
            runnableKind: input.requestedSkill.runnableKind,
            channels: input.requestedSkill.executionChannels,
        })
        : null;
    if (!input.toolsEnabled) {
        return {
            routing,
            terminalRespond: null,
            skillAlignment: (0, skill_intent_alignment_util_1.emptySkillIntentAlignment)(),
            plan: basePlanPolicy({
                enabled: false,
                allowSessionResume: false,
                abandonActiveTaskOnFreshPlan: false,
            }),
        };
    }
    if (routing.route === 'direct_answer') {
        return {
            routing,
            terminalRespond: null,
            skillAlignment: (0, skill_intent_alignment_util_1.emptySkillIntentAlignment)(),
            plan: basePlanPolicy({
                enabled: true,
                scopedToolsSource: 'intent',
                skillSelect: 'llm',
                allowHostToolSteps: false,
                allowHostToolAutoDispatch: false,
                allowHostToolLlmDispatch: false,
                allowSessionResume: false,
                abandonActiveTaskOnFreshPlan: true,
                pageContextPlan: 'none',
            }),
        };
    }
    const draftSkillSelect = resolvePlanSkillSelect(input);
    const pageContextPolicy = (0, page_context_execution_policy_util_1.resolvePageContextExecutionPolicy)({
        route: routing.route,
        pageContextApplies: routing.pageContextApplies,
        pageContextTaskKind: routing.pageContextTaskKind,
        pageContext: input.pageContext,
        writeChannel: input.effectiveWriteChannel,
    });
    const pageContextPlan = pageContextPolicy.plan;
    const turnIntent = (0, skill_intent_alignment_util_1.deriveTurnUserIntent)({
        routing,
        pageContextPlan,
        writeChannel: input.effectiveWriteChannel,
    });
    const alignment = (0, skill_intent_alignment_util_1.resolveSkillIntentAlignment)({
        intent: turnIntent,
        routing,
        userMessage: input.userMessage,
        requestedSkillId: input.requestedSkillId,
        skillProfile,
        skillConfig: (_a = input.requestedSkill) === null || _a === void 0 ? void 0 : _a.config,
    });
    const skillAlignment = (0, skill_intent_alignment_util_1.toSkillIntentAlignmentSnapshot)(alignment, input.requestedSkillId);
    if (alignment.status === 'clarify') {
        return {
            routing,
            terminalRespond: alignment.respond,
            skillAlignment,
            plan: basePlanPolicy({
                enabled: false,
                allowSessionResume: false,
                abandonActiveTaskOnFreshPlan: false,
            }),
        };
    }
    const skillSelect = alignment.status === 'intent_first'
        ? {
            skillSelect: alignment.effectiveSkillSelect,
            explicitSkillId: alignment.effectiveExplicitSkillId,
            pageHostSkillId: alignment.effectivePageHostSkillId,
        }
        : draftSkillSelect;
    const hostToolPolicy = (0, host_tool_turn_policy_util_1.resolveHostToolTurnPolicy)({
        route: routing.route,
        pageContextPlan,
        writeChannel: input.effectiveWriteChannel,
    });
    const scopedToolsSource = resolveScopedToolsSource({
        skillSelect: skillSelect.skillSelect,
        skillAlignment,
    });
    return {
        routing,
        terminalRespond: null,
        skillAlignment,
        plan: basePlanPolicy(Object.assign(Object.assign({ enabled: true, scopedToolsSource }, skillSelect), { allowHostToolSteps: hostToolPolicy.allowHostToolSteps, allowHostToolAutoDispatch: hostToolPolicy.allowHostToolAutoDispatch, allowHostToolLlmDispatch: hostToolPolicy.allowHostToolLlmDispatch, allowSessionResume: true, abandonActiveTaskOnFreshPlan: true, pageContextUsage: pageContextPolicy.usage, pageContextPlan })),
    };
}
exports.buildTurnExecutionContract = buildTurnExecutionContract;
function buildWriteConfirmResumeContract(reason, writeChannel = 'http') {
    const hostWrite = writeChannel === 'host';
    return {
        routing: {
            route: 'orchestrated_task',
            method: 'fallback_orchestrated',
            reason,
            suggestedSkillId: null,
            pageContextApplies: false,
            pageContextTaskKind: 'none',
            llmPageContextTaskKind: 'none',
            llmWriteChannel: writeChannel,
            hostMutationIntent: hostWrite,
        },
        terminalRespond: null,
        skillAlignment: (0, skill_intent_alignment_util_1.emptySkillIntentAlignment)(),
        plan: basePlanPolicy({
            enabled: true,
            allowHostToolSteps: hostWrite,
            allowHostToolAutoDispatch: hostWrite,
            allowHostToolLlmDispatch: hostWrite,
            allowSessionResume: true,
            abandonActiveTaskOnFreshPlan: false,
        }),
    };
}
exports.buildWriteConfirmResumeContract = buildWriteConfirmResumeContract;
function buildRestrictiveTurnExecutionContract(reason) {
    return {
        routing: {
            route: 'orchestrated_task',
            method: 'fallback_orchestrated',
            reason,
            suggestedSkillId: null,
            pageContextApplies: false,
            pageContextTaskKind: 'none',
            llmPageContextTaskKind: 'none',
            llmWriteChannel: 'none',
            hostMutationIntent: false,
        },
        terminalRespond: null,
        skillAlignment: (0, skill_intent_alignment_util_1.emptySkillIntentAlignment)(),
        plan: basePlanPolicy({
            enabled: true,
            allowHostToolSteps: false,
            allowHostToolAutoDispatch: false,
            allowHostToolLlmDispatch: false,
            allowSessionResume: true,
            abandonActiveTaskOnFreshPlan: true,
        }),
    };
}
exports.buildRestrictiveTurnExecutionContract = buildRestrictiveTurnExecutionContract;
function resolveTurnExecutionContract(state, reason = 'missing_turn_execution_contract', log) {
    var _a, _b;
    if (state.turnExecutionContract) {
        const contract = state.turnExecutionContract;
        const skillAlignment = (_a = contract.skillAlignment) !== null && _a !== void 0 ? _a : (0, skill_intent_alignment_util_1.emptySkillIntentAlignment)();
        const scopedToolsSource = (_b = contract.plan.scopedToolsSource) !== null && _b !== void 0 ? _b : (contract.plan.skillSelect === 'explicit' &&
            skillAlignment.status === 'aligned'
            ? 'explicit_skill'
            : 'intent');
        if (contract.skillAlignment && contract.plan.scopedToolsSource) {
            return contract;
        }
        return Object.assign(Object.assign({}, contract), { skillAlignment, plan: Object.assign(Object.assign({}, contract.plan), { scopedToolsSource }) });
    }
    log === null || log === void 0 ? void 0 : log.warn(`turn execution contract missing; restrictive fallback reason=${reason}`);
    return buildRestrictiveTurnExecutionContract(reason);
}
exports.resolveTurnExecutionContract = resolveTurnExecutionContract;
function storedPlanCompatibleWithContract(contract, stored) {
    var _a, _b;
    if (!contract.plan.allowSessionResume) {
        return false;
    }
    if (!contract.plan.allowHostToolSteps) {
        const method = (_a = stored.outerSkillSelectMethod) === null || _a === void 0 ? void 0 : _a.trim();
        if (method === 'page_host_unique') {
            return false;
        }
        const hasHostToolStep = stored.steps.some((step) => step.kind === 'host_tool');
        if (hasHostToolStep) {
            return false;
        }
        for (const frame of (_b = stored.frames) !== null && _b !== void 0 ? _b : []) {
            if (frame.steps.some((step) => step.kind === 'host_tool')) {
                return false;
            }
        }
    }
    return true;
}
exports.storedPlanCompatibleWithContract = storedPlanCompatibleWithContract;
//# sourceMappingURL=turn-execution-contract.util.js.map