"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPageActionLlmMessages = exports.buildPageActionUserContent = void 0;
const page_context_prompt_util_1 = require("../host-bridge/page-context.prompt.util");
function buildPageActionUserContent(input) {
    var _a;
    const lines = [];
    const instruction = (_a = input.instruction) === null || _a === void 0 ? void 0 : _a.trim();
    if (instruction) {
        lines.push(`User request: ${instruction}`);
    }
    const pageBlock = (0, page_context_prompt_util_1.formatPageContextPromptBlock)(input.pageContext);
    if (pageBlock) {
        lines.push(pageBlock);
    }
    if (input.context && Object.keys(input.context).length > 0) {
        lines.push(`<context>\n${JSON.stringify(input.context)}\n</context>`);
    }
    if (lines.length === 0) {
        return 'Generate the requested content.';
    }
    return lines.join('\n');
}
exports.buildPageActionUserContent = buildPageActionUserContent;
function buildPageActionLlmMessages(input) {
    return [
        { role: 'system', content: input.systemPrompt.trim() },
        {
            role: 'user',
            content: buildPageActionUserContent({
                instruction: input.instruction,
                context: input.context,
                pageContext: input.pageContext,
            }),
        },
    ];
}
exports.buildPageActionLlmMessages = buildPageActionLlmMessages;
//# sourceMappingURL=page-action-prompt.util.js.map