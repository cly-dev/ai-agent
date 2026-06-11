import { Injectable, Logger } from '@nestjs/common';
import { ToolEngineService } from '../tool-engine/tool-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AgentEngineTool } from '../agent-engine/engine/main/agent-engine.types';
import { SkillRecallService } from './skill-recall.service';
import type { SkillTopRecallResult } from './skill-recall.service';
import type {
  SkillRecallObservability,
  SkillResolveHit,
  SkillResolveInput,
  SkillResolveResult,
} from './skill.types';
import { toSkillRecallMatches } from './skill-recall.util';
import { truncateSkillRecallQueryForLog } from './skill-recall-session.util';

@Injectable()
export class SkillService {
  private readonly logger = new Logger(SkillService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly toolEngine: ToolEngineService,
    private readonly skillRecall: SkillRecallService,
  ) {}

  /**
   * 在 allowedTools 上召回 Top-1 Skill，gate 后返回可 bind 工具集。
   * 召回：向量相似度优先，失败或未配置 embedding 时关键词降级。
   */
  async resolveForRun(input: SkillResolveInput): Promise<SkillResolveResult> {
    if (input.allowedTools.length === 0) {
      return { hit: false, reason: 'tools_disabled' };
    }

    const userApp = await this.prisma.userApp.findFirst({
      where: { userId: input.userId, appId: input.appClientId },
      select: { roleId: true },
    });
    if (!userApp) {
      return { hit: false, reason: 'no_user_app' };
    }

    const allowedIdSet = new Set(input.allowedTools.map((tool) => tool.id));
    const roleSkillCount = await this.prisma.roleSkill.count({
      where: { roleId: userApp.roleId },
    });
    const roleSkillFiltered = roleSkillCount > 0;

    const candidates = await this.prisma.skill.findMany({
      where: {
        agentId: input.agentId,
        isActive: true,
        skillTools: {
          some: { toolId: { in: [...allowedIdSet] } },
        },
        ...(roleSkillFiltered
          ? { roleSkills: { some: { roleId: userApp.roleId } } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        prompt: true,
        config: true,
        riskLevel: true,
        capabilityKey: true,
        skillTools: { select: { toolId: true } },
      },
    });

    if (candidates.length === 0) {
      return {
        hit: false,
        reason: 'no_candidates',
        candidateCount: 0,
      };
    }

    const recall = await this.skillRecall.recallTopSkill(
      candidates.map((skill) => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        capabilityKey: skill.capabilityKey,
        prompt: skill.prompt,
      })),
      input.userMessage,
      input.sessionContext,
    );
    const recallObservability = this.buildRecallObservability(recall);
    const top = recall.top;
    if (!top) {
      this.logger.debug(
        `skill recall miss agentId=${input.agentId} candidates=${candidates.length} source=${recall.source} stage=${recall.recallStage ?? 'none'}`,
      );
      return {
        hit: false,
        reason: 'no_relevant_match',
        candidateCount: candidates.length,
        ...recallObservability,
      };
    }

    const picked = candidates.find((skill) => skill.id === top.skill.id);
    if (!picked) {
      return {
        hit: false,
        reason: 'no_relevant_match',
        candidateCount: candidates.length,
        ...recallObservability,
      };
    }

    const skillToolIds = new Set(picked.skillTools.map((row) => row.toolId));
    const scopedTools = input.allowedTools.filter((tool) =>
      skillToolIds.has(tool.id),
    );
    if (scopedTools.length === 0) {
      return {
        hit: false,
        reason: 'empty_gate',
        candidateCount: candidates.length,
        ...recallObservability,
      };
    }

    const scopedAllowedToolIds = scopedTools.map((tool) => tool.id);
    const scopedToolBundle = this.toolEngine.buildLangChainTools(scopedTools, {
      ...input.toolBuildCtx,
      allowedToolIds: scopedAllowedToolIds,
    });

    const hit: SkillResolveHit = {
      hit: true,
      skill: {
        id: picked.id,
        name: picked.name,
        description: picked.description,
        prompt: picked.prompt,
        config: picked.config,
        riskLevel: picked.riskLevel,
        capabilityKey: picked.capabilityKey,
      },
      scopedTools: scopedTools as AgentEngineTool[],
      scopedAllowedToolIds,
      scopedToolBundle,
      gatedToolCount: scopedTools.length,
      allowedToolCount: input.allowedTools.length,
      recallSource: top.source,
      recallScore: top.score,
      recallMatches: toSkillRecallMatches(recall.ranked),
      recallStage: recall.recallStage ?? 'router',
      recallStageAttempts: recall.stageAttempts,
      roleSkillFiltered,
      recallQuery: truncateSkillRecallQueryForLog(recall.recallQuery),
      sessionContextUsed: recall.sessionContextUsed,
      recallPhase: recall.recallPhase,
      soloTopScore: recall.soloTopScore,
      contextualTopScore: recall.contextualTopScore,
      contextLift: recall.contextLift,
      contextGateReason: recall.contextGateReason,
    };
    this.logger.debug(
      `skill recall hit agentId=${input.agentId} skillId=${hit.skill.id} name=${hit.skill.name} phase=${hit.recallPhase} source=${hit.recallSource} stage=${hit.recallStage} gated=${hit.gatedToolCount}/${hit.allowedToolCount} score=${hit.recallScore.toFixed(4)} lift=${hit.contextLift?.toFixed(4) ?? 'n/a'}`,
    );
    return hit;
  }

  private buildRecallObservability(
    recall: SkillTopRecallResult,
  ): SkillRecallObservability {
    return {
      recallStage: recall.recallStage,
      recallSource: recall.source,
      recallMatches: toSkillRecallMatches(recall.ranked),
      recallStageAttempts: recall.stageAttempts,
      recallQuery: truncateSkillRecallQueryForLog(recall.recallQuery),
      sessionContextUsed: recall.sessionContextUsed,
      recallPhase: recall.recallPhase,
      soloTopScore: recall.soloTopScore,
      contextualTopScore: recall.contextualTopScore,
      contextLift: recall.contextLift,
      contextGateReason: recall.contextGateReason,
    };
  }
}
