"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compactToolSchemaJson = exports.degradePlainText = exports.degradeActiveSkillInToolDecision = exports.excerptText = void 0;
const prompt_budget_constants_1 = require("./prompt-budget.constants");
function excerptText(text, maxChars) {
    const trimmed = text.trim();
    if (trimmed.length <= maxChars) {
        return trimmed;
    }
    return `${trimmed.slice(0, maxChars)}… [excerpt len=${trimmed.length}]`;
}
exports.excerptText = excerptText;
function degradeActiveSkillInToolDecision(text, level) {
    var _a;
    const skillMatch = text.match(/<active_skill>\s*([\s\S]*?)\s*<\/active_skill>/i);
    if (!skillMatch) {
        if (level === 2) {
            return extractToolDecisionMinimal(text);
        }
        return text;
    }
    const skillBody = (_a = skillMatch[1]) !== null && _a !== void 0 ? _a : '';
    const skillReplacement = level === 1
        ? `<active_skill>\n${excerptText(skillBody, (0, prompt_budget_constants_1.getPromptSkillExcerptChars)())}\n</active_skill>`
        : `<active_skill>\n[skill discipline excerpt only — follow current_objective and observations]\n</active_skill>`;
    const replaced = text.replace(skillMatch[0], skillReplacement);
    return level === 2 ? extractToolDecisionMinimal(replaced) : replaced;
}
exports.degradeActiveSkillInToolDecision = degradeActiveSkillInToolDecision;
function extractToolDecisionMinimal(text) {
    var _a, _b;
    const objectiveMatch = text.match(/<current_objective>\s*([\s\S]*?)\s*<\/current_objective>/i);
    const objective = (_b = (_a = objectiveMatch === null || objectiveMatch === void 0 ? void 0 : objectiveMatch[1]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    const lines = [
        '<tool_decision_minimal>',
        objective ? `current_objective: ${objective}` : null,
        'Follow observations and tool_schema. Emit tool_calls or answer minimally.',
        '</tool_decision_minimal>',
    ].filter((line) => line != null);
    return lines.join('\n');
}
function degradePlainText(text, level, maxCharsL1, maxCharsL2) {
    if (level === 1) {
        return excerptText(text, maxCharsL1);
    }
    return excerptText(text, maxCharsL2);
}
exports.degradePlainText = degradePlainText;
function compactToolSchemaJson(json) {
    try {
        const parsed = JSON.parse(json);
        if (!Array.isArray(parsed)) {
            return json;
        }
        const compact = parsed.map((row) => {
            if (row == null || typeof row !== 'object' || Array.isArray(row)) {
                return row;
            }
            const tool = row;
            return {
                name: tool.name,
                description: typeof tool.description === 'string'
                    ? excerptText(tool.description, 200)
                    : tool.description,
                role: tool.role,
                filters: tool.filters,
                returns: tool.returns,
            };
        });
        return JSON.stringify(compact);
    }
    catch (_a) {
        return json;
    }
}
exports.compactToolSchemaJson = compactToolSchemaJson;
//# sourceMappingURL=text-degrade.util.js.map