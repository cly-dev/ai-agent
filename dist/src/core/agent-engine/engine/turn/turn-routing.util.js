"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTurnRouteLlmUserPayload = exports.buildTurnRouteFallbackDecision = exports.buildChitchatRoutingDecision = exports.finalizeTurnRoutingDecision = void 0;
const page_context_usage_util_1 = require("../../../host-bridge/page-context-usage.util");
var turn_user_intent_util_1 = require("./turn-user-intent.util");
Object.defineProperty(exports, "finalizeTurnRoutingDecision", { enumerable: true, get: function () { return turn_user_intent_util_1.finalizeTurnRoutingDecision; } });
function buildChitchatRoutingDecision(input) {
    return {
        route: 'direct_answer',
        method: 'fallback_orchestrated',
        reason: input.reason,
        suggestedSkillId: null,
        pageContextApplies: false,
        pageContextTaskKind: 'none',
        llmPageContextTaskKind: 'none',
        llmWriteChannel: 'none',
        hostMutationIntent: false,
    };
}
exports.buildChitchatRoutingDecision = buildChitchatRoutingDecision;
function buildTurnRouteFallbackDecision(input) {
    return {
        route: 'orchestrated_task',
        method: 'fallback_orchestrated',
        reason: input.reason,
        suggestedSkillId: null,
        pageContextApplies: false,
        pageContextTaskKind: 'none',
        llmPageContextTaskKind: 'none',
        llmWriteChannel: 'none',
        hostMutationIntent: false,
    };
}
exports.buildTurnRouteFallbackDecision = buildTurnRouteFallbackDecision;
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