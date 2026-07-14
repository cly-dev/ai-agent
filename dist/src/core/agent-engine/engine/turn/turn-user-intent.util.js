"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTurnPageReadIntent = void 0;
const page_context_usage_util_1 = require("../../../host-bridge/page-context-usage.util");
const page_context_execution_policy_util_1 = require("../../../host-bridge/page-context-execution-policy.util");
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
//# sourceMappingURL=turn-user-intent.util.js.map