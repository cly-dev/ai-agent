"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveObservationForSummarize = exports.turnRespondRequestToObservation = exports.guidanceHintForTurnKind = exports.isTerminalTurnRespondPending = exports.hasPendingRespond = exports.pendingRespondFromTurn = exports.pendingRespondFromObservation = exports.CLARIFICATION_REQUEST_OBSERVATION_NAME = void 0;
const intent_scope_util_1 = require("../../../intent/intent-scope.util");
const workflow_init_skip_util_1 = require("../../../workflow/workflow-init-skip.util");
exports.CLARIFICATION_REQUEST_OBSERVATION_NAME = 'clarification_request';
function pendingRespondFromObservation(observation) {
    return { mode: 'observation', observation };
}
exports.pendingRespondFromObservation = pendingRespondFromObservation;
function pendingRespondFromTurn(request) {
    return { mode: 'turn', request };
}
exports.pendingRespondFromTurn = pendingRespondFromTurn;
function hasPendingRespond(pending) {
    return pending != null;
}
exports.hasPendingRespond = hasPendingRespond;
function isTerminalTurnRespondPending(pending) {
    return (pending === null || pending === void 0 ? void 0 : pending.mode) === 'turn';
}
exports.isTerminalTurnRespondPending = isTerminalTurnRespondPending;
function guidanceHintForTurnKind(kind) {
    switch (kind) {
        case 'message_unclear':
            return (0, intent_scope_util_1.buildIntentClarificationGuidance)('');
        case 'unsupported_scope':
        case 'intent_recall_failed':
            return (0, intent_scope_util_1.buildUnsupportedIntentGuidance)();
        default:
            return undefined;
    }
}
exports.guidanceHintForTurnKind = guidanceHintForTurnKind;
function turnRespondRequestToObservation(request) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    if (request.kind === 'clarification') {
        return {
            name: exports.CLARIFICATION_REQUEST_OBSERVATION_NAME,
            output: {
                userMessage: request.userMessage,
                missingFields: (_b = (_a = request.payload) === null || _a === void 0 ? void 0 : _a.missingFields) !== null && _b !== void 0 ? _b : [],
                planStepId: (_c = request.payload) === null || _c === void 0 ? void 0 : _c.planStepId,
                toolRole: (_d = request.payload) === null || _d === void 0 ? void 0 : _d.toolRole,
                readinessReason: (_e = request.payload) === null || _e === void 0 ? void 0 : _e.readinessReason,
            },
            quality: 'high',
        };
    }
    if (request.kind === 'smalltalk') {
        return {
            name: 'smalltalk',
            output: { userMessage: request.userMessage },
            quality: 'medium',
        };
    }
    if (request.kind === 'off_domain') {
        return {
            name: 'off_domain',
            output: {
                userMessage: request.userMessage,
                routingReason: (_g = (_f = request.payload) === null || _f === void 0 ? void 0 : _f.routingReason) !== null && _g !== void 0 ? _g : null,
            },
            quality: 'medium',
        };
    }
    if (request.kind === 'skill_intent_mismatch') {
        return {
            name: 'skill_intent_mismatch',
            output: {
                userMessage: request.userMessage,
                mismatchCode: (_j = (_h = request.payload) === null || _h === void 0 ? void 0 : _h.mismatchCode) !== null && _j !== void 0 ? _j : null,
                requestedSkillId: (_l = (_k = request.payload) === null || _k === void 0 ? void 0 : _k.requestedSkillId) !== null && _l !== void 0 ? _l : null,
                requestedSkillName: (_o = (_m = request.payload) === null || _m === void 0 ? void 0 : _m.requestedSkillName) !== null && _o !== void 0 ? _o : null,
                routingReason: (_q = (_p = request.payload) === null || _p === void 0 ? void 0 : _p.routingReason) !== null && _q !== void 0 ? _q : null,
            },
            quality: 'high',
        };
    }
    if (request.kind === 'direct_reply') {
        return {
            name: 'direct_reply',
            output: (_r = request.payload) !== null && _r !== void 0 ? _r : { userMessage: request.userMessage },
            quality: 'medium',
        };
    }
    const guidanceHint = guidanceHintForTurnKind(request.kind);
    const workflowInitGuidance = (0, workflow_init_skip_util_1.guidanceForWorkflowInitSkippedReadinessReason)((_s = request.payload) === null || _s === void 0 ? void 0 : _s.readinessReason);
    return {
        name: 'direct_user',
        output: workflowInitGuidance
            ? { userMessage: request.userMessage, guidanceHint: workflowInitGuidance }
            : guidanceHint
                ? { userMessage: request.userMessage, guidanceHint }
                : { userMessage: request.userMessage },
        quality: 'medium',
    };
}
exports.turnRespondRequestToObservation = turnRespondRequestToObservation;
function resolveObservationForSummarize(pending) {
    if (!pending) {
        return null;
    }
    if (pending.mode === 'observation') {
        return pending.observation;
    }
    return turnRespondRequestToObservation(pending.request);
}
exports.resolveObservationForSummarize = resolveObservationForSummarize;
//# sourceMappingURL=turn-respond.util.js.map