"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDeterministicMutationPresentMarkdown = exports.isBareMachineSubmitDisplay = void 0;
const write_tool_draft_injection_util_1 = require("../../../../tool-engine/write-tool-draft-injection.util");
const MIN_PRESENT_CONTEXT_CHARS = 12;
function normalizeComparableText(text) {
    return text.replace(/\s/g, '');
}
function isBareMachineSubmitDisplay(displayDraft, machineSubmit) {
    var _a;
    const display = displayDraft.trim();
    const submit = (_a = machineSubmit === null || machineSubmit === void 0 ? void 0 : machineSubmit.trim()) !== null && _a !== void 0 ? _a : '';
    if (!display || !submit) {
        return false;
    }
    if (normalizeComparableText(display) === normalizeComparableText(submit)) {
        return true;
    }
    const fromFence = (0, write_tool_draft_injection_util_1.extractSubmitTextFromDraftReply)(display);
    if (fromFence &&
        normalizeComparableText(fromFence) === normalizeComparableText(submit)) {
        const outsideFence = display
            .replace(/```[\w-]*\n[\s\S]*?```/g, '')
            .trim();
        return (outsideFence.replace(/\s/g, '').length < MIN_PRESENT_CONTEXT_CHARS);
    }
    return false;
}
exports.isBareMachineSubmitDisplay = isBareMachineSubmitDisplay;
function buildDeterministicMutationPresentMarkdown(input) {
    var _a;
    const { arguments: args, writeTool } = input;
    const hasSubmitBody = (0, write_tool_draft_injection_util_1.writeToolHasSubmitBodyPath)(writeTool);
    const sections = [];
    const paramsPreview = (0, write_tool_draft_injection_util_1.formatWriteToolArgumentsForUserPreview)(args, writeTool, hasSubmitBody ? undefined : writeTool.description, hasSubmitBody ? { excludeSubmitBody: true } : undefined);
    if (paramsPreview.trim()) {
        sections.push(paramsPreview.trim());
    }
    if (hasSubmitBody) {
        const submitText = (_a = (0, write_tool_draft_injection_util_1.extractSubmitTextFromWriteArguments)(args, writeTool)) === null || _a === void 0 ? void 0 : _a.trim();
        if (submitText) {
            sections.push(`\`\`\`\n${submitText}\n\`\`\``);
        }
    }
    return sections.join('\n\n');
}
exports.buildDeterministicMutationPresentMarkdown = buildDeterministicMutationPresentMarkdown;
//# sourceMappingURL=plan-present-display.util.js.map