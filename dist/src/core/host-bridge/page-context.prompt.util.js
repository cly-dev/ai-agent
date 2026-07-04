"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPageContextPromptBlock = void 0;
const parse_page_context_util_1 = require("./parse-page-context.util");
function formatPageContextPromptBlock(pageContext) {
    const normalized = pageContext
        ? (0, parse_page_context_util_1.parsePageContextFromMessageFields)({ pageContext })
        : null;
    if (!normalized) {
        return null;
    }
    return `<page_context>\n${JSON.stringify(normalized)}\n</page_context>`;
}
exports.formatPageContextPromptBlock = formatPageContextPromptBlock;
//# sourceMappingURL=page-context.prompt.util.js.map