"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSkillIntentMismatchPolicyOverrides = void 0;
const MISMATCH_CODES = [
    'read_intent_vs_http_skill',
    'read_intent_vs_host_only_skill',
    'write_intent_vs_http_only_skill',
    'write_intent_vs_no_host_skill',
    'direct_answer_vs_any_skill',
    'orchestrated_http_vs_host_only_skill',
];
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function parsePolicy(value) {
    if (value === 'intent_first' || value === 'clarify') {
        return value;
    }
    return null;
}
function parseSkillIntentMismatchPolicyOverrides(config) {
    if (!isRecord(config)) {
        return {};
    }
    const raw = config.intentMismatchPolicy;
    if (!isRecord(raw)) {
        return {};
    }
    const overrides = {};
    for (const code of MISMATCH_CODES) {
        const policy = parsePolicy(raw[code]);
        if (policy) {
            overrides[code] = policy;
        }
    }
    return overrides;
}
exports.parseSkillIntentMismatchPolicyOverrides = parseSkillIntentMismatchPolicyOverrides;
//# sourceMappingURL=skill-config-intent-alignment.util.js.map