"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPlanConstraintsForPrompt = exports.mergePlanConstraints = exports.resolveSkillCapabilityConstraints = exports.resolvePlanGoal = void 0;
function resolvePlanGoal(input) {
    var _a, _b;
    const userMessage = input.userMessage.trim();
    if (userMessage) {
        return userMessage;
    }
    return (((_a = input.skillDescription) === null || _a === void 0 ? void 0 : _a.trim()) ||
        ((_b = input.skillName) === null || _b === void 0 ? void 0 : _b.trim()) ||
        'Complete the user request');
}
exports.resolvePlanGoal = resolvePlanGoal;
function resolveSkillCapabilityConstraints(input) {
    var _a, _b;
    const desc = (_a = input.skillDescription) === null || _a === void 0 ? void 0 : _a.trim();
    if (desc) {
        return [`Skill capability: ${desc}`];
    }
    const name = (_b = input.skillName) === null || _b === void 0 ? void 0 : _b.trim();
    if (name) {
        return [`Skill: ${name}`];
    }
    return [];
}
exports.resolveSkillCapabilityConstraints = resolveSkillCapabilityConstraints;
function mergePlanConstraints(base, extra) {
    const seen = new Set();
    const out = [];
    for (const row of [...base, ...extra]) {
        const trimmed = row.trim();
        if (!trimmed || seen.has(trimmed)) {
            continue;
        }
        seen.add(trimmed);
        out.push(trimmed);
    }
    return out;
}
exports.mergePlanConstraints = mergePlanConstraints;
function formatPlanConstraintsForPrompt(constraints) {
    if (!(constraints === null || constraints === void 0 ? void 0 : constraints.length)) {
        return null;
    }
    return constraints.map((row) => `- ${row}`).join('\n');
}
exports.formatPlanConstraintsForPrompt = formatPlanConstraintsForPrompt;
//# sourceMappingURL=plan-goal.util.js.map