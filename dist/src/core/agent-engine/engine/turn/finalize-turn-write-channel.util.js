"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeTurnWriteChannel = exports.inferDraftWriteChannelFromRouting = void 0;
const SKILL_CHANNEL_ANCHOR_SUFFIX = ' [skill_channel_anchor:http_mutation]';
function inferDraftWriteChannelFromRouting(routing) {
    return routing.llmWriteChannel;
}
exports.inferDraftWriteChannelFromRouting = inferDraftWriteChannelFromRouting;
function anchorRoutingForHttpMutation(routing) {
    const reason = routing.reason.includes(SKILL_CHANNEL_ANCHOR_SUFFIX)
        ? routing.reason
        : `${routing.reason}${SKILL_CHANNEL_ANCHOR_SUFFIX}`;
    return Object.assign(Object.assign({}, routing), { route: routing.route === 'on_page_task' ? 'orchestrated_task' : routing.route, llmWriteChannel: 'http', hostMutationIntent: false, reason });
}
function shouldAnchorHostDraftToHttp(channels) {
    if (!channels.httpMutation) {
        return false;
    }
    if (!channels.hostPush) {
        return true;
    }
    return channels.primaryWriteChannel === 'http';
}
function finalizeTurnWriteChannel(input) {
    let writeChannel = inferDraftWriteChannelFromRouting(input.routing);
    let routing = input.routing;
    let skillChannelAnchored = false;
    const channels = input.skillChannels;
    if (channels && writeChannel === 'host' && shouldAnchorHostDraftToHttp(channels)) {
        writeChannel = 'http';
        routing = anchorRoutingForHttpMutation(routing);
        skillChannelAnchored = true;
    }
    return { writeChannel, routing, skillChannelAnchored };
}
exports.finalizeTurnWriteChannel = finalizeTurnWriteChannel;
//# sourceMappingURL=finalize-turn-write-channel.util.js.map