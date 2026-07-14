"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.degradePageContext = exports.degradeSessionHistorySummary = exports.degradeSessionGoaText = exports.detectSessionGoaSection = void 0;
const prompt_budget_constants_1 = require("./prompt-budget.constants");
const text_degrade_util_1 = require("./text-degrade.util");
function detectSessionGoaSection(text) {
    if (text.includes('<session_goa_coverage>')) {
        return 'coverage';
    }
    if (text.includes('<recent_episodes>')) {
        return 'episodes';
    }
    if (text.includes('<artifact_summaries>')) {
        return 'artifacts';
    }
    if (text.includes('<observation_inventory>')) {
        return 'inventory';
    }
    if (text.includes('<active_task>')) {
        return 'active_task';
    }
    if (text.includes('<session_entities>')) {
        return 'entities';
    }
    return 'unknown';
}
exports.detectSessionGoaSection = detectSessionGoaSection;
function trimEpisodesBlock(text, maxEpisodes) {
    var _a;
    const match = text.match(/<recent_episodes>\s*([\s\S]*?)\s*<\/recent_episodes>/i);
    if (!match) {
        return (0, text_degrade_util_1.excerptText)(text, 2000);
    }
    const body = (_a = match[1]) !== null && _a !== void 0 ? _a : '';
    const lines = body
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '));
    if (lines.length <= maxEpisodes) {
        return text;
    }
    const kept = lines.slice(-maxEpisodes);
    return `<recent_episodes>\n${kept.join('\n')}\n</recent_episodes>`;
}
function degradeSessionGoaText(text, section, level) {
    if (level === 1) {
        if (section === 'episodes') {
            return trimEpisodesBlock(text, (0, prompt_budget_constants_1.getPromptGoaMaxEpisodesL1)());
        }
        return text;
    }
    if (level === 2) {
        if (section === 'active_task' || section === 'inventory') {
            return text;
        }
        return null;
    }
    if (level === 3) {
        if (section === 'coverage') {
            return '<session_goa_coverage>\ncoverage=degraded_session_goa\n</session_goa_coverage>';
        }
        return null;
    }
    return text;
}
exports.degradeSessionGoaText = degradeSessionGoaText;
function degradeSessionHistorySummary(text, level) {
    if (level === 1) {
        return (0, text_degrade_util_1.excerptText)(text, Math.max(400, Math.floor(text.length * 0.5)));
    }
    return null;
}
exports.degradeSessionHistorySummary = degradeSessionHistorySummary;
function degradePageContext(text, level) {
    if (level === 1) {
        return (0, text_degrade_util_1.excerptText)(text, 4000);
    }
    const idMatch = text.match(/\bid[=:]\s*["']?([^"'\s},]+)/i);
    const titleMatch = text.match(/title[=:]\s*["']?([^"'\n},]+)/i);
    const parts = ['<page_context_minimal>'];
    if (idMatch === null || idMatch === void 0 ? void 0 : idMatch[1]) {
        parts.push(`entityId=${idMatch[1]}`);
    }
    if (titleMatch === null || titleMatch === void 0 ? void 0 : titleMatch[1]) {
        parts.push(`title=${titleMatch[1].trim()}`);
    }
    parts.push('Inline large fields omitted due to prompt budget.');
    parts.push('</page_context_minimal>');
    return parts.join('\n');
}
exports.degradePageContext = degradePageContext;
//# sourceMappingURL=goa-degrade.util.js.map