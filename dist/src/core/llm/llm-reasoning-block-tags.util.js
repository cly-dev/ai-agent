"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadLlmReasoningBlockTags = void 0;
const fs = require("fs");
const path = require("path");
const DEFAULT_TAGS = ['think', 'redacted_thinking', 'reasoning'];
let cachedTags = null;
function loadLlmReasoningBlockTags() {
    if (cachedTags) {
        return cachedTags;
    }
    const file = path.join(process.cwd(), 'src', 'core', 'llm', 'llm-reasoning-block-tags.json');
    try {
        const raw = fs.readFileSync(file, 'utf-8');
        const parsed = JSON.parse(raw);
        const tags = Array.isArray(parsed === null || parsed === void 0 ? void 0 : parsed.tags)
            ? parsed.tags
                .map((item) => (typeof item === 'string' ? item.trim() : ''))
                .filter((item) => item.length > 0)
            : [];
        cachedTags = tags.length > 0 ? tags : DEFAULT_TAGS;
        return cachedTags;
    }
    catch (_a) {
        cachedTags = DEFAULT_TAGS;
        return cachedTags;
    }
}
exports.loadLlmReasoningBlockTags = loadLlmReasoningBlockTags;
//# sourceMappingURL=llm-reasoning-block-tags.util.js.map