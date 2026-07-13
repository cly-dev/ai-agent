"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mismatchCodeForUnsupportedTaskKind = exports.skillSupportsTaskKind = exports.reconcileTurnIntent = exports.routeFromTaskKind = exports.writeChannelFromTaskKind = void 0;
const page_context_execution_policy_util_1 = require("../../../host-bridge/page-context-execution-policy.util");
const turn_user_intent_util_1 = require("./turn-user-intent.util");
const SKILL_CHANNEL_ANCHOR_SUFFIX = ' [skill_channel_anchor:http_mutation]';
function writeChannelFromTaskKind(taskKind) {
    switch (taskKind) {
        case 'http_mutation':
            return 'http';
        case 'host_push':
            return 'host';
        default:
            return 'none';
    }
}
exports.writeChannelFromTaskKind = writeChannelFromTaskKind;
function normalizeRouteDraftWithPageContext(input) {
    const pageReadDraft = (0, turn_user_intent_util_1.resolveTurnPageReadIntent)({
        route: input.draft.route,
        method: input.draft.method,
        llmPageContextApplies: input.draft.pageContextApplies,
        llmPageContextTaskKind: input.draft.llmPageContextTaskKind,
        pageContext: input.pageContext,
    });
    const pageRead = input.draft.draftWriteChannel !== 'none'
        ? { applies: pageReadDraft.applies, kind: 'none' }
        : pageReadDraft;
    const route = (0, page_context_execution_policy_util_1.resolveCanonicalTurnRoute)({
        llmRoute: input.draft.route,
        pageContextTaskKind: pageRead.kind,
    });
    return Object.assign(Object.assign({}, input.draft), { route, pageContextApplies: pageRead.applies, pageContextTaskKind: pageRead.kind });
}
function routeFromTaskKind(taskKind) {
    switch (taskKind) {
        case 'direct_answer':
            return 'direct_answer';
        case 'host_push':
            return 'on_page_task';
        default:
            return 'orchestrated_task';
    }
}
exports.routeFromTaskKind = routeFromTaskKind;
function shouldAnchorHostDraftToHttp(channels) {
    if (!channels.httpMutation) {
        return false;
    }
    if (!channels.hostPush) {
        return true;
    }
    return channels.primaryWriteChannel === 'http';
}
function applySkillChannelDraftAnchor(input) {
    let normalized = input.normalized;
    let draftWriteChannel = normalized.draftWriteChannel;
    let skillChannelAnchored = false;
    const channels = input.skillChannels;
    if (channels &&
        draftWriteChannel === 'host' &&
        shouldAnchorHostDraftToHttp(channels)) {
        draftWriteChannel = 'http';
        skillChannelAnchored = true;
        const reason = normalized.reason.includes(SKILL_CHANNEL_ANCHOR_SUFFIX)
            ? normalized.reason
            : `${normalized.reason}${SKILL_CHANNEL_ANCHOR_SUFFIX}`;
        normalized = Object.assign(Object.assign({}, normalized), { route: normalized.route === 'on_page_task'
                ? 'orchestrated_task'
                : normalized.route, draftWriteChannel: 'http', reason });
    }
    return { normalized, draftWriteChannel, skillChannelAnchored };
}
function resolvePageReadTaskKind(input) {
    if (input.normalized.pageContextApplies &&
        (input.normalized.pageContextTaskKind === 'analyze' ||
            input.normalized.pageContextTaskKind === 'answer')) {
        return 'page_read';
    }
    return null;
}
function resolveHttpDraftTaskKindForDualCapabilitySkill(input) {
    if (input.normalized.llmPageContextTaskKind === 'analyze' ||
        input.normalized.llmPageContextTaskKind === 'answer') {
        const pageRead = resolvePageReadTaskKind(input);
        if (pageRead) {
            return pageRead;
        }
        return 'orchestrated_read';
    }
    return 'http_mutation';
}
function resolveExplicitSkillTaskKind(input) {
    const { draftWriteChannel, skillChannels } = input;
    if (draftWriteChannel === 'http') {
        if (skillChannels.httpRead && !skillChannels.httpMutation) {
            return 'orchestrated_read';
        }
        if (skillChannels.httpMutation && !skillChannels.httpRead) {
            return 'http_mutation';
        }
        if (skillChannels.httpRead && skillChannels.httpMutation) {
            return resolveHttpDraftTaskKindForDualCapabilitySkill(input);
        }
        return 'http_mutation';
    }
    if (draftWriteChannel === 'host') {
        if (skillChannels.hostPush) {
            return 'host_push';
        }
        if (skillChannels.httpMutation) {
            return 'http_mutation';
        }
        return 'host_push';
    }
    const pageRead = resolvePageReadTaskKind(input);
    if (pageRead) {
        return pageRead;
    }
    if (input.normalized.route === 'orchestrated_task') {
        return 'orchestrated_read';
    }
    if (input.normalized.route === 'on_page_task') {
        return skillChannels.hostPush ? 'host_push' : 'orchestrated_read';
    }
    return 'orchestrated_read';
}
function resolveTurnTaskKind(input) {
    if (input.normalized.route === 'direct_answer') {
        return 'direct_answer';
    }
    if (input.explicitSkill && input.skillChannels) {
        return resolveExplicitSkillTaskKind({
            normalized: input.normalized,
            pageContext: input.pageContext,
            draftWriteChannel: input.draftWriteChannel,
            skillChannels: input.skillChannels,
        });
    }
    const pageRead = resolvePageReadTaskKind(input);
    if (pageRead) {
        return pageRead;
    }
    if (input.normalized.route === 'orchestrated_task') {
        return 'orchestrated_read';
    }
    if (input.normalized.route === 'on_page_task') {
        return 'host_push';
    }
    if (input.draftWriteChannel === 'http') {
        return 'http_mutation';
    }
    if (input.draftWriteChannel === 'host') {
        return 'host_push';
    }
    return 'orchestrated_read';
}
function buildRouteMetaFromTaskKind(normalized, taskKind) {
    let pageContextTaskKind = normalized.pageContextTaskKind;
    if (taskKind === 'page_read') {
        if (pageContextTaskKind === 'none' &&
            (normalized.llmPageContextTaskKind === 'analyze' ||
                normalized.llmPageContextTaskKind === 'answer')) {
            pageContextTaskKind = normalized.llmPageContextTaskKind;
        }
    }
    else if (writeChannelFromTaskKind(taskKind) !== 'none') {
        pageContextTaskKind = 'none';
    }
    return {
        method: normalized.method,
        reason: normalized.reason,
        suggestedSkillId: normalized.suggestedSkillId,
        pageContextApplies: normalized.pageContextApplies,
        pageContextTaskKind,
        llmPageContextTaskKind: normalized.llmPageContextTaskKind,
        readDeliverable: normalized.readDeliverable,
    };
}
function reconcileTurnIntent(input) {
    const normalized = normalizeRouteDraftWithPageContext({
        draft: input.routeDraft,
        pageContext: input.pageContext,
    });
    const { normalized: anchored, draftWriteChannel, skillChannelAnchored, } = applySkillChannelDraftAnchor({
        normalized,
        skillChannels: input.skillChannels,
    });
    const taskKind = resolveTurnTaskKind({
        normalized: anchored,
        pageContext: input.pageContext,
        draftWriteChannel,
        skillChannels: input.skillChannels,
        explicitSkill: input.explicitSkill,
    });
    const routeMeta = buildRouteMetaFromTaskKind(anchored, taskKind);
    return {
        taskKind,
        routeMeta,
        skillChannelAnchored,
    };
}
exports.reconcileTurnIntent = reconcileTurnIntent;
function skillSupportsTaskKind(channels, taskKind) {
    switch (taskKind) {
        case 'direct_answer':
        case 'page_read':
            return true;
        case 'orchestrated_read':
            return channels.httpRead;
        case 'http_mutation':
            return channels.httpMutation;
        case 'host_push':
            return channels.hostPush;
        default:
            return false;
    }
}
exports.skillSupportsTaskKind = skillSupportsTaskKind;
function mismatchCodeForUnsupportedTaskKind(input) {
    const channels = input.profile.channels;
    switch (input.taskKind) {
        case 'orchestrated_read':
            return 'orchestrated_http_vs_host_only_skill';
        case 'http_mutation':
            if (channels.hostPush && !channels.httpRead) {
                return 'write_intent_vs_no_host_skill';
            }
            if (input.profile.isHttpOnly || channels.httpRead) {
                return 'write_intent_vs_http_only_skill';
            }
            return 'write_intent_vs_no_host_skill';
        case 'host_push':
            if (channels.httpMutation && !channels.hostPush) {
                return 'write_intent_vs_http_only_skill';
            }
            return 'write_intent_vs_no_host_skill';
        default:
            return null;
    }
}
exports.mismatchCodeForUnsupportedTaskKind = mismatchCodeForUnsupportedTaskKind;
//# sourceMappingURL=resolve-turn-task-kind.util.js.map