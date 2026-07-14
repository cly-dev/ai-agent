"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenizeKeywordQuery = exports.keywordRecallScore = exports.keywordToolRecallScore = exports.buildToolEmbedText = exports.buildCategoryEmbedText = exports.cosineSimilarity = void 0;
const tool_agent_metadata_util_1 = require("../tool-engine/tool-agent-metadata.util");
function cosineSimilarity(a, b) {
    if (a.length === 0 || b.length === 0 || a.length !== b.length) {
        return 0;
    }
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let index = 0; index < a.length; index += 1) {
        dot += a[index] * b[index];
        normA += a[index] * a[index];
        normB += b[index] * b[index];
    }
    if (normA <= 0 || normB <= 0) {
        return 0;
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
exports.cosineSimilarity = cosineSimilarity;
function buildCategoryEmbedText(row) {
    var _a, _b;
    const label = row.label.trim();
    const description = (_b = (_a = row.description) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    if (description) {
        return `${label}\n${description}`;
    }
    return label;
}
exports.buildCategoryEmbedText = buildCategoryEmbedText;
function buildToolEmbedText(row) {
    var _a, _b;
    const name = row.name.trim();
    const description = (_b = (_a = row.description) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    if (description) {
        return `${name}\n${description}`;
    }
    return name;
}
exports.buildToolEmbedText = buildToolEmbedText;
function keywordToolRecallScore(query, tool) {
    const hay = tool.agentMetadata != null
        ? (0, tool_agent_metadata_util_1.buildToolEmbedTextFromMetadata)(tool).toLowerCase()
        : buildToolEmbedText(tool).toLowerCase();
    const tokens = tokenizeKeywordQuery(query);
    if (tokens.length === 0) {
        return 0;
    }
    let hits = 0;
    for (const token of tokens) {
        if (hay.includes(token)) {
            hits += 1;
        }
    }
    return hits / tokens.length;
}
exports.keywordToolRecallScore = keywordToolRecallScore;
function keywordRecallScore(query, category) {
    const hay = buildCategoryEmbedText(category).toLowerCase();
    const tokens = tokenizeKeywordQuery(query);
    if (tokens.length === 0) {
        return 0;
    }
    let hits = 0;
    for (const token of tokens) {
        if (hay.includes(token)) {
            hits += 1;
        }
    }
    return hits / tokens.length;
}
exports.keywordRecallScore = keywordRecallScore;
function tokenizeKeywordQuery(query) {
    const normalized = query.toLowerCase();
    const baseTokens = normalized
        .split(/[\s,，。！？!?、；;:：()（）【】\[\]{}<>《》"'`~\-_/\\|]+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2);
    const extraCjkTokens = [];
    for (const token of baseTokens) {
        if (/[\u4e00-\u9fff]/.test(token) && token.length >= 3) {
            for (let i = 0; i < token.length - 1; i += 1) {
                const gram = token.slice(i, i + 2);
                if (/^[\u4e00-\u9fff]{2}$/.test(gram)) {
                    extraCjkTokens.push(gram);
                }
            }
        }
    }
    return [...new Set([...baseTokens, ...extraCjkTokens])];
}
exports.tokenizeKeywordQuery = tokenizeKeywordQuery;
//# sourceMappingURL=vector.util.js.map