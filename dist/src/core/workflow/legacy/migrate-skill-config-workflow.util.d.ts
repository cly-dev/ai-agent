import { WorkflowDeliverable } from '../../../../generated/prisma/client';
import type { WorkflowBindingRefs, WorkflowNodeDef, WorkflowValidationIssue } from '../workflow.types';
export type SkillWorkflowBindingInput = {
    toolId: number;
    isRequired: boolean;
};
export type SkillWorkflowHostBindingInput = {
    hostToolId: number;
    isRequired: boolean;
};
export type SkillWorkflowMigrationInput = {
    skillId: number;
    skillName: string;
    capabilityKey: string | null;
    config: unknown;
    toolBindings: SkillWorkflowBindingInput[];
    hostToolBindings: SkillWorkflowHostBindingInput[];
};
export type SkillWorkflowMigrationPlan = {
    workflowKey: string;
    name: string;
    goal: string | null;
    deliverable: WorkflowDeliverable;
    nodes: WorkflowNodeDef[];
    tools: SkillWorkflowBindingInput[];
    hostTools: SkillWorkflowHostBindingInput[];
    validationIssues: WorkflowValidationIssue[];
};
export declare function hasLegacySkillConfigWorkflow(config: unknown): boolean;
export declare function buildMigratedWorkflowKey(input: {
    skillId: number;
    capabilityKey: string | null;
    skillName: string;
}): string;
export declare function mapLegacyDeliverableToWorkflowDeliverable(deliverable: string | null | undefined): WorkflowDeliverable;
export declare function enrichMigratedWorkflowNodes(nodes: WorkflowNodeDef[], bindings: WorkflowBindingRefs): WorkflowNodeDef[];
export declare function buildSkillWorkflowMigrationPlan(input: SkillWorkflowMigrationInput): SkillWorkflowMigrationPlan | null;
export declare function stripLegacySkillConfigWorkflow(config: unknown): Record<string, unknown> | null;
export declare function resolveMigratedWorkflowKeyConflict(workflowKey: string, skillId: number): string;
