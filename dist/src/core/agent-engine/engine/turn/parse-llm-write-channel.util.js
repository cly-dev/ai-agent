"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLlmWriteChannelFromRaw = void 0;
function resolveLlmWriteChannelFromRaw(raw) {
    if (raw.writeChannel === 'http' || raw.writeChannel === 'host') {
        return raw.writeChannel;
    }
    if (raw.writeChannel === 'none') {
        if (raw.route === 'on_page_task') {
            return 'host';
        }
        return 'none';
    }
    if (raw.route === 'on_page_task') {
        return 'host';
    }
    if (raw.hostMutationIntent || raw.pageContextTaskKind === 'mutation') {
        return 'http';
    }
    return 'none';
}
exports.resolveLlmWriteChannelFromRaw = resolveLlmWriteChannelFromRaw;
//# sourceMappingURL=parse-llm-write-channel.util.js.map