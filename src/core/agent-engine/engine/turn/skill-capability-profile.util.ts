import {
  deriveSkillRunnableKind,
  normalizeSkillRunnableCapabilities,
  skillIsHostOnlySkill,
} from '../../../skill/skill-runnable.util';
import type { SkillExecutionChannels } from '../../../workflow/derive-skill-execution-channels.util';
import type { SkillCapabilityProfile } from './skill-intent-alignment.types';

export function buildSkillCapabilityProfile(input: {
  skillId: number;
  skillName: string;
  skillToolIds?: number[];
  hostToolIds?: number[];
  runnableKind?: 'http' | 'host' | 'both';
  channels: SkillExecutionChannels;
}): SkillCapabilityProfile {
  const caps = normalizeSkillRunnableCapabilities({
    skillToolIds: input.skillToolIds,
    hostToolIds: input.hostToolIds,
  });
  const runnableKind =
    input.runnableKind ?? deriveSkillRunnableKind(caps);
  const isHostOnly = skillIsHostOnlySkill(caps);
  const hasHostTools = caps.hostToolIds.length > 0;
  const hasHttpTools = caps.skillToolIds.length > 0;
  return {
    skillId: input.skillId,
    skillName: input.skillName,
    runnableKind,
    hasHttpTools,
    hasHostTools,
    isHostOnly,
    isHttpOnly: hasHttpTools && !hasHostTools,
    channels: input.channels,
  };
}
