import { z } from 'zod';
import type { TaskResumeFollowUpKind } from './session-resume-decision.types';

export const taskResumeFollowUpDecisionSchema = z.enum([
  'resume',
  'replan_same_goal',
  'new_topic',
]);

export const taskResumeFollowUpSchema = z.object({
  decision: taskResumeFollowUpDecisionSchema,
  reason: z.string().optional().nullable(),
});

export type TaskResumeFollowUpDecision = z.infer<typeof taskResumeFollowUpSchema>;

const legacyTaskResumeFollowUpSchema = z.object({
  continueActiveTask: z.boolean(),
  reason: z.string().optional().nullable(),
});

/** 解析 follow-up LLM 输出；兼容旧版 continueActiveTask 字段。 */
export function parseTaskResumeFollowUpDecision(
  raw: unknown,
): TaskResumeFollowUpDecision | null {
  const modern = taskResumeFollowUpSchema.safeParse(raw);
  if (modern.success) {
    return modern.data;
  }
  const legacy = legacyTaskResumeFollowUpSchema.safeParse(raw);
  if (legacy.success) {
    const decision: TaskResumeFollowUpKind = legacy.data.continueActiveTask
      ? 'resume'
      : 'new_topic';
    return {
      decision,
      reason: legacy.data.reason,
    };
  }
  return null;
}

export function fallbackTaskResumeFollowUpDecision(input: {
  hasPendingOrRunningSteps: boolean;
}): TaskResumeFollowUpDecision | null {
  if (!input.hasPendingOrRunningSteps) {
    return null;
  }
  return {
    decision: 'resume',
    reason: 'llm_failed_fallback',
  };
}
