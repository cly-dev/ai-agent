import type { LlmChatMessage } from '../llm.types';
import type {
  FitMessagesResult,
  FitReport,
  PromptBudgetHints,
} from './prompt-budget.types';
import {
  isPromptBudgetEnabled,
  getPromptBudgetSafetyMarginRatio,
  getPromptBudgetReserveTokens,
} from './prompt-budget.constants';
import { applyCallKindPolicyToBlock, resolveCallKindPolicy } from './call-kind-policy.util';
import { applyDegradeToBlock, mergeSessionHistoryTurnBlocks } from './apply-block-degrade.util';
import { parsePromptBlocks } from './prompt-block-parser.util';
import {
  estimateBlocksTokens,
  pickNextDegradeCandidate,
  renderPromptBlocks,
  nextDegradeLevel,
} from './prompt-block-render.util';

function computeEffectiveBudget(budget: number): number {
  const margin = getPromptBudgetSafetyMarginRatio();
  const reserve = getPromptBudgetReserveTokens();
  return Math.max(256, Math.floor(budget * (1 - margin)) - reserve);
}

function estimateRawMessagesTokens(
  messages: LlmChatMessage[],
  hints?: PromptBudgetHints,
): number {
  const blocks = parsePromptBlocks(messages, { callKind: hints?.callKind });
  return estimateBlocksTokens(blocks);
}

function buildSkippedReport(budget: number, tokensBefore: number): FitReport {
  return {
    enabled: isPromptBudgetEnabled(),
    skipped: true,
    budget,
    tokensBefore,
    tokensAfter: tokensBefore,
    fitted: true,
    degradations: [],
    warnings: [],
  };
}

export function fitPromptToBudget(
  messages: LlmChatMessage[],
  budget: number,
  hints?: PromptBudgetHints,
): FitMessagesResult {
  const policy = resolveCallKindPolicy(hints?.callKind, hints?.skipFit);
  const parseOptions = { callKind: hints?.callKind };
  const tokensBefore = estimateRawMessagesTokens(messages, hints);

  if (!isPromptBudgetEnabled() || policy.skipFit) {
    return {
      messages,
      report: buildSkippedReport(budget, tokensBefore),
    };
  }

  const effectiveBudget = computeEffectiveBudget(budget);
  const originals = mergeSessionHistoryTurnBlocks(
    parsePromptBlocks(messages, parseOptions).map((block) => ({
      ...block,
      payload: structuredClone(block.payload),
    })),
  );

  for (const block of originals) {
    block.maxDegradeLevel = applyCallKindPolicyToBlock(
      block.kind,
      block.maxDegradeLevel,
      policy,
    );
  }

  const degradeLevels = new Map<string, import('./prompt-budget.types').DegradeLevel>(
    originals.map((block) => [block.id, 0]),
  );

  const materialize = () =>
    originals.map((original) =>
      applyDegradeToBlock(
        {
          ...original,
          degradeLevel: 0,
          payload: structuredClone(original.payload),
        },
        degradeLevels.get(original.id) ?? 0,
      ),
    );

  let blocks = materialize();
  let tokensAfter = estimateBlocksTokens(blocks);
  const degradations: FitReport['degradations'] = [];
  const warnings: string[] = [];

  let guard = 0;
  const exhaustedBlockIds = new Set<string>();
  while (tokensAfter > effectiveBudget && guard < 200) {
    guard += 1;
    const candidates = blocks
      .filter((block) => !exhaustedBlockIds.has(block.id))
      .map((block) => ({
        ...block,
        degradeLevel: degradeLevels.get(block.id) ?? 0,
      }));
    const candidate = pickNextDegradeCandidate(candidates);
    if (!candidate) {
      warnings.push(
        `prompt budget exceeded after degradations tokens=${tokensAfter} budget=${effectiveBudget}`,
      );
      break;
    }
    const previousLevel = degradeLevels.get(candidate.id) ?? 0;
    const nextLevel = nextDegradeLevel(previousLevel);
    if (nextLevel > candidate.maxDegradeLevel) {
      exhaustedBlockIds.add(candidate.id);
      continue;
    }
    degradeLevels.set(candidate.id, nextLevel);
    blocks = materialize();
    const nextTokens = estimateBlocksTokens(blocks);
    if (nextTokens >= tokensAfter) {
      if (nextLevel >= candidate.maxDegradeLevel) {
        exhaustedBlockIds.add(candidate.id);
      }
    } else {
      tokensAfter = nextTokens;
    }
    degradations.push({
      blockId: candidate.id,
      kind: candidate.kind,
      sourceMessageIndex: candidate.sourceMessageIndex,
      fromLevel: previousLevel,
      toLevel: nextLevel,
      tokensBefore: tokensAfter,
      tokensAfter: nextTokens,
    });
  }

  const report: FitReport = {
    enabled: true,
    skipped: false,
    callKind: hints?.callKind,
    budget: effectiveBudget,
    tokensBefore,
    tokensAfter,
    fitted: tokensAfter <= effectiveBudget,
    degradations,
    warnings,
  };

  return {
    messages: renderPromptBlocks(blocks),
    report,
  };
}
