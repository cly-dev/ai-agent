"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPageActionRunStreamPath = exports.buildPageActionStreamId = exports.PAGE_ACTION_PROMPT_LIMITS = exports.PAGE_ACTION_STREAM_REASON = void 0;
exports.PAGE_ACTION_STREAM_REASON = 'page_action_host_fill';
exports.PAGE_ACTION_PROMPT_LIMITS = {
    systemPromptMax: 8192,
    instructionMax: 32768,
    contextJsonMax: 65536,
};
function buildPageActionStreamId(input) {
    const slug = input.actionKey.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 48);
    return `pa-${input.actionRunId}-${slug}`;
}
exports.buildPageActionStreamId = buildPageActionStreamId;
function buildPageActionRunStreamPath(runId) {
    return `/page-action/runs/${runId}/stream`;
}
exports.buildPageActionRunStreamPath = buildPageActionRunStreamPath;
//# sourceMappingURL=page-action.constants.js.map