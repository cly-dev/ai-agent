"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeTurnRoutingDecision = exports.resolveTurnPageReadIntent = void 0;
const page_context_execution_policy_util_1 = require("../../../host-bridge/page-context-execution-policy.util");
const page_context_usage_util_1 = require("../../../host-bridge/page-context-usage.util");
const turn_write_channel_types_1 = require("./turn-write-channel.types");
function defaultPageReadKindOnFallback(input) {
    if (input.llmTaskKind === 'mutation') {
        return 'none';
    }
    if (input.llmTaskKind === 'analyze' || input.llmTaskKind === 'answer') {
        return input.llmTaskKind;
    }
    const assessment = (0, page_context_usage_util_1.assessPageContextData)(input.pageContext);
    if (assessment.dataSufficiency !== 'inline') {
        return 'none';
    }
    if (input.method === 'fallback_orchestrated') {
        return 'analyze';
    }
    return 'none';
}
function normalizePageReadKindWhenApplies(input) {
    if (!input.applies) {
        return 'none';
    }
    if (input.kind !== 'none') {
        return input.kind;
    }
    const assessment = (0, page_context_usage_util_1.assessPageContextData)(input.pageContext);
    if (assessment.dataSufficiency === 'inline') {
        return 'analyze';
    }
    return 'none';
}
function resolveDraftWriteChannelOnPageRoute(input) {
    if (input.route === 'on_page_task' && input.llmWriteChannel === 'none') {
        return 'host';
    }
    return input.llmWriteChannel;
}
function resolveTurnPageReadIntent(input) {
    const fallbackKind = input.llmPageContextApplies
        ? defaultPageReadKindOnFallback({
            method: input.method,
            pageContext: input.pageContext,
            llmTaskKind: input.llmPageContextTaskKind,
        })
        : 'none';
    const draftRoute = (0, page_context_execution_policy_util_1.resolveCanonicalTurnRoute)({
        llmRoute: input.route,
        pageContextTaskKind: fallbackKind,
    });
    const applies = (0, page_context_usage_util_1.resolveEffectivePageContextApplies)({
        route: draftRoute,
        method: input.method,
        pageContextApplies: input.llmPageContextApplies,
        pageContext: input.pageContext,
    });
    const kind = normalizePageReadKindWhenApplies({
        applies,
        kind: applies ? fallbackKind : 'none',
        pageContext: input.pageContext,
    });
    return { applies, kind };
}
exports.resolveTurnPageReadIntent = resolveTurnPageReadIntent;
function suppressReadKindForWriteIntent(pageRead) {
    return { applies: pageRead.applies, kind: 'none' };
}
function finalizeTurnRoutingDecision(input) {
    const pageReadDraft = resolveTurnPageReadIntent({
        route: input.decision.route,
        method: input.decision.method,
        llmPageContextApplies: input.decision.pageContextApplies,
        llmPageContextTaskKind: input.decision.llmPageContextTaskKind,
        pageContext: input.pageContext,
    });
    const draftWriteChannel = resolveDraftWriteChannelOnPageRoute({
        route: input.decision.route,
        llmWriteChannel: input.decision.llmWriteChannel,
    });
    const pageRead = draftWriteChannel !== 'none'
        ? suppressReadKindForWriteIntent(pageReadDraft)
        : pageReadDraft;
    const route = (0, page_context_execution_policy_util_1.resolveCanonicalTurnRoute)({
        llmRoute: input.decision.route,
        pageContextTaskKind: pageRead.kind,
    });
    const llmWriteChannel = resolveDraftWriteChannelOnPageRoute({
        route,
        llmWriteChannel: draftWriteChannel,
    });
    return Object.assign(Object.assign({}, input.decision), { route, pageContextApplies: pageRead.applies, pageContextTaskKind: pageRead.kind, llmWriteChannel, hostMutationIntent: (0, turn_write_channel_types_1.hostMutationIntentFromWriteChannel)(llmWriteChannel) });
}
exports.finalizeTurnRoutingDecision = finalizeTurnRoutingDecision;
//# sourceMappingURL=turn-user-intent.util.js.map