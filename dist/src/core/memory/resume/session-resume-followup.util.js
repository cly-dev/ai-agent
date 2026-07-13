"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fallbackTaskResumeFollowUpDecision = exports.parseTaskResumeFollowUpDecision = exports.taskResumeFollowUpSchema = exports.taskResumeFollowUpDecisionSchema = void 0;
const zod_1 = require("zod");
exports.taskResumeFollowUpDecisionSchema = zod_1.z.enum([
    'resume',
    'replan_same_goal',
    'new_topic',
]);
exports.taskResumeFollowUpSchema = zod_1.z.object({
    decision: exports.taskResumeFollowUpDecisionSchema,
    reason: zod_1.z.string().optional().nullable(),
});
const legacyTaskResumeFollowUpSchema = zod_1.z.object({
    continueActiveTask: zod_1.z.boolean(),
    reason: zod_1.z.string().optional().nullable(),
});
function parseTaskResumeFollowUpDecision(raw) {
    const modern = exports.taskResumeFollowUpSchema.safeParse(raw);
    if (modern.success) {
        return modern.data;
    }
    const legacy = legacyTaskResumeFollowUpSchema.safeParse(raw);
    if (legacy.success) {
        const decision = legacy.data.continueActiveTask
            ? 'resume'
            : 'new_topic';
        return {
            decision,
            reason: legacy.data.reason,
        };
    }
    return null;
}
exports.parseTaskResumeFollowUpDecision = parseTaskResumeFollowUpDecision;
function fallbackTaskResumeFollowUpDecision(input) {
    if (!input.hasPendingOrRunningSteps) {
        return null;
    }
    return {
        decision: 'resume',
        reason: 'llm_failed_fallback',
    };
}
exports.fallbackTaskResumeFollowUpDecision = fallbackTaskResumeFollowUpDecision;
//# sourceMappingURL=session-resume-followup.util.js.map