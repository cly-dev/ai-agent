"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPageActionRunStreamPath = exports.buildPageActionStreamId = exports.PAGE_ACTION_PROMPT_LIMITS = exports.PAGE_ACTION_SUMMARIZE_STREAM_REASON = exports.PAGE_ACTION_STREAM_REASON = void 0;
exports.PAGE_ACTION_STREAM_REASON = 'page_action_host_fill';
exports.PAGE_ACTION_SUMMARIZE_STREAM_REASON = 'page_action_summarize';
exports.PAGE_ACTION_PROMPT_LIMITS = {
    systemPromptMax: 8192,
    instructionMax: 32768,
    contextJsonMax: 65536,
};
function buildPageActionStreamId(input) {
    var _a;
    const slug = input.actionKey.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 48);
    const base = `pa-${input.actionRunId}-${slug}`;
    const segment = (_a = input.segment) === null || _a === void 0 ? void 0 : _a.trim();
    if (!segment) {
        return base;
    }
    const segmentSlug = segment.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 32);
    return `${base}-${segmentSlug}`;
}
exports.buildPageActionStreamId = buildPageActionStreamId;
function buildPageActionRunStreamPath(runId) {
    return `/page-action/runs/${runId}/stream`;
}
exports.buildPageActionRunStreamPath = buildPageActionRunStreamPath;
//# sourceMappingURL=page-action.constants.js.map