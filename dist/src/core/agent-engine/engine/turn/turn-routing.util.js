"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTurnRouteLlmUserPayload = exports.buildTurnRouteFallbackDraft = exports.buildChitchatRouteDraft = void 0;
const page_context_usage_util_1 = require("../../../host-bridge/page-context-usage.util");
const turn_routing_types_1 = require("./turn-routing.types");
function buildChitchatRouteDraft(input) {
    return {
        route: 'direct_answer',
        method: 'fallback_orchestrated',
        reason: input.reason,
        suggestedSkillId: null,
        pageContextApplies: false,
        llmPageContextTaskKind: 'none',
        readDeliverable: turn_routing_types_1.DEFAULT_TURN_READ_DELIVERABLE,
        draftWriteChannel: 'none',
    };
}
exports.buildChitchatRouteDraft = buildChitchatRouteDraft;
function buildTurnRouteFallbackDraft(input) {
    return {
        route: 'orchestrated_task',
        method: 'fallback_orchestrated',
        reason: input.reason,
        suggestedSkillId: null,
        pageContextApplies: false,
        llmPageContextTaskKind: 'none',
        readDeliverable: turn_routing_types_1.DEFAULT_TURN_READ_DELIVERABLE,
        draftWriteChannel: 'none',
    };
}
exports.buildTurnRouteFallbackDraft = buildTurnRouteFallbackDraft;
function buildTurnRouteLlmUserPayload(input) {
    const pageContextHint = (0, page_context_usage_util_1.buildPageContextRouteHint)(input.pageContext);
    return JSON.stringify({
        userMessage: input.userMessage.trim(),
        pageContext: input.pageContext,
        pageContextHint,
        intentRecallMatches: input.intentRecallMatches,
        availableSkills: input.availableSkills,
        availableHostTools: input.availableHostTools,
        pageHostSkillCandidate: input.pageHostSkillCandidate,
        requestedSkill: input.requestedSkill,
        requestedSkillExecutionChannels: input.requestedSkillExecutionChannels,
    }, null, 2);
}
exports.buildTurnRouteLlmUserPayload = buildTurnRouteLlmUserPayload;
//# sourceMappingURL=turn-routing.util.js.map