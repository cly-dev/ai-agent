"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardTaskRouteDraftForIntent = void 0;
const ROUTE_GUARD_SUFFIX = ' [route_guard:task_not_direct_answer]';
function hasOrchestrationOverrideSignal(draft) {
    if (draft.draftWriteChannel !== 'none') {
        return true;
    }
    if (draft.suggestedSkillId != null) {
        return true;
    }
    if (draft.pageContextApplies &&
        (draft.llmPageContextTaskKind === 'analyze' ||
            draft.llmPageContextTaskKind === 'mutation')) {
        return true;
    }
    return false;
}
function guardTaskRouteDraftForIntent(input) {
    if (input.intentKind === 'smalltalk') {
        return input.routeDraft;
    }
    if (input.routeDraft.route !== 'direct_answer') {
        return input.routeDraft;
    }
    if (input.routeDraft.pageContextApplies &&
        input.routeDraft.llmPageContextTaskKind === 'answer') {
        return input.routeDraft;
    }
    if (!hasOrchestrationOverrideSignal(input.routeDraft)) {
        return input.routeDraft;
    }
    return Object.assign(Object.assign({}, input.routeDraft), { route: 'orchestrated_task', reason: input.routeDraft.reason.includes(ROUTE_GUARD_SUFFIX)
            ? input.routeDraft.reason
            : `${input.routeDraft.reason}${ROUTE_GUARD_SUFFIX}` });
}
exports.guardTaskRouteDraftForIntent = guardTaskRouteDraftForIntent;
//# sourceMappingURL=turn-route-guard.util.js.map