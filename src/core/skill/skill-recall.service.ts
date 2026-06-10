import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { IntentRecallConfigService } from '../intent/intent-recall-config.service';
import { detectIntentKind } from '../agent-engine/intent-kind.util';
import { loadSmallTalkHints } from '../intent/smalltalk-hints.util';
import type { SkillRecallStageAttempt } from './skill.types';
import {
  buildSkillRecallEmbedText,
  isSkillProgressiveRecallEnabled,
  pickConfidentSkillTop,
  rankSkillsByKeyword,
  rankSkillsByVector,
  readSkillKeywordMinScore,
  readSkillProgressiveRecallMaxCandidates,
  resolveSkillVectorMinScore,
  shouldSkipSkillRecallForQuery,
  toSkillRecallMatches,
} from './skill-recall.util';
import type {
  SkillRankedRow,
  SkillRecallCandidate,
  SkillRecallStage,
} from './skill-recall.util';

type CachedSkillVector = {
  fingerprint: string;
  vector: number[];
};

type StageRecallResult = {
  top: SkillRankedRow | null;
  ranked: SkillRankedRow[];
  source: 'vector' | 'keyword' | 'none';
  stage: SkillRecallStage;
  minScore: number;
};

export type SkillTopRecallResult = {
  top: SkillRankedRow | null;
  ranked: SkillRankedRow[];
  source: 'vector' | 'keyword' | 'none';
  recallStage: SkillRecallStage | null;
  stageAttempts: SkillRecallStageAttempt[];
};

@Injectable()
export class SkillRecallService {
  private readonly logger = new Logger(SkillRecallService.name);
  private readonly skillVectorCache = new Map<string, CachedSkillVector>();

  constructor(
    private readonly llmService: LlmService,
    private readonly intentRecallConfig: IntentRecallConfigService,
  ) {}

  /** L0 路由召回；L0 miss 且候选不多时 L1 prompt 摘要二次召回。 */
  async recallTopSkill(
    candidates: SkillRecallCandidate[],
    userMessage: string,
  ): Promise<SkillTopRecallResult> {
    const query = userMessage.trim();
    const empty: SkillTopRecallResult = {
      top: null,
      ranked: [],
      source: 'none',
      recallStage: null,
      stageAttempts: [],
    };
    if (candidates.length === 0 || !query) {
      return empty;
    }
    const intentKind = detectIntentKind(query, loadSmallTalkHints());
    if (shouldSkipSkillRecallForQuery(query, intentKind)) {
      this.logger.debug(
        `skill recall skipped query="${query}" intentKind=${intentKind}`,
      );
      return empty;
    }

    const recallSettings = await this.intentRecallConfig.get();
    const vectorMinScore = resolveSkillVectorMinScore(
      recallSettings.vectorMinScore,
    );
    const keywordMinScore = readSkillKeywordMinScore();
    const recallMode = await this.intentRecallConfig.resolveRecallMode(
      await this.llmService.isEmbeddingConfigured(),
    );

    const stageAttempts: SkillRecallStageAttempt[] = [];

    const stage0 = await this.recallAtStage(
      candidates,
      query,
      'router',
      vectorMinScore,
      keywordMinScore,
      recallMode.useVector,
    );
    stageAttempts.push(this.toStageAttempt(stage0));
    if (stage0.top) {
      return {
        top: stage0.top,
        ranked: stage0.ranked,
        source: stage0.source,
        recallStage: 'router',
        stageAttempts,
      };
    }

    const runStage1 =
      isSkillProgressiveRecallEnabled() &&
      candidates.length <= readSkillProgressiveRecallMaxCandidates();
    if (runStage1) {
      const stage1 = await this.recallAtStage(
        candidates,
        query,
        'prompt_excerpt',
        vectorMinScore,
        keywordMinScore,
        recallMode.useVector,
      );
      stageAttempts.push(this.toStageAttempt(stage1));
      return {
        top: stage1.top,
        ranked: stage1.ranked,
        source: stage1.source,
        recallStage: 'prompt_excerpt',
        stageAttempts,
      };
    }

    return {
      top: null,
      ranked: stage0.ranked,
      source: stage0.source,
      recallStage: 'router',
      stageAttempts,
    };
  }

  private toStageAttempt(result: StageRecallResult): SkillRecallStageAttempt {
    return {
      stage: result.stage,
      source: result.source,
      minScore: result.minScore,
      matches: toSkillRecallMatches(result.ranked),
      hit: result.top != null,
    };
  }

  private async recallAtStage(
    candidates: SkillRecallCandidate[],
    query: string,
    stage: SkillRecallStage,
    vectorMinScore: number,
    keywordMinScore: number,
    useVector: boolean,
  ): Promise<StageRecallResult> {
    if (!useVector) {
      return this.recallKeywordAtStage(
        candidates,
        query,
        stage,
        keywordMinScore,
      );
    }

    try {
      const queryVector = (await this.llmService.embedTexts([query]))[0];
      if (!queryVector) {
        throw new Error('empty query embedding');
      }
      const vectorsById = await this.ensureSkillVectors(candidates, stage);
      const ranked = rankSkillsByVector(queryVector, candidates, vectorsById);
      const top = pickConfidentSkillTop(ranked, vectorMinScore, { stage });
      this.logRecallDecision(
        query,
        ranked,
        vectorMinScore,
        top,
        'vector',
        stage,
      );
      return {
        top,
        ranked: ranked.slice(0, 5),
        source: top ? 'vector' : 'none',
        stage,
        minScore: vectorMinScore,
      };
    } catch (error) {
      const fallback = await this.intentRecallConfig.shouldFallbackToKeywordOnError();
      if (!fallback) {
        throw error;
      }
      this.logger.warn(
        `skill vector recall failed stage=${stage}, fallback keyword: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.recallKeywordAtStage(
        candidates,
        query,
        stage,
        keywordMinScore,
      );
    }
  }

  private recallKeywordAtStage(
    candidates: SkillRecallCandidate[],
    query: string,
    stage: SkillRecallStage,
    keywordMinScore: number,
  ): StageRecallResult {
    const ranked = rankSkillsByKeyword(query, candidates, stage);
    const top = pickConfidentSkillTop(ranked, keywordMinScore, { stage });
    this.logRecallDecision(
      query,
      ranked,
      keywordMinScore,
      top,
      'keyword',
      stage,
    );
    return {
      top,
      ranked: ranked.slice(0, 5),
      source: top ? 'keyword' : 'none',
      stage,
      minScore: keywordMinScore,
    };
  }

  private logRecallDecision(
    query: string,
    ranked: SkillRankedRow[],
    minScore: number,
    top: SkillRankedRow | null,
    mode: 'vector' | 'keyword',
    stage: SkillRecallStage,
  ): void {
    const preview = ranked
      .slice(0, 3)
      .map(
        (row) =>
          `${row.skill.id}:${row.skill.name}:${row.score.toFixed(4)}`,
      )
      .join(', ');
    this.logger.debug(
      `skill recall ${mode} stage=${stage} query="${query}" minScore=${minScore} top=${
        top
          ? `${top.skill.id}:${top.score.toFixed(4)}`
          : 'none'
      } ranked=[${preview || ''}]`,
    );
  }

  private vectorCacheKey(skillId: number, stage: SkillRecallStage): string {
    return `${skillId}:${stage}`;
  }

  private async ensureSkillVectors(
    candidates: SkillRecallCandidate[],
    stage: SkillRecallStage,
  ): Promise<Map<number, number[]>> {
    const vectorsById = new Map<number, number[]>();
    const missing: SkillRecallCandidate[] = [];
    const missingTexts: string[] = [];

    for (const skill of candidates) {
      const fingerprint = buildSkillRecallEmbedText(skill, stage);
      const cacheKey = this.vectorCacheKey(skill.id, stage);
      const cached = this.skillVectorCache.get(cacheKey);
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
        const cacheKey = this.vectorCacheKey(skill.id, stage);
        this.skillVectorCache.set(cacheKey, { fingerprint, vector });
        vectorsById.set(skill.id, vector);
      }
    }

    return vectorsById;
  }
}
