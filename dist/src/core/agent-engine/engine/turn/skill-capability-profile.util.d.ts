import type { SkillExecutionChannels } from '../../../workflow/derive-skill-execution-channels.util';
import type { SkillCapabilityProfile } from './skill-intent-alignment.types';
export declare function buildSkillCapabilityProfile(input: {
    skillId: number;
    skillName: string;
    skillToolIds?: number[];
    hostToolIds?: number[];
    runnableKind?: 'http' | 'host' | 'both';
    channels: SkillExecutionChannels;
}): SkillCapabilityProfile;
