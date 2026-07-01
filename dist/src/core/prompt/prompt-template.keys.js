"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROMPT_KEY_LIST = exports.PROMPT_KEYS = void 0;
exports.PROMPT_KEYS = {
    PLATFORM_RESPONSE_STYLE: 'platform.response_style',
    AGENT_TOOL_DECISION: 'agent.tool_decision',
    AGENT_TASK_RESUME_FOLLOWUP: 'agent.task_resume_followup',
    AGENT_READINESS_SLOT_CHECK: 'agent.readiness_slot_check',
    AGENT_RESPOND_CLARIFICATION: 'agent.respond_clarification',
    AGENT_RESPOND_SKILL_INTENT_MISMATCH: 'agent.respond_skill_intent_mismatch',
    AGENT_PLAN: 'agent.plan',
    AGENT_TURN_ROUTE: 'agent.turn_route',
    AGENT_GATHER_PAGE_SUMMARY: 'agent.gather_page_summary',
    AGENT_SUMMARIZE_TOOL_FULL: 'agent.summarize_tool_full',
    AGENT_SUMMARIZE_READ: 'agent.summarize_read',
    AGENT_SUMMARIZE_ACTION: 'agent.summarize_action',
    AGENT_SUMMARIZE_SMALLTALK: 'agent.summarize_smalltalk',
    PLATFORM_MESSAGE_BLOCKS_SPEC: 'platform.message_blocks_spec',
    AGENT_SUMMARIZE_MESSAGE_BLOCKS: 'agent.summarize_message_blocks',
    AGENT_SUMMARIZE_PLAN_DRAFT_PROSE_SUPPLEMENT: 'agent.summarize_plan_draft_prose_supplement',
    AGENT_SUMMARIZE_PLAN_PRESENT_FROM_COMPOSE: 'agent.summarize_plan_present_from_compose',
    AGENT_SUMMARIZE_PLAN_REASON_HOST_FILL_STREAM: 'agent.summarize_plan_reason_host_fill_stream',
    AGENT_SUMMARIZE_WRITE_CONFIRM_RESUME: 'agent.summarize_write_confirm_resume',
    MEMORY_HISTORY_COMPRESSION: 'memory.history_compression',
    TOOLS_SCHEMA_INFERENCE: 'tools.schema_inference',
};
exports.PROMPT_KEY_LIST = Object.values(exports.PROMPT_KEYS);
//# sourceMappingURL=prompt-template.keys.js.map