import type { PageContextPlanKind } from '../../../host-bridge/page-context-usage.types';
import type { SkillExecutionChannels } from '../../../workflow/derive-skill-execution-channels.util';
import type { TurnWriteChannel } from './turn-write-channel.types';
import type { TurnExecutionRoute } from '../../../host-bridge/page-context-execution-policy.util';
import type { TurnPlanSkillSelect } from './turn-execution-contract.types';
import type { TurnRespondRequest } from './turn-respond.types';

export type SkillIntentMismatchCode =
  | 'read_intent_vs_http_skill'
  | 'read_intent_vs_host_only_skill'
  | 'write_intent_vs_http_only_skill'
  | 'write_intent_vs_no_host_skill'
  | 'direct_answer_vs_any_skill'
  | 'orchestrated_http_vs_host_only_skill';

export type SkillIntentMismatchPolicy = 'intent_first' | 'clarify';

export type SkillCapabilityProfile = {
  skillId: number;
  skillName: string;
  runnableKind: 'http' | 'host' | 'both';
  hasHttpTools: boolean;
  hasHostTools: boolean;
  isHostOnly: boolean;
  isHttpOnly: boolean;
  channels: SkillExecutionChannels;
};

/** 结构化用户意图（只读视图，供 Skill 对齐）。 */
export type TurnUserIntent = {
  route: TurnExecutionRoute;
  readPlanActive: boolean;
  pageContextPlan: PageContextPlanKind;
  writeChannel: TurnWriteChannel;
  hostMutation: boolean;
  httpOrchestrated: boolean;
};

export type SkillIntentAlignmentSnapshot = {
  status: 'none' | 'aligned' | 'intent_first' | 'clarified';
  code?: SkillIntentMismatchCode;
  requestedSkillId?: number;
  droppedExplicitSkill?: boolean;
};

export type SkillIntentAlignmentResult =
  | { status: 'no_requested_skill' }
  | { status: 'aligned' }
  | {
      status: 'intent_first';
      code: SkillIntentMismatchCode;
      requestedSkillId: number;
      effectiveSkillSelect: TurnPlanSkillSelect;
      effectiveExplicitSkillId: number | null;
      effectivePageHostSkillId: number | null;
    }
  | {
      status: 'clarify';
      code: SkillIntentMismatchCode;
      requestedSkillId: number;
      respond: TurnRespondRequest;
    };
