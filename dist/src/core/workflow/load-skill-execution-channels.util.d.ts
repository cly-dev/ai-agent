import type { PrismaService } from '../../prisma/prisma.service';
import { type SkillExecutionChannels } from './derive-skill-execution-channels.util';
export declare function loadSkillExecutionChannels(prisma: PrismaService, input: {
    flowId?: number | null;
    flowVersion?: number | null;
    workflowId?: number | null;
    workflowVersion?: number | null;
    skillToolIds: readonly number[];
    hostToolIds: readonly number[];
}): Promise<SkillExecutionChannels>;
