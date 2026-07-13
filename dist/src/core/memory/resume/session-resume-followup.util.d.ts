import { z } from 'zod';
export declare const taskResumeFollowUpDecisionSchema: z.ZodEnum<{
    resume: "resume";
    replan_same_goal: "replan_same_goal";
    new_topic: "new_topic";
}>;
export declare const taskResumeFollowUpSchema: z.ZodObject<{
    decision: z.ZodEnum<{
        resume: "resume";
        replan_same_goal: "replan_same_goal";
        new_topic: "new_topic";
    }>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type TaskResumeFollowUpDecision = z.infer<typeof taskResumeFollowUpSchema>;
export declare function parseTaskResumeFollowUpDecision(raw: unknown): TaskResumeFollowUpDecision | null;
export declare function fallbackTaskResumeFollowUpDecision(input: {
    hasPendingOrRunningSteps: boolean;
}): TaskResumeFollowUpDecision | null;
