"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldEnforceRequestedSkillFromContract = exports.toSkillIntentAlignmentSnapshot = exports.resolveSkillIntentAlignment = exports.buildSkillMismatchRespond = exports.deriveTurnUserIntent = exports.emptySkillIntentAlignment = void 0;
const resolve_turn_task_kind_util_1 = require("./resolve-turn-task-kind.util");
const skill_config_intent_alignment_util_1 = require("./skill-config-intent-alignment.util");
const DEFAULT_MISMATCH_POLICY = {
    read_intent_vs_http_skill: 'intent_first',
    read_intent_vs_host_only_skill: 'intent_first',
    write_intent_vs_http_only_skill: 'clarify',
    write_intent_vs_no_host_skill: 'clarify',
    direct_answer_vs_any_skill: 'intent_first',
    orchestrated_http_vs_host_only_skill: 'intent_first',
};
function resolveMismatchPolicy(code, policyOverrides) {
    var _a;
    return (_a = policyOverrides[code]) !== null && _a !== void 0 ? _a : DEFAULT_MISMATCH_POLICY[code];
}
function emptySkillIntentAlignment() {
    return { status: 'none' };
}
exports.emptySkillIntentAlignment = emptySkillIntentAlignment;
function deriveTurnUserIntent(input) {
    const readPlanActive = input.pageContextPlan !== 'none';
    const writeChannel = (0, resolve_turn_task_kind_util_1.writeChannelFromTaskKind)(input.taskKind);
    const route = (0, resolve_turn_task_kind_util_1.routeFromTaskKind)(input.taskKind);
    return {
        taskKind: input.taskKind,
        route,
        readPlanActive,
        pageContextPlan: input.pageContextPlan,
        writeChannel,
        hostMutation: writeChannel === 'host',
        httpOrchestrated: input.taskKind === 'orchestrated_read' ||
            (route === 'orchestrated_task' && !readPlanActive && writeChannel === 'none'),
    };
}
exports.deriveTurnUserIntent = deriveTurnUserIntent;
function detectSkillIntentMismatchCode(input) {
    if (input.taskKind === 'direct_answer') {
        return 'direct_answer_vs_any_skill';
    }
    if (input.taskKind === 'page_read') {
        if (input.profile.isHostOnly) {
            return 'read_intent_vs_host_only_skill';
        }
        if (input.profile.isHttpOnly) {
            return 'read_intent_vs_http_skill';
        }
        return null;
    }
    if ((0, resolve_turn_task_kind_util_1.skillSupportsTaskKind)(input.profile.channels, input.taskKind)) {
        return null;
    }
    return (0, resolve_turn_task_kind_util_1.mismatchCodeForUnsupportedTaskKind)({
        taskKind: input.taskKind,
        profile: input.profile,
    });
}
function buildSkillMismatchRespond(input) {
    return {
        kind: 'skill_intent_mismatch',
        userMessage: input.userMessage,
        payload: {
            mismatchCode: input.code,
            requestedSkillId: input.requestedSkillId,
            requestedSkillName: input.requestedSkillName,
            routingReason: input.routingReason,
        },
    };
}
exports.buildSkillMismatchRespond = buildSkillMismatchRespond;
function applyIntentFirstSkillSelect() {
    return {
        effectiveSkillSelect: 'llm',
        effectiveExplicitSkillId: null,
        effectivePageHostSkillId: null,
    };
}
function resolveSkillIntentAlignment(input) {
    if (input.requestedSkillId == null || input.skillProfile == null) {
        return { status: 'no_requested_skill' };
    }
    const policyOverrides = (0, skill_config_intent_alignment_util_1.parseSkillIntentMismatchPolicyOverrides)(input.skillConfig);
    const code = detectSkillIntentMismatchCode({
        taskKind: input.taskKind,
        profile: input.skillProfile,
    });
    if (code == null) {
        return { status: 'aligned' };
    }
    const policy = resolveMismatchPolicy(code, policyOverrides);
    if (policy === 'clarify') {
        return {
            status: 'clarify',
            code,
            requestedSkillId: input.requestedSkillId,
            respond: buildSkillMismatchRespond({
                code,
                userMessage: input.userMessage,
                requestedSkillId: input.requestedSkillId,
                requestedSkillName: input.skillProfile.skillName,
                routingReason: input.routeMeta.reason,
            }),
        };
    }
    const effective = applyIntentFirstSkillSelect();
    return Object.assign({ status: 'intent_first', code, requestedSkillId: input.requestedSkillId }, effective);
}
exports.resolveSkillIntentAlignment = resolveSkillIntentAlignment;
function toSkillIntentAlignmentSnapshot(alignment, requestedSkillId) {
    if (alignment.status === 'no_requested_skill') {
        return { status: 'none' };
    }
    if (alignment.status === 'aligned') {
        return {
            status: 'aligned',
            requestedSkillId: requestedSkillId !== null && requestedSkillId !== void 0 ? requestedSkillId : undefined,
        };
    }
    if (alignment.status === 'clarify') {
        return {
            status: 'clarified',
            code: alignment.code,
            requestedSkillId: alignment.requestedSkillId,
        };
    }
    return {
        status: 'intent_first',
        code: alignment.code,
        requestedSkillId: alignment.requestedSkillId,
        droppedExplicitSkill: alignment.effectiveSkillSelect !== 'explicit',
    };
}
exports.toSkillIntentAlignmentSnapshot = toSkillIntentAlignmentSnapshot;
function shouldEnforceRequestedSkillFromContract(input) {
    return input.scopedToolsSource === 'explicit_skill';
}
exports.shouldEnforceRequestedSkillFromContract = shouldEnforceRequestedSkillFromContract;
//# sourceMappingURL=skill-intent-alignment.util.js.map