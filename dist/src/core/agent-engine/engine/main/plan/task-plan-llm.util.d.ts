import { z } from 'zod';
import type { LlmService } from '../../../../llm/llm.service';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import { type ToolDecisionRole } from '../../../../tool-engine/tool-decision-role.enum';
import type { ResolveOuterPlanInput, ResolveTaskPlanInput, ResolveTaskPlanResult, TaskPlanStep } from './task-plan.types';
export declare function isRequestedHostOnlyOuterPlanInput(planInput: ResolveOuterPlanInput): boolean;
export declare function resolveRequestedSkillOuterPlan(planInput: ResolveOuterPlanInput): ResolveTaskPlanResult;
export declare const llmTaskPlanStepSchema: z.ZodObject<{
    id: z.ZodString;
    phase: z.ZodEnum<{
        gather: "gather";
        analyze: "analyze";
        answer: "answer";
        mutate: "mutate";
    }>;
    kind: z.ZodEnum<{
        summarize: "summarize";
        tool: "tool";
        reason: "reason";
        host_tool: "host_tool";
    }>;
    toolRole: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    hostToolNames: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    objective: z.ZodString;
    stopWhen: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        observation_non_empty: "observation_non_empty";
        observation_fetch_complete: "observation_fetch_complete";
        observation_has_fields: "observation_has_fields";
        always: "always";
    }>>>;
}, z.core.$strip>;
export declare const llmOuterPlanStepSchema: z.ZodObject<{
    id: z.ZodString;
    phase: z.ZodEnum<{
        gather: "gather";
        analyze: "analyze";
        answer: "answer";
        mutate: "mutate";
    }>;
    kind: z.ZodEnum<{
        summarize: "summarize";
        tool: "tool";
        skill: "skill";
        reason: "reason";
        host_tool: "host_tool";
    }>;
    skillId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    toolRole: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    hostToolNames: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    objective: z.ZodString;
    stopWhen: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        observation_non_empty: "observation_non_empty";
        observation_fetch_complete: "observation_fetch_complete";
        observation_has_fields: "observation_has_fields";
        always: "always";
    }>>>;
}, z.core.$strip>;
export declare const llmOuterPlanSchema: z.ZodObject<{
    deliverable: z.ZodEnum<{
        list: "list";
        detail: "detail";
        answer: "answer";
        analysis: "analysis";
        mutation: "mutation";
    }>;
    goal: z.ZodString;
    steps: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        phase: z.ZodEnum<{
            gather: "gather";
            analyze: "analyze";
            answer: "answer";
            mutate: "mutate";
        }>;
        kind: z.ZodEnum<{
            summarize: "summarize";
            tool: "tool";
            skill: "skill";
            reason: "reason";
            host_tool: "host_tool";
        }>;
        skillId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        toolRole: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        hostToolNames: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
        objective: z.ZodString;
        stopWhen: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
            observation_non_empty: "observation_non_empty";
            observation_fetch_complete: "observation_fetch_complete";
            observation_has_fields: "observation_has_fields";
            always: "always";
        }>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const llmTaskPlanSchema: z.ZodObject<{
    deliverable: z.ZodEnum<{
        list: "list";
        detail: "detail";
        answer: "answer";
        analysis: "analysis";
        mutation: "mutation";
    }>;
    goal: z.ZodString;
    steps: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        phase: z.ZodEnum<{
            gather: "gather";
            analyze: "analyze";
            answer: "answer";
            mutate: "mutate";
        }>;
        kind: z.ZodEnum<{
            summarize: "summarize";
            tool: "tool";
            reason: "reason";
            host_tool: "host_tool";
        }>;
        toolRole: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        hostToolNames: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
        objective: z.ZodString;
        stopWhen: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
            observation_non_empty: "observation_non_empty";
            observation_fetch_complete: "observation_fetch_complete";
            observation_has_fields: "observation_has_fields";
            always: "always";
        }>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type LlmTaskPlanOutput = z.infer<typeof llmTaskPlanSchema>;
export declare function readPlanSkillPromptExcerptChars(): number;
export type NormalizePlanStepsResult = {
    steps: TaskPlanStep[] | null;
    droppedHostToolStepIds: string[];
};
export declare function normalizeOuterLlmPlanSteps(raw: z.infer<typeof llmOuterPlanSchema>, scopedRoles: Set<ToolDecisionRole>, availableSkillIds: Set<number>, scopedHostToolNames: Set<string>): NormalizePlanStepsResult;
export declare function normalizeLlmPlanSteps(raw: LlmTaskPlanOutput, scopedRoles: Set<ToolDecisionRole>, scopedHostToolNames: Set<string>): NormalizePlanStepsResult;
export declare function tryParseJsonObject(value: string): Record<string, unknown> | null;
export declare function tryBuildTaskPlanViaLlm(input: {
    llmService: LlmService;
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
    planInput: ResolveTaskPlanInput;
}): Promise<ResolveTaskPlanResult | null>;
export declare function tryBuildOuterPlanViaLlm(input: {
    llmService: LlmService;
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
    planInput: ResolveOuterPlanInput;
}): Promise<ResolveTaskPlanResult | null>;
export declare function resolveOuterPlan(input: {
    llmService: LlmService;
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
    planInput: ResolveOuterPlanInput;
}): Promise<ResolveTaskPlanResult>;
export declare function resolveTaskPlan(input: {
    llmService: LlmService;
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
    planInput: ResolveTaskPlanInput;
}): Promise<ResolveTaskPlanResult>;
