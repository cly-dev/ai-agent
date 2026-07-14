"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePageActionRunOutputText = void 0;
const page_action_run_steps_util_1 = require("./page-action-run-steps.util");
function pickString(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function extractTextFromWriteArguments(args) {
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
        return null;
    }
    const row = args;
    for (const key of ['content', 'text', 'body', 'summary', 'message']) {
        const direct = pickString(row[key]);
        if (direct) {
            return direct;
        }
    }
    const reviewReply = row.reviewReply;
    if (reviewReply && typeof reviewReply === 'object' && !Array.isArray(reviewReply)) {
        const nested = reviewReply;
        const preview = nested._preview;
        if (Array.isArray(preview)) {
            for (const item of preview) {
                if (!item || typeof item !== 'object' || Array.isArray(item)) {
                    continue;
                }
                const content = pickString(item.content);
                if (content) {
                    return content;
                }
            }
        }
    }
    if (Array.isArray(reviewReply)) {
        for (const item of reviewReply) {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                continue;
            }
            const content = pickString(item.content);
            if (content) {
                return content;
            }
        }
    }
    return null;
}
function readWriteArgumentsFromStepDetail(detail) {
    if (detail.writeArguments != null) {
        return detail.writeArguments;
    }
    const rawToolCall = detail.rawToolCall;
    if (rawToolCall && typeof rawToolCall === 'object' && !Array.isArray(rawToolCall)) {
        return rawToolCall.arguments;
    }
    if (detail.llmStructuredOutput != null) {
        return detail.llmStructuredOutput;
    }
    return null;
}
function extractFromSteps(steps) {
    const preferredNames = new Set([
        'compose_mutation.end',
        'compose_mutation:compose',
        'awaiting_approval',
    ]);
    for (let index = steps.length - 1; index >= 0; index -= 1) {
        const step = steps[index];
        if (!preferredNames.has(step.name) || !step.detail) {
            continue;
        }
        const summaryText = pickString(step.detail.summaryText);
        if (summaryText) {
            return summaryText;
        }
        const fromArgs = extractTextFromWriteArguments(readWriteArgumentsFromStepDetail(step.detail));
        if (fromArgs) {
            return fromArgs;
        }
    }
    for (let index = steps.length - 1; index >= 0; index -= 1) {
        const step = steps[index];
        if (!step.detail) {
            continue;
        }
        const fromArgs = extractTextFromWriteArguments(readWriteArgumentsFromStepDetail(step.detail));
        if (fromArgs) {
            return fromArgs;
        }
    }
    return null;
}
function resolvePageActionRunOutputText(input) {
    var _a, _b;
    const fillText = (_a = input.fillText) === null || _a === void 0 ? void 0 : _a.trim();
    if (fillText) {
        return fillText;
    }
    const fromSteps = extractFromSteps((0, page_action_run_steps_util_1.parsePageActionRunSteps)(input.steps));
    if (fromSteps) {
        return fromSteps;
    }
    const errorMessage = (_b = input.errorMessage) === null || _b === void 0 ? void 0 : _b.trim();
    if (errorMessage) {
        return errorMessage;
    }
    return null;
}
exports.resolvePageActionRunOutputText = resolvePageActionRunOutputText;
//# sourceMappingURL=resolve-page-action-run-output-text.util.js.map