"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planInitialSummarizeReadyOnFresh = exports.hasPageContextMaterializedObservations = exports.isPageContextOuterPlanActive = exports.shouldMaterializePageContextFromUsage = exports.resolveCanonicalTurnRoute = exports.resolvePageContextExecutionPolicy = void 0;
const page_context_usage_util_1 = require("./page-context-usage.util");
function isWriteIntentActive(input) {
    if (input.writeChannel != null) {
        return input.writeChannel !== 'none';
    }
    return Boolean(input.hostMutationIntent);
}
function resolvePageContextExecutionPolicy(input) {
    const assessment = (0, page_context_usage_util_1.assessPageContextData)(input.pageContext);
    const baseUsage = toPageContextUsage(assessment, false);
    if (input.route === 'direct_answer') {
        return { usage: baseUsage, plan: 'none' };
    }
    if (isWriteIntentActive(input)) {
        const usage = input.pageContextApplies
            ? toPageContextUsage(assessment, true)
            : baseUsage;
        return { usage, plan: 'none' };
    }
    if (!input.pageContextApplies || assessment.dataSufficiency === 'none') {
        return { usage: baseUsage, plan: 'none' };
    }
    const appliesUsage = toPageContextUsage(assessment, true);
    if ((input.pageContextTaskKind === 'analyze' ||
        input.pageContextTaskKind === 'answer') &&
        assessment.dataSufficiency === 'inline') {
        return { usage: appliesUsage, plan: 'inline_answer' };
    }
    if ((input.pageContextTaskKind === 'analyze' ||
        input.pageContextTaskKind === 'answer') &&
        assessment.dataSufficiency === 'entity_only') {
        return { usage: appliesUsage, plan: 'entity_read_detail' };
    }
    return { usage: appliesUsage, plan: 'none' };
}
exports.resolvePageContextExecutionPolicy = resolvePageContextExecutionPolicy;
function resolveCanonicalTurnRoute(input) {
    if (input.llmRoute === 'direct_answer') {
        return 'direct_answer';
    }
    if (input.pageContextTaskKind === 'analyze' ||
        input.pageContextTaskKind === 'answer') {
        return 'orchestrated_task';
    }
    return input.llmRoute;
}
exports.resolveCanonicalTurnRoute = resolveCanonicalTurnRoute;
function shouldMaterializePageContextFromUsage(usage) {
    return usage.applies && usage.dataSufficiency === 'inline';
}
exports.shouldMaterializePageContextFromUsage = shouldMaterializePageContextFromUsage;
function isPageContextOuterPlanActive(pageContextPlan) {
    return pageContextPlan !== 'none';
}
exports.isPageContextOuterPlanActive = isPageContextOuterPlanActive;
function hasPageContextMaterializedObservations(observations) {
    return observations.some((row) => (0, page_context_usage_util_1.isPageContextSourcedObservation)(row));
}
exports.hasPageContextMaterializedObservations = hasPageContextMaterializedObservations;
function planInitialSummarizeReadyOnFresh(input) {
    if (input.runOwnedObservations.length > 0) {
        return true;
    }
    if (input.planSource === 'page_context' ||
        input.planConstraints.includes('page_context_inline')) {
        return hasPageContextMaterializedObservations(input.allObservations);
    }
    return false;
}
exports.planInitialSummarizeReadyOnFresh = planInitialSummarizeReadyOnFresh;
function toPageContextUsage(assessment, applies) {
    return Object.assign(Object.assign({}, assessment), { applies });
}
//# sourceMappingURL=page-context-execution-policy.util.js.map