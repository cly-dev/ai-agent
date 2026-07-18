import type { PrismaService } from '../../prisma/prisma.service';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
export type SkillWorkflowBinding = {
    flowId?: number | null;
    flowVersion?: number | null;
    workflowId?: number | null;
    workflowVersion?: number | null;
    workflowOverrides?: unknown;
};
export declare function tryBuildTaskPlanFromSkillWorkflow(prisma: PrismaService, input: {
    appClientId: number;
    userMessage: string;
    binding: SkillWorkflowBinding;
    goal?: string;
    allowedToolIds?: number[];
    allowedHostToolIds?: number[];
}): Promise<TaskPlanSnapshot | null>;
