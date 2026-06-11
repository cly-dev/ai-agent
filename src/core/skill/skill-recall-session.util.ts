import type { SessionGoaPayload } from '../memory/goa/session-goa.types';
import type { SkillRecallSessionContext } from './skill.types';

const DEFAULT_RECALL_QUERY_MAX_CHARS = 1200;

export type SkillRecallContextGateReason =
  | 'solo_hit'
  | 'context_disabled'
  | 'no_prior_episode'
  | 'new_topic'
  | 'lift_insufficient'
  | 'contextual_miss'
  | 'contextual_hit'
  | 'contextual_eligible';

export function readSkillRecallQueryMaxChars(): number {
  const raw = process.env.SKILL_RECALL_QUERY_MAX_CHARS?.trim();
  const value = raw ? Number.parseInt(raw, 10) : DEFAULT_RECALL_QUERY_MAX_CHARS;
  return Number.isFinite(value) && value > 200 ? value : DEFAULT_RECALL_QUERY_MAX_CHARS;
}

export function isSkillRecallSessionContextEnabled(): boolean {
  return process.env.SKILL_RECALL_SESSION_CONTEXT !== '0';
}

/** two_stage（默认）| always（遗留：首轮即拼上下文，易粘连） */
export function readSkillRecallContextMode(): 'two_stage' | 'always' {
  const raw = process.env.SKILL_RECALL_CONTEXT_MODE?.trim().toLowerCase();
  return raw === 'always' ? 'always' : 'two_stage';
}

export function readSkillRecallContextEpisodeTail(): number {
  const raw = process.env.SKILL_RECALL_CONTEXT_EPISODE_TAIL?.trim();
  const value = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function readSkillRecallContextMinLift(): number {
  const raw = process.env.SKILL_RECALL_CONTEXT_MIN_LIFT?.trim();
  const value = raw ? Number.parseFloat(raw) : 0.06;
  return Number.isFinite(value) && value >= 0 ? value : 0.06;
}

export function readSkillRecallContextTopicMinSim(): number {
  const raw = process.env.SKILL_RECALL_CONTEXT_TOPIC_MIN_SIM?.trim();
  const value = raw ? Number.parseFloat(raw) : 0.35;
  return Number.isFinite(value) && value >= 0 ? value : 0.35;
}

/** @deprecated 使用 readSkillRecallContextMinLift */
export function readSkillSessionRecallMinLift(): number {
  return readSkillRecallContextMinLift();
}

/** 从 GOA 提取 skill 二次召回用的会话摘要（不含 observation JSON）。 */
export function buildSkillRecallSessionContextFromGoa(
  goa: SessionGoaPayload | null | undefined,
): SkillRecallSessionContext | null {
  if (!goa || !isSkillRecallSessionContextEnabled()) {
    return null;
  }
  const tail = readSkillRecallContextEpisodeTail();
  const episodes = goa.recentEpisodes.slice(-tail);
  const recentEpisodeGoals = episodes
    .map((row) => row.goal.trim())
    .filter((row) => row.length > 0);

  const activeTask =
    goa.activeTask?.status === 'abandoned' ? null : goa.activeTask;

  const context: SkillRecallSessionContext = {
    recentEpisodeGoals,
    activeTaskDeliverable: activeTask?.plan.deliverable?.trim() ?? null,
  };

  return hasFollowUpEpisodeContext(context) ? context : null;
}

export function hasFollowUpEpisodeContext(
  context: SkillRecallSessionContext | null | undefined,
): boolean {
  return (context?.recentEpisodeGoals?.length ?? 0) > 0;
}

/** @deprecated 使用 hasFollowUpEpisodeContext */
export function hasMeaningfulSkillRecallSessionContext(
  context: SkillRecallSessionContext | null | undefined,
): boolean {
  return hasFollowUpEpisodeContext(context);
}

export function lastEpisodeGoal(
  context: SkillRecallSessionContext | null | undefined,
): string | null {
  const goals = context?.recentEpisodeGoals;
  if (!goals?.length) {
    return null;
  }
  return goals[goals.length - 1]?.trim() || null;
}

/**
 * 是否值得做 Stage B 上下文二次召回（结构信号，无硬编码意图词表）：
 * - solo 未命中
 * - 有上一轮 episode
 * 新话题由 service 层 topic 相似度 gate 拦截，不在此按字数判断。
 */
export function shouldAttemptContextualSkillRecall(input: {
  userMessage: string;
  session?: SkillRecallSessionContext | null;
  soloHit: boolean;
}): { attempt: boolean; reason: SkillRecallContextGateReason } {
  if (!isSkillRecallSessionContextEnabled()) {
    return { attempt: false, reason: 'context_disabled' };
  }
  if (input.soloHit) {
    return { attempt: false, reason: 'solo_hit' };
  }
  const latest = input.userMessage.trim();
  if (!latest || !hasFollowUpEpisodeContext(input.session)) {
    return { attempt: false, reason: 'no_prior_episode' };
  }
  return { attempt: true, reason: 'contextual_eligible' };
}

/** @deprecated 使用 shouldAttemptContextualSkillRecall */
export function shouldRetrySkillRecallWithSessionContext(input: {
  userMessage: string;
  session?: SkillRecallSessionContext | null;
  soloHit: boolean;
}): boolean {
  return shouldAttemptContextualSkillRecall(input).attempt;
}

/**
 * 构建 skill 召回 query。
 * - solo：仅本轮用户句（Stage A 默认）
 * - contextual：本轮 + 最近 1 轮 goal +（可选）deliverable（Stage B）
 */
export function buildSkillRecallQuery(input: {
  userMessage: string;
  session?: SkillRecallSessionContext | null;
  mode?: 'solo' | 'contextual';
}): { query: string; sessionContextUsed: boolean } {
  const latest = input.userMessage.trim();
  if (!latest) {
    return { query: '', sessionContextUsed: false };
  }
  if (
    input.mode !== 'contextual' &&
    readSkillRecallContextMode() !== 'always'
  ) {
    return { query: latest, sessionContextUsed: false };
  }

  const session = input.session;
  if (!hasFollowUpEpisodeContext(session)) {
    return { query: latest, sessionContextUsed: false };
  }

  const lines: string[] = [latest];
  const lastGoal = lastEpisodeGoal(session);
  if (lastGoal) {
    lines.push(`Prior turn goal: ${lastGoal}`);
  }
  const deliverable = session!.activeTaskDeliverable?.trim();
  if (deliverable) {
    lines.push(`Session deliverable: ${deliverable}`);
  }

  const maxChars = readSkillRecallQueryMaxChars();
  let query = lines.join('\n');
  if (query.length > maxChars) {
    query = `${query.slice(0, maxChars)}…`;
  }
  return { query, sessionContextUsed: true };
}

/** 上下文召回相对 solo 的分数增益是否足够（防粘连）。 */
export function contextualRecallLiftSufficient(input: {
  soloTopScore: number;
  contextualTopScore: number;
}): boolean {
  return (
    input.contextualTopScore - input.soloTopScore >=
    readSkillRecallContextMinLift()
  );
}

/** @deprecated 使用 contextualRecallLiftSufficient */
export function sessionAugmentedRecallLiftSufficient(input: {
  soloTopScore: number;
  augmentedTopScore: number;
}): boolean {
  return contextualRecallLiftSufficient({
    soloTopScore: input.soloTopScore,
    contextualTopScore: input.augmentedTopScore,
  });
}

export function truncateSkillRecallQueryForLog(query: string, max = 400): string {
  const trimmed = query.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max)}…`;
}
