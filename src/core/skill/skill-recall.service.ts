import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { IntentRecallConfigService } from '../intent/intent-recall-config.service';
import { detectIntentKind } from '../agent-engine/intent-kind.util';
import { loadSmallTalkHints } from '../intent/smalltalk-hints.util';
import {
  buildSkillRouterEmbedText,
  pickConfidentSkillTop,
  rankSkillsByKeyword,
  rankSkillsByVector,
  readSkillKeywordMinScore,
  resolveSkillVectorMinScore,
  shouldSkipSkillRecallForQuery,
  type SkillRankedRow,
  type SkillRecallCandidate,
} from './skill-recall.util';

type CachedSkillVector = {
  fingerprint: string;
  vector: number[];
};

export type SkillTopRecallResult = {
  top: SkillRankedRow | null;
  ranked: SkillRankedRow[];
  source: 'vector' | 'keyword' | 'none';
};

@Injectable()
export class SkillRecallService {
  private readonly logger = new Logger(SkillRecallService.name);
  private readonly skillVectorCache = new Map<number, CachedSkillVector>();

  constructor(
    private readonly llmService: LlmService,
    private readonly intentRecallConfig: IntentRecallConfigService,
  ) {}

  /** 向量 Top-1 优先；embedding 失败且允许降级时走关键词。 */
  async recallTopSkill(
    candidates: SkillRecallCandidate[],
    userMessage: string,
  ): Promise<SkillTopRecallResult> {
    const query = userMessage.trim();
    if (candidates.length === 0 || !query) {
      return { top: null, ranked: [], source: 'none' };
    }
    const intentKind = detectIntentKind(query, loadSmallTalkHints());
    if (shouldSkipSkillRecallForQuery(query, intentKind)) {
      this.logger.debug(
        `skill recall skipped query="${query}" intentKind=${intentKind}`,
      );
      return { top: null, ranked: [], source: 'none' };
    }

    const recallSettings = await this.intentRecallConfig.get();
    const vectorMinScore = resolveSkillVectorMinScore(
      recallSettings.vectorMinScore,
    );
    const keywordMinScore = readSkillKeywordMinScore();
    const recallMode = await this.intentRecallConfig.resolveRecallMode(
      await this.llmService.isEmbeddingConfigured(),
    );

    if (!recallMode.useVector) {
      const ranked = rankSkillsByKeyword(query, candidates);
      const top = pickConfidentSkillTop(ranked, keywordMinScore);
      this.logRecallDecision(query, ranked, keywordMinScore, top, 'keyword');
      return {
        top,
        ranked: ranked.slice(0, 5),
        source: top ? 'keyword' : 'none',
      };
    }

    try {
      const queryVector = (await this.llmService.embedTexts([query]))[0];
      if (!queryVector) {
        throw new Error('empty query embedding');
      }
      const vectorsById = await this.ensureSkillVectors(candidates);
      const ranked = rankSkillsByVector(queryVector, candidates, vectorsById);
      const top = pickConfidentSkillTop(ranked, vectorMinScore);
      this.logRecallDecision(query, ranked, vectorMinScore, top, 'vector');
      return {
        top,
        ranked: ranked.slice(0, 5),
        source: top ? 'vector' : 'none',
      };
    } catch (error) {
      const fallback = await this.intentRecallConfig.shouldFallbackToKeywordOnError();
      if (!fallback) {
        throw error;
      }
      this.logger.warn(
        `skill vector recall failed, fallback keyword: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const ranked = rankSkillsByKeyword(query, candidates);
      const top = pickConfidentSkillTop(ranked, keywordMinScore);
      this.logRecallDecision(query, ranked, keywordMinScore, top, 'keyword');
      return {
        top,
        ranked: ranked.slice(0, 5),
        source: top ? 'keyword' : 'none',
      };
    }
  }

  private logRecallDecision(
    query: string,
    ranked: SkillRankedRow[],
    minScore: number,
    top: SkillRankedRow | null,
    mode: 'vector' | 'keyword',
  ): void {
    const preview = ranked
      .slice(0, 3)
      .map(
        (row) =>
          `${row.skill.id}:${row.skill.name}:${row.score.toFixed(4)}`,
      )
      .join(', ');
    this.logger.debug(
      `skill recall ${mode} query="${query}" minScore=${minScore} top=${
        top
          ? `${top.skill.id}:${top.score.toFixed(4)}`
          : 'none'
      } ranked=[${preview || ''}]`,
    );
  }

  private async ensureSkillVectors(
    candidates: SkillRecallCandidate[],
  ): Promise<Map<number, number[]>> {
    const vectorsById = new Map<number, number[]>();
    const missing: SkillRecallCandidate[] = [];
    const missingTexts: string[] = [];

    for (const skill of candidates) {
      const fingerprint = buildSkillRouterEmbedText(skill);
      const cached = this.skillVectorCache.get(skill.id);
      if (cached && cached.fingerprint === fingerprint) {
        vectorsById.set(skill.id, cached.vector);
        continue;
      }
      missing.push(skill);
      missingTexts.push(fingerprint);
    }

    if (missing.length > 0) {
      const vectors = await this.llmService.embedTexts(missingTexts);
      for (let index = 0; index < missing.length; index += 1) {
        const skill = missing[index];
        const vector = vectors[index];
        const fingerprint = missingTexts[index];
        if (!vector) {
          continue;
        }
        this.skillVectorCache.set(skill.id, { fingerprint, vector });
        vectorsById.set(skill.id, vector);
      }
    }

    return vectorsById;
  }
}
