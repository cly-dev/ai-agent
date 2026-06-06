import { cosineSimilarity, tokenizeKeywordQuery } from '../intent/vector.util';

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

/** @deprecated 关键词降级仍可用 prompt 摘要增强命中 */
export function buildSkillEmbedText(skill: {
  name: string;
  description: string | null;
  prompt: string;
}): string {
  const router = buildSkillRouterEmbedText(skill);
  const promptExcerpt = skill.prompt.trim().slice(0, 200);
  return promptExcerpt ? `${router}\n${promptExcerpt}` : router;
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

/** Skill 关键词召回（向量不可用或失败时的降级；仅用路由短文本，避免 prompt 污染）。 */
export function keywordSkillRecallScore(
  query: string,
  skill: SkillRecallCandidate,
): number {
  const hay = buildSkillRouterEmbedText(skill).toLowerCase();
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
): SkillRankedRow[] {
  return candidates
    .map((skill) => ({
      skill,
      score: keywordSkillRecallScore(query, skill),
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

/** 仅 1 个候选时需更高分，避免「唯一 skill」被低相关 query 误绑。 */
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
): SkillRankedRow | null {
  if (isNoRelevantSkillMatch(ranked, minScore)) {
    return null;
  }
  const top = ranked.find((row) => row.score >= minScore);
  if (!top) {
    return null;
  }
  if (ranked.length === 1) {
    const singleMin = readSkillSingleCandidateMinScore(minScore);
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
