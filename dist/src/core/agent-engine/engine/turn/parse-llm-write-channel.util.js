"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDraftWriteChannelFromRouteLlm = void 0;
function resolveDraftWriteChannelFromRouteLlm(input) {
    if (input.pageContextTaskKind === 'mutation') {
        return 'http';
    }
    if (input.route === 'on_page_task') {
        return 'host';
    }
    return 'none';
}
exports.resolveDraftWriteChannelFromRouteLlm = resolveDraftWriteChannelFromRouteLlm;
//# sourceMappingURL=parse-llm-write-channel.util.js.map