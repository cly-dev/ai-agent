"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveSkillExecutionChannels = exports.EMPTY_SKILL_EXECUTION_CHANNELS = void 0;
exports.EMPTY_SKILL_EXECUTION_CHANNELS = {
    httpRead: false,
    httpMutation: false,
    hostPush: false,
    primaryWriteChannel: null,
};
function deriveSkillExecutionChannels(input) {
    var _a;
    const nodes = (_a = input.nodes) !== null && _a !== void 0 ? _a : [];
    if (nodes.length > 0) {
        const actions = new Set(nodes.map((node) => node.action));
        const httpMutation = input.deliverable === 'mutation' ||
            actions.has('write_data') ||
            (actions.has('compose_mutation') && actions.has('await_user_confirm'));
        const hostPush = actions.has('generate_and_push');
        const primaryWriteChannel = (() => {
            if (input.deliverable === 'mutation' || httpMutation) {
                return 'http';
            }
            if (hostPush) {
                return 'host';
            }
            return null;
        })();
        return {
            httpRead: actions.has('fetch_data') || actions.has('load_page_context'),
            httpMutation,
            hostPush,
            primaryWriteChannel,
        };
    }
    return {
        httpRead: input.skillToolIds.length > 0,
        httpMutation: false,
        hostPush: input.hostToolIds.length > 0,
        primaryWriteChannel: input.hostToolIds.length > 0 ? 'host' : null,
    };
}
exports.deriveSkillExecutionChannels = deriveSkillExecutionChannels;
//# sourceMappingURL=derive-skill-execution-channels.util.js.map