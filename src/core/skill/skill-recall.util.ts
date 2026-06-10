import { cosineSimilarity, tokenizeKeywordQuery } from '../intent/vector.util';

/** L0 路由短文本；L1 追加 prompt 摘要做二次召回。 */
export type SkillRecallStage = 'router' | 'prompt_excerpt';

/** 路由召回用短文本（不含全文 prompt，避免长文档污染向量/关键词）。 */
export function buildSkillRouterEmbedText(skill: {
  name: string;
  description: string | null;
  capabilityKey?: string | null;
}): string {
  const name = skill.name.trim();
  const description = skill.description?.trim() ?? '';
  const capabilityKey = skill.capabilityKey?.trim() ?? '';
  return [name, capabilityKey, description]
    .filter((part) => part.length > 0)
    .join('\n');
}

export function readSkillPromptExcerptChars(): number {
  const raw = process.env.SKILL_RECALL_PROMPT_EXCERPT_CHARS?.trim();
  const value = raw ? Number.parseInt(raw, 10) : 300;
  return Number.isFinite(value) && value > 0 ? value : 300;
}

/** L0: 仅路由；L1: 路由 + prompt 前 N 字。 */
export function buildSkillRecallEmbedText(
  skill: {
    name: string;
    description: string | null;
    capabilityKey?: string | null;
    prompt: string;
  },
  stage: SkillRecallStage,
): string {
  const router = buildSkillRouterEmbedText(skill);
  if (stage === 'router') {
    return router;
  }
  const excerpt = skill.prompt.trim().slice(0, readSkillPromptExcerptChars());
  return excerpt ? `${router}\n${excerpt}` : router;
}

/** @deprecated 使用 buildSkillRecallEmbedText(skill, 'prompt_excerpt') */
export function buildSkillEmbedText(skill: {
  name: string;
  description: string | null;
  prompt: string;
}): string {
  return buildSkillRecallEmbedText(skill, 'prompt_excerpt');
}

export type SkillRecallCandidate = {
  id: number;
  name: string;
  description: string | null;
  capabilityKey: string | null;
  prompt: string;
};

export type SkillRankedRow = {
  skill: SkillRecallCandidate;
  score: number;
  source: 'vector' | 'keyword';
};

export function isSkillProgressiveRecallEnabled(): boolean {
  return process.env.SKILL_PROGRESSIVE_RECALL !== '0';
}

export function readSkillProgressiveRecallMaxCandidates(): number {
  const raw = process.env.SKILL_PROGRESSIVE_RECALL_MAX_CANDIDATES?.trim();
  const value = raw ? Number.parseInt(raw, 10) : 5;
  return Number.isFinite(value) && value > 0 ? value : 5;
}

export function keywordSkillRecallScore(
  query: string,
  skill: SkillRecallCandidate,
  stage: SkillRecallStage = 'router',
): number {
  const hay = buildSkillRecallEmbedText(skill, stage).toLowerCase();
  const tokens = tokenizeKeywordQuery(query);
  if (tokens.length === 0) {
    return 0;
  }
  let hits = 0;
  for (const token of tokens) {
    if (hay.includes(token)) {
      hits += 1;
    }
  }
  return hits / tokens.length;
}

export function rankSkillsByKeyword(
  query: string,
  candidates: SkillRecallCandidate[],
  stage: SkillRecallStage = 'router',
): SkillRankedRow[] {
  return candidates
    .map((skill) => ({
      skill,
      score: keywordSkillRecallScore(query, skill, stage),
      source: 'keyword' as const,
    }))
    .sort((a, b) => b.score - a.score);
}

/** Skill 向量阈值：默认高于 intent（误命中代价更大）；`SKILL_VECTOR_MIN_SCORE` 可覆盖。 */
export function resolveSkillVectorMinScore(configMinScore: number): number {
  const raw = process.env.SKILL_VECTOR_MIN_SCORE?.trim();
  if (raw) {
    const value = Number.parseFloat(raw);
    if (Number.isFinite(value) && value >= 0) {
      return value;
    }
  }
  const floor = readSkillVectorMinScoreFloor();
  return Math.max(configMinScore, floor);
}

export function readSkillKeywordMinScore(): number {
  const raw = process.env.SKILL_KEYWORD_MIN_SCORE?.trim();
  if (!raw) {
    return 0.35;
  }
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value >= 0 ? value : 0.35;
}

/** 仅 1 个候选时需更高分，避免「唯一 skill」被低相关 query 误绑（L0）。 */
export function readSkillSingleCandidateMinScore(baseMinScore: number): number {
  const raw = process.env.SKILL_SINGLE_MIN_SCORE?.trim();
  if (raw) {
    const value = Number.parseFloat(raw);
    if (Number.isFinite(value) && value >= 0) {
      return value;
    }
  }
  return Math.max(baseMinScore + 0.06, 0.42);
}

/** Top-1 与 Top-2 最小分差；多候选时要求领先才命中。 */
export function readSkillRecallMinGap(): number {
  const raw = process.env.SKILL_RECALL_MIN_GAP?.trim();
  if (!raw) {
    return 0.08;
  }
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value >= 0 ? value : 0.08;
}

function readSkillVectorMinScoreFloor(): number {
  const raw = process.env.SKILL_VECTOR_MIN_SCORE_FLOOR?.trim();
  if (!raw) {
    return 0.38;
  }
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value >= 0 ? value : 0.38;
}

export function shouldSkipSkillRecallForQuery(
  query: string,
  intentKind: 'task' | 'smalltalk' | 'unclear',
): boolean {
  const text = query.trim();
  if (!text || intentKind !== 'task') {
    return true;
  }
  if (text.length < 4) {
    return true;
  }
  return false;
}

export function pickConfidentSkillTop(
  ranked: SkillRankedRow[],
  minScore: number,
  options?: { stage?: SkillRecallStage },
): SkillRankedRow | null {
  if (isNoRelevantSkillMatch(ranked, minScore)) {
    return null;
  }
  const top = ranked.find((row) => row.score >= minScore);
  if (!top) {
    return null;
  }
  if (ranked.length === 1) {
    const singleMin =
      options?.stage === 'prompt_excerpt'
        ? minScore
        : readSkillSingleCandidateMinScore(minScore);
    return top.score >= singleMin ? top : null;
  }
  const second = ranked[1];
  if (!second) {
    return top;
  }
  const gap = top.score - second.score;
  if (gap < readSkillRecallMinGap()) {
    return null;
  }
  return top;
}

export function isNoRelevantSkillMatch(
  ranked: Array<{ score: number }>,
  minScore: number,
): boolean {
  if (ranked.length === 0) {
    return true;
  }
  const threshold = minScore > 0 ? minScore : 0;
  return ranked.every((item) => item.score < threshold);
}

export function rankSkillsByVector(
  queryVector: number[],
  candidates: SkillRecallCandidate[],
  vectorsById: Map<number, number[]>,
): SkillRankedRow[] {
  return candidates
    .map((skill) => {
      const vector = vectorsById.get(skill.id);
      const score = vector ? cosineSimilarity(queryVector, vector) : 0;
      return {
        skill,
        score,
        source: 'vector' as const,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function toSkillRecallMatches(
  ranked: SkillRankedRow[],
  limit = 5,
): Array<{ id: number; name: string; score: number }> {
  return ranked.slice(0, limit).map((row) => ({
    id: row.skill.id,
    name: row.skill.name,
    score: Number(row.score.toFixed(4)),
  }));
}
