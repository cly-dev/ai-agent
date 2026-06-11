import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { IntentRecallConfigService } from '../intent/intent-recall-config.service';
import { detectIntentKind } from '../agent-engine/intent-kind.util';
import { loadSmallTalkHints } from '../intent/smalltalk-hints.util';
import { cosineSimilarity } from '../intent/vector.util';
import type { SkillRecallStageAttempt } from './skill.types';
import {
  applySkillTitleBoostToRanked,
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
import type { SkillRecallSessionContext } from './skill.types';
import {
  buildSkillRecallQuery,
  contextualRecallLiftSufficient,
  lastEpisodeGoal,
  readSkillRecallContextMode,
  readSkillRecallContextTopicMinSim,
  shouldAttemptContextualSkillRecall,
  type SkillRecallContextGateReason,
} from './skill-recall-session.util';

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

type ProgressiveRecallResult = {
  top: SkillRankedRow | null;
  ranked: SkillRankedRow[];
  source: 'vector' | 'keyword' | 'none';
  recallStage: SkillRecallStage | null;
  stageAttempts: SkillRecallStageAttempt[];
};

export type SkillTopRecallResult = {
  top: SkillRankedRow | null;
  ranked: SkillRankedRow[];
  source: 'vector' | 'keyword' | 'none';
  recallStage: SkillRecallStage | null;
  stageAttempts: SkillRecallStageAttempt[];
  recallQuery: string;
  sessionContextUsed: boolean;
  recallPhase: 'solo' | 'contextual';
  soloTopScore: number | null;
  contextualTopScore: number | null;
  contextLift: number | null;
  contextGateReason: SkillRecallContextGateReason | null;
};

@Injectable()
export class SkillRecallService {
  private readonly logger = new Logger(SkillRecallService.name);
  private readonly skillVectorCache = new Map<string, CachedSkillVector>();

  constructor(
    private readonly llmService: LlmService,
    private readonly intentRecallConfig: IntentRecallConfigService,
  ) {}

  /**
   * 两阶段召回（默认）：
   * Stage A solo（仅本轮）→ 命中即返回；
   * Stage B contextual（短句 + 有上轮 episode + 同话题 + lift 够）→ 再召回。
   */
  async recallTopSkill(
    candidates: SkillRecallCandidate[],
    userMessage: string,
    sessionContext?: SkillRecallSessionContext | null,
  ): Promise<SkillTopRecallResult> {
    const latest = userMessage.trim();
    const contextMode = readSkillRecallContextMode();

    const empty = (
      overrides: Partial<SkillTopRecallResult> = {},
    ): SkillTopRecallResult => ({
      top: null,
      ranked: [],
      source: 'none',
      recallStage: null,
      stageAttempts: [],
      recallQuery: latest,
      sessionContextUsed: false,
      recallPhase: 'solo',
      soloTopScore: null,
      contextualTopScore: null,
      contextLift: null,
      contextGateReason: null,
      ...overrides,
    });

    if (candidates.length === 0 || !latest) {
      return empty();
    }

    const intentKind = detectIntentKind(latest, loadSmallTalkHints());
    if (shouldSkipSkillRecallForQuery(latest, intentKind)) {
      this.logger.debug(
        `skill recall skipped query="${latest}" intentKind=${intentKind}`,
      );
      return empty();
    }

    const recallSettings = await this.intentRecallConfig.get();
    const vectorMinScore = resolveSkillVectorMinScore(
      recallSettings.vectorMinScore,
    );
    const keywordMinScore = readSkillKeywordMinScore();
    const recallMode = await this.intentRecallConfig.resolveRecallMode(
      await this.llmService.isEmbeddingConfigured(),
    );

    if (contextMode === 'always') {
      const legacy = buildSkillRecallQuery({
        userMessage: latest,
        session: sessionContext,
        mode: 'contextual',
      });
      const legacyResult = await this.runProgressiveRecall(
        candidates,
        legacy.query,
        latest,
        vectorMinScore,
        keywordMinScore,
        recallMode.useVector,
      );
      return {
        ...legacyResult,
        recallQuery: legacy.query,
        sessionContextUsed: legacy.sessionContextUsed,
        recallPhase: 'contextual',
        soloTopScore: null,
        contextualTopScore: legacyResult.top?.score ?? legacyResult.ranked[0]?.score ?? null,
        contextLift: null,
        contextGateReason: legacyResult.top ? 'contextual_hit' : 'contextual_miss',
      };
    }

    const soloBuilt = buildSkillRecallQuery({
      userMessage: latest,
      mode: 'solo',
    });
    const soloResult = await this.runProgressiveRecall(
      candidates,
      soloBuilt.query,
      latest,
      vectorMinScore,
      keywordMinScore,
      recallMode.useVector,
    );
    const soloTopScore = soloResult.ranked[0]?.score ?? 0;

    if (soloResult.top) {
      return {
        ...soloResult,
        recallQuery: soloBuilt.query,
        sessionContextUsed: false,
        recallPhase: 'solo',
        soloTopScore,
        contextualTopScore: null,
        contextLift: null,
        contextGateReason: 'solo_hit',
      };
    }

    const gate = shouldAttemptContextualSkillRecall({
      userMessage: latest,
      session: sessionContext,
      soloHit: false,
    });
    if (!gate.attempt) {
      return {
        ...soloResult,
        recallQuery: soloBuilt.query,
        sessionContextUsed: false,
        recallPhase: 'solo',
        soloTopScore,
        contextualTopScore: null,
        contextLift: null,
        contextGateReason: gate.reason,
      };
    }

    const priorGoal = lastEpisodeGoal(sessionContext);
    if (priorGoal && recallMode.useVector) {
      const onSameTopic = await this.isSameTopicAsPriorTurn(latest, priorGoal);
      if (!onSameTopic) {
        this.logger.debug(
          `skill contextual recall skipped new_topic query="${latest}" priorGoal="${priorGoal}"`,
        );
        return {
          ...soloResult,
          recallQuery: soloBuilt.query,
          sessionContextUsed: false,
          recallPhase: 'solo',
          soloTopScore,
          contextualTopScore: null,
          contextLift: null,
          contextGateReason: 'new_topic',
        };
      }
    }

    const contextualBuilt = buildSkillRecallQuery({
      userMessage: latest,
      session: sessionContext,
      mode: 'contextual',
    });
    const contextualResult = await this.runProgressiveRecall(
      candidates,
      contextualBuilt.query,
      latest,
      vectorMinScore,
      keywordMinScore,
      recallMode.useVector,
    );
    const contextualTop = contextualResult.top;
    const contextualTopScore = contextualTop?.score ?? 0;
    const soloScoreForContextualPick =
      contextualTop == null
        ? soloTopScore
        : (soloResult.ranked.find(
            (row) => row.skill.id === contextualTop.skill.id,
          )?.score ?? 0);
    const contextLift = contextualTopScore - soloScoreForContextualPick;

    if (
      !contextualTop ||
      !contextualRecallLiftSufficient({
        soloTopScore: soloScoreForContextualPick,
        contextualTopScore,
      })
    ) {
      const reason: SkillRecallContextGateReason = contextualTop
        ? 'lift_insufficient'
        : 'contextual_miss';
      this.logger.debug(
        `skill contextual recall ${reason} soloSameSkill=${soloScoreForContextualPick.toFixed(4)} contextualTop=${contextualTopScore.toFixed(4)} lift=${contextLift.toFixed(4)}`,
      );
      return {
        top: null,
        ranked: contextualResult.ranked,
        source: contextualResult.source,
        recallStage: contextualResult.recallStage,
        stageAttempts: [
          ...soloResult.stageAttempts,
          ...contextualResult.stageAttempts,
        ],
        recallQuery: contextualBuilt.query,
        sessionContextUsed: true,
        recallPhase: 'contextual',
        soloTopScore,
        contextualTopScore,
        contextLift,
        contextGateReason: reason,
      };
    }

    return {
      ...contextualResult,
      stageAttempts: [
        ...soloResult.stageAttempts,
        ...contextualResult.stageAttempts,
      ],
      recallQuery: contextualBuilt.query,
      sessionContextUsed: true,
      recallPhase: 'contextual',
      soloTopScore,
      contextualTopScore,
      contextLift,
      contextGateReason: 'contextual_hit',
    };
  }

  private async isSameTopicAsPriorTurn(
    userMessage: string,
    priorGoal: string,
  ): Promise<boolean> {
    try {
      const vectors = await this.llmService.embedTexts([
        userMessage,
        priorGoal,
      ]);
      const current = vectors[0];
      const prior = vectors[1];
      if (!current?.length || !prior?.length) {
        return true;
      }
      const sim = cosineSimilarity(current, prior);
      return sim >= readSkillRecallContextTopicMinSim();
    } catch (error) {
      this.logger.warn(
        `skill topic similarity check failed, allow contextual: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return true;
    }
  }

  private async runProgressiveRecall(
    candidates: SkillRecallCandidate[],
    query: string,
    titleQuery: string,
    vectorMinScore: number,
    keywordMinScore: number,
    useVector: boolean,
  ): Promise<ProgressiveRecallResult> {
    const stageAttempts: SkillRecallStageAttempt[] = [];

    const stage0 = await this.recallAtStage(
      candidates,
      query,
      titleQuery,
      'router',
      vectorMinScore,
      keywordMinScore,
      useVector,
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
        titleQuery,
        'prompt_excerpt',
        vectorMinScore,
        keywordMinScore,
        useVector,
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
    titleQuery: string,
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
      const ranked = applySkillTitleBoostToRanked(
        rankSkillsByVector(queryVector, candidates, vectorsById),
        titleQuery,
      );
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
