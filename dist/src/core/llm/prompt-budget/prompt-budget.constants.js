"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_GOA_TAG_SECTION = exports.BLOCK_MAX_DEGRADE = exports.BLOCK_PRIORITY = exports.PROMPT_BUDGET_NOTE_TAG = exports.getPromptHistoryMaxTurnsL0 = exports.getPromptGoaMaxEpisodesL1 = exports.getPromptAgentExcerptCharsL2 = exports.getPromptAgentExcerptChars = exports.getPromptSkillExcerptChars = exports.getPromptObsLongFieldThreshold = exports.getPromptObsFieldPreviewChars = exports.getPromptObsMaxRecordsL1 = exports.getPromptBudgetReserveTokens = exports.getPromptBudgetSafetyMarginRatio = exports.isPromptBudgetEnabled = void 0;
function readPositiveInt(envKey, defaultValue) {
    var _a;
    const raw = (_a = process.env[envKey]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw) {
        return defaultValue;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}
function readRatio(envKey, defaultValue) {
    var _a;
    const raw = (_a = process.env[envKey]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw) {
        return defaultValue;
    }
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) && parsed >= 0 && parsed < 1
        ? parsed
        : defaultValue;
}
function readBool(envKey, defaultEnabled) {
    var _a;
    const raw = (_a = process.env[envKey]) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    if (!raw) {
        return defaultEnabled;
    }
    if (raw === '0' || raw === 'false' || raw === 'off' || raw === 'no') {
        return false;
    }
    return true;
}
function isPromptBudgetEnabled() {
    return readBool('PROMPT_BUDGET_ENABLED', true);
}
exports.isPromptBudgetEnabled = isPromptBudgetEnabled;
function getPromptBudgetSafetyMarginRatio() {
    return readRatio('PROMPT_BUDGET_SAFETY_MARGIN_RATIO', 0.08);
}
exports.getPromptBudgetSafetyMarginRatio = getPromptBudgetSafetyMarginRatio;
function getPromptBudgetReserveTokens() {
    return readPositiveInt('PROMPT_BUDGET_RESERVE_TOKENS', 384);
}
exports.getPromptBudgetReserveTokens = getPromptBudgetReserveTokens;
function getPromptObsMaxRecordsL1() {
    return readPositiveInt('PROMPT_OBS_MAX_RECORDS_L1', 20);
}
exports.getPromptObsMaxRecordsL1 = getPromptObsMaxRecordsL1;
function getPromptObsFieldPreviewChars() {
    return readPositiveInt('PROMPT_OBS_FIELD_PREVIEW_CHARS', 500);
}
exports.getPromptObsFieldPreviewChars = getPromptObsFieldPreviewChars;
function getPromptObsLongFieldThreshold() {
    return readPositiveInt('PROMPT_OBS_LONG_FIELD_THRESHOLD', 800);
}
exports.getPromptObsLongFieldThreshold = getPromptObsLongFieldThreshold;
function getPromptSkillExcerptChars() {
    return readPositiveInt('PROMPT_SKILL_EXCERPT_CHARS', 1200);
}
exports.getPromptSkillExcerptChars = getPromptSkillExcerptChars;
function getPromptAgentExcerptChars() {
    return readPositiveInt('PROMPT_AGENT_EXCERPT_CHARS', 800);
}
exports.getPromptAgentExcerptChars = getPromptAgentExcerptChars;
function getPromptAgentExcerptCharsL2() {
    return readPositiveInt('PROMPT_AGENT_EXCERPT_CHARS_L2', 400);
}
exports.getPromptAgentExcerptCharsL2 = getPromptAgentExcerptCharsL2;
function getPromptGoaMaxEpisodesL1() {
    return readPositiveInt('PROMPT_GOA_MAX_EPISODES_L1', 3);
}
exports.getPromptGoaMaxEpisodesL1 = getPromptGoaMaxEpisodesL1;
function getPromptHistoryMaxTurnsL0() {
    return readPositiveInt('PROMPT_HISTORY_MAX_TURNS_L0', 12);
}
exports.getPromptHistoryMaxTurnsL0 = getPromptHistoryMaxTurnsL0;
exports.PROMPT_BUDGET_NOTE_TAG = 'prompt_budget_note';
exports.BLOCK_PRIORITY = {
    current_user_request: 0,
    plan_step_override: 0,
    plan_context: 5,
    tool_decision: 10,
    tool_schema: 10,
    host_tool_schema: 10,
    pending_write_tool_call: 9,
    current_run_observations: 20,
    summarize_context: 18,
    page_context: 25,
    working_memory_observations: 30,
    session_goa: 35,
    session_history_summary: 40,
    session_history_guide: 41,
    session_history_turns: 40,
    user_memory: 40,
    tool_result_legacy: 45,
    other: 45,
    agent_prompt: 50,
    response_style: 55,
    message_blocks_spec: 55,
};
exports.BLOCK_MAX_DEGRADE = {
    current_user_request: 0,
    plan_step_override: 0,
    plan_context: 1,
    tool_decision: 2,
    tool_schema: 2,
    host_tool_schema: 2,
    pending_write_tool_call: 1,
    current_run_observations: 3,
    page_context: 2,
    working_memory_observations: 4,
    session_goa: 3,
    session_history_summary: 2,
    session_history_guide: 1,
    session_history_turns: 3,
    summarize_context: 2,
    user_memory: 2,
    tool_result_legacy: 2,
    other: 2,
    agent_prompt: 2,
    response_style: 2,
    message_blocks_spec: 1,
};
exports.SESSION_GOA_TAG_SECTION = {
    session_goa_coverage: 'coverage',
    recent_episodes: 'episodes',
    artifact_summaries: 'artifacts',
    observation_inventory: 'inventory',
    active_task: 'active_task',
    session_entities: 'entities',
};
//# sourceMappingURL=prompt-budget.constants.js.map