import type { AvailableSkillRow } from '../../../../skill/skill.types';
import type { AgentEngineTool } from '../types/agent-engine.types';
import type { OuterPlanSkillSummary, ResolveOuterPlanInput } from './task-plan.types';
export declare function toRequestedSkillPlanDetail(skill: AvailableSkillRow | undefined): ResolveOuterPlanInput['requestedSkillDetail'];
export declare function summarizeAvailableSkillsForOuterPlan(skills: AvailableSkillRow[], scopedTools: AgentEngineTool[], scopedHostToolIds?: number[]): OuterPlanSkillSummary[];
